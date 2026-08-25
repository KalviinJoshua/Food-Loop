import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  User,
  DonationPost,
  ReceiverRequest,
  RatingReview,
  UserRole,
  DonationStatus,
  ChatMessage,
  FssaiVerificationResult,
  AppNotification,
  TrackingStatus,
  TrackingEvent,
} from '../types';
import {
  ALL_MOCK_USERS,
  INITIAL_DONATION_POSTS,
  INITIAL_RECEIVER_REQUESTS,
  calculatePartialAllocation,
} from '../data/mockData';
import { getDynamicTop3Matches } from '../data/matchingEngine';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { effectiveTrackingStatus, nextTrackingStatus } from '../utils/tracking';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  posts: DonationPost[];
  requests: ReceiverRequest[];
  ratings: RatingReview[];
  activeView: 'landing' | 'register' | 'login' | 'dashboard' | 'map';
  setActiveView: (view: 'landing' | 'register' | 'login' | 'dashboard' | 'map') => void;
  setCurrentUser: (user: User | null) => void;
  loginUserByRole: (role: UserRole) => void;
  loginByEmail: (email: string) => boolean;
  registerUser: (
  newUserData: Omit<
    User,
    'id' | 'verified' | 'rating' | 'ratingCount' | 'reliability'
  > & {
    fssaiVerification?: FssaiVerificationResult;
  }
) => Promise<User>;
  createDonationPost: (
    postData: {
      type: 'food' | 'organic_waste';
      title: string;
      description: string;
      quantityMeals: number;
      prepTime?: string;
      allergens?: string[];
      safeUntil: string;
      deliveryRadiusMiles: number;
      locationAddress: string;
    }
  ) => DonationPost;
  updatePostStatus: (postId: string, newStatus: DonationStatus) => void;
  autoAllocatePost: (postId: string) => void;
  acceptDonationComplete: (postId: string) => void;
  acceptDonationPartial: (postId: string) => void;
  markDonationCollected: (postId: string) => void;
  markDonationCompleted: (postId: string) => void;
  markExpiredFoodProcessed: (postId: string) => void;
  createReceiverRequest: (
    reqData: {
      mealsRequired: number;
      dietaryNotes: string[];
      urgency: 'Normal' | 'High' | 'Immediate';
      locationAddress: string;
    }
  ) => ReceiverRequest;
  submitRating: (
    toUserId: string,
    donationId: string,
    ratingValue: number,
    reliabilityScore: number,
    comment: string
  ) => void;
  resetDemoData: () => void;
  aiMatchingLoading: boolean;
  advisorMessages: ChatMessage[];
  advisorLoading: boolean;
  sendMessageToAdvisor: (content: string) => Promise<void>;
  clearAdvisorChat: () => void;
  runAiMatching: (post: DonationPost) => Promise<void>;
  // In-app notifications (frontend-only; no DB table yet)
  notifications: AppNotification[];
  unreadNotificationCount: number;
  addNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  // Pickup / delivery logistics tracking (frontend state overlay)
  advanceTracking: (postId: string, next: TrackingStatus) => void;
  // Supabase authentication (progressive enhancement; falls back to local/demo)
  authLoading: boolean;
  isSupabaseAuthEnabled: boolean;
  loginWithSupabase: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  // Admin-only: flip a user's verification flag (frontend state; no DB write).
  setUserVerification: (userId: string, verified: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_USERS = 'FoodBridge_users_v1';
const STORAGE_KEY_POSTS = 'FoodBridge_posts_v1';
const STORAGE_KEY_REQUESTS = 'FoodBridge_requests_v1';
const STORAGE_KEY_RATINGS = 'FoodBridge_ratings_v1';
const STORAGE_KEY_CURRENT_USER = 'FoodBridge_current_user_v1';
const STORAGE_KEY_NOTIFICATIONS = 'FoodBridge_notifications_v1';

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const createUserId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `user-${crypto.randomUUID()}`;
  }
  return `user-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const readStoredArray = <T,>(key: string, fallback: T[]): T[] => {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

// Recompute each receiver request's fulfilledMeals from the allocations across
// ALL posts. Idempotent — safe to run after every allocation change so re-runs
// never double-count. A request with any fulfilled meals is marked 'Matched';
// 'Completed' requests are left as-is.
const recomputeRequestFulfillment = (
  allPosts: DonationPost[],
  reqs: ReceiverRequest[]
): ReceiverRequest[] => {
  const fulfilledByReceiver: Record<string, number> = {};
  for (const p of allPosts) {
    for (const step of p.allocations || []) {
      fulfilledByReceiver[step.receiverId] =
        (fulfilledByReceiver[step.receiverId] || 0) + (step.allocated || 0);
    }
  }
  return reqs.map((r) => {
    const fulfilled = fulfilledByReceiver[r.receiverId] || 0;
    const status: ReceiverRequest['status'] =
      r.status === 'Completed' ? 'Completed' : fulfilled > 0 ? 'Matched' : 'Active';
    return { ...r, fulfilledMeals: fulfilled, status };
  });
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    return readStoredArray(STORAGE_KEY_USERS, ALL_MOCK_USERS);
  });

  const [posts, setPosts] = useState<DonationPost[]>(() => {
    return readStoredArray(STORAGE_KEY_POSTS, INITIAL_DONATION_POSTS);
  });

  const [requests, setRequests] = useState<ReceiverRequest[]>(() => {
    return readStoredArray(STORAGE_KEY_REQUESTS, INITIAL_RECEIVER_REQUESTS);
  });

  const [ratings, setRatings] = useState<RatingReview[]>(() => {
    return readStoredArray(STORAGE_KEY_RATINGS, []);
  });

  const [currentUser, setCurrentUserState] = useState<User | null>(() => {
    try {
      const savedUserId = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
      if (savedUserId) {
        const storedUser = users.find((u) => u.id === savedUserId);
        if (storedUser) return storedUser;
        localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
      }
    } catch {
      // ignore storage errors and keep the demo default
    }
    // Return the first user that exists in the users array, or first mock user
    return users.find((u) => u.id) || ALL_MOCK_USERS[0];
  });

  // Refresh currentUser when users change - keep in sync
  useEffect(() => {
    if (!currentUser) return;
    const refreshedUser = users.find((u) => u.id === currentUser.id);
    if (refreshedUser && refreshedUser !== currentUser) {
      setCurrentUserState(refreshedUser);
    } else if (!refreshedUser) {
      try {
        localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
      } catch {
        // ignore
      }
      // Fall back to first available user
      setCurrentUserState(users.find((u) => u.id) || ALL_MOCK_USERS[0]);
    }
  }, [users, currentUser]);

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
      localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(posts));
      localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(requests));
      localStorage.setItem(STORAGE_KEY_RATINGS, JSON.stringify(ratings));
    } catch {
      // ignore
    }
  }, [users, posts, requests, ratings]);

  const setCurrentUser = (user: User | null) => {
    setCurrentUserState(user);
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY_CURRENT_USER, user.id);
      } else {
        localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
      }
    } catch {
      // ignore
    }
  };

  const [activeView, setActiveView] = useState<'landing' | 'register' | 'login' | 'dashboard' | 'map'>('landing');

  // In-app notifications (frontend-only; persisted to localStorage, no DB table).
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    readStoredArray(STORAGE_KEY_NOTIFICATIONS, [])
  );

  // Supabase auth (progressive enhancement). `authLoading` only matters when a
  // browser Supabase client is configured; otherwise it resolves immediately and
  // the app uses the existing local/demo login.
  const [authLoading, setAuthLoading] = useState<boolean>(isSupabaseConfigured);

  // Refs mirroring the latest state for use inside the 1s expiry sweep and the
  // Supabase auth callbacks — both run outside the render cycle and would
  // otherwise capture stale closures. `emittedRef` de-dupes the one-shot expiry
  // notifications so each post warns at most once per threshold.
  const usersRef = useRef(users);
  const postsRef = useRef(posts);
  const emittedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    usersRef.current = users;
  }, [users]);
  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);

  // Persist notifications to localStorage.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(notifications));
    } catch {
      // ignore
    }
  }, [notifications]);

  const [aiMatchingLoading, setAiMatchingLoading] = useState(false);
  const [advisorMessages, setAdvisorMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('FoodBridge_advisor_chat');
      return saved ? JSON.parse(saved) : [
        {
          id: 'welcome',
          role: 'assistant',
          content: 'Hello! I am your FoodBridge AI Recovery Advisor. How can I help you optimize food rescue, safety, or logistics today?',
          createdAt: new Date().toISOString()
        }
      ];
    } catch {
      return [];
    }
  });
  const [advisorLoading, setAdvisorLoading] = useState(false);

  // Save advisor chat to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('FoodBridge_advisor_chat', JSON.stringify(advisorMessages));
    } catch {
      // ignore
    }
  }, [advisorMessages]);

  // Login by Role (for 1-click Demo Switcher)
  const loginUserByRole = (role: UserRole) => {
    const demoUser = ALL_MOCK_USERS.find((u) => u.role === role);
    // Prefer the persisted copy; fall back to the demo mock when it isn't in
    // persisted state yet (e.g. a stale localStorage snapshot that predates a
    // newly-added demo role like admin). Additive: identical when present.
    const found =
      users.find((u) => u.id === demoUser?.id) ||
      users.find((u) => u.role === role) ||
      demoUser;
    if (found) {
      setCurrentUser(found);
      setActiveView('dashboard');
    }
  };

  // Login by Email
  const loginByEmail = (email: string): boolean => {
    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) return false;
    const found = users.find((u) => normalizeEmail(u.email) === normalizedEmail);
    if (found) {
      setCurrentUser(found);
      setActiveView('dashboard');
      return true;
    }
    return false;
  };

// Register User
const registerUser = async (
  data: Omit<
    User,
    'id' | 'verified' | 'rating' | 'ratingCount' | 'reliability'
  > & {
    fssaiVerification?: FssaiVerificationResult;
  }
): Promise<User> => {

  // Default values for a newly registered FoodLoop user
  const newUserData = {
    ...data,
    verified: false,
    rating: 5.0,
    ratingCount: 1,
    reliability: 100,
  };

  // Convert FoodLoop User data into the format expected
  // by the Express API.
  const databaseUser = {
  role: newUserData.role,

  // Basic organization details
  name: newUserData.name,
  contactPerson: newUserData.contactPerson,
  phone: newUserData.phone,
  email: newUserData.email,
  address: newUserData.address,

  // Location
  latitude: newUserData.location?.lat ?? null,
  longitude: newUserData.location?.lng ?? null,

  // Donor details
  fssaiNumber: newUserData.fssai ?? null,
  gstin: newUserData.gstin ?? null,

  // Receiver details
  dailyMealsRequired:
    newUserData.mealsRequired ?? null,

  dietaryNeeds:
    newUserData.dietaryNeeds ?? null,

  // Waste processor details
  facilityType:
    newUserData.facilityType ?? null,

  // Verification
  verified: false,

  // Don't assume properties from FssaiVerificationResult
  // until we inspect its actual structure.
  verificationStatus: "pending_review",
  certificateUploaded: false,

  // Rating
  rating: 5.0,
  ratingCount: 1,
  reliability: 100,
};

  // Send registration to our Express backend.
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(databaseUser),
  });

  // Read backend response.
  const result = await response.json();

  // Handle database/API failure.
  if (!response.ok || !result.success) {
    throw new Error(
      result.message || 'Failed to register user'
    );
  }

  // Convert the database response back into FoodLoop's
  // existing User format.
  const savedUser: User = {
    ...newUserData,
    id: result.user.id,
  };

  // Add the database-created user to React state.
  setUsers((previousUsers) => [
    ...previousUsers,
    savedUser,
  ]);

  // Make the newly registered user the active user.
  setCurrentUser(savedUser);

  return savedUser;
};
  // Create Donation or Organic Waste post -> calculates matches immediately!
  const createDonationPost = (postData: {
    type: 'food' | 'organic_waste';
    title: string;
    description: string;
    quantityMeals: number;
    prepTime?: string;
    allergens?: string[];
    safeUntil: string;
    deliveryRadiusMiles: number;
    locationAddress: string;
  }): DonationPost => {
    if (!currentUser) throw new Error('Must be logged in to create a post');
    if (currentUser.role !== 'donor') throw new Error('Only donors can create donation posts');

    // Validate required fields
    if (!postData.title || !postData.title.trim()) {
      throw new Error('Donation title is required');
    }
    if (typeof postData.quantityMeals !== 'number' || postData.quantityMeals <= 0) {
      throw new Error('Quantity must be greater than zero');
    }
    if (!postData.locationAddress || !postData.locationAddress.trim()) {
      throw new Error('Location address is required');
    }
    if (postData.deliveryRadiusMiles < 0) {
      throw new Error('Delivery radius cannot be negative');
    }

    // Create the new post first
    const newPost: DonationPost = {
      id: `post-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      donorId: currentUser.id,
      donorName: currentUser.name,
      type: postData.type,
      title: postData.title.trim(),
      description: postData.description || '',
      quantityMeals: postData.quantityMeals,
      prepTime: postData.prepTime,
      allergens: postData.allergens,
      safeUntil: postData.safeUntil,
      deliveryRadiusMiles: postData.deliveryRadiusMiles,
      locationAddress: postData.locationAddress.trim(),
      status: 'Posted',
      createdAt: new Date().toISOString(),
      matches: [],
      allocations: [],
    };

    // Calculate Top 3 matches using our Smart Matching Engine
    const topMatches = getDynamicTop3Matches(
      newPost,
      users,
      requests,
      posts
    );

    // Auto-split the quantity across the ranked matches straight away so the
    // donor immediately sees the allocation plan. The manual "Auto Allocate"
    // button re-runs the same idempotent logic.
    const allocSteps = calculatePartialAllocation(newPost.quantityMeals, topMatches);

    // Update the post with matches + initial allocation
    const postWithMatches: DonationPost = {
      ...newPost,
      matches: topMatches,
      allocations: allocSteps,
      status: allocSteps.length > 0 ? 'Matched' : 'Posted',
      assignedReceiverId: allocSteps[0]?.receiverId,
      assignedReceiverName: allocSteps[0]?.receiverName,
    };

    const nextPosts = [postWithMatches, ...posts];
    setPosts(nextPosts);
    setRequests((prev) => recomputeRequestFulfillment(nextPosts, prev));

    // Notify the donor of the fresh matches + any meals still unallocated.
    if (postWithMatches.matches.length > 0) {
      addNotification({
        type: 'match',
        title: 'New matches found',
        message: `${postWithMatches.matches.length} receiver(s) matched for "${postWithMatches.title}".`,
        userId: currentUser.id,
        relatedPostId: postWithMatches.id,
        actionView: 'dashboard',
      });
    }
    const allocatedTotal = allocSteps.reduce((sum, a) => sum + (a.allocated || 0), 0);
    const unallocated = postWithMatches.quantityMeals - allocatedTotal;
    if (unallocated > 0) {
      addNotification({
        type: 'system',
        title: 'Meals awaiting allocation',
        message: `${unallocated} of ${postWithMatches.quantityMeals} meals from "${postWithMatches.title}" are not yet allocated.`,
        userId: currentUser.id,
        relatedPostId: postWithMatches.id,
        actionView: 'dashboard',
      });
    }

    // Asynchronously call AI matching (may refine matches/allocations)
    runAiMatching(postWithMatches);
    return postWithMatches;
  };

  // Update Status in Workflow: Posted -> Matched -> Accepted -> Collected -> Completed
  const updatePostStatus = (postId: string, newStatus: DonationStatus) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          // An expired donation cannot be moved forward into the receiver
          // lifecycle — its remaining quantity is routed to waste management.
          if (p.status === 'Expired' && newStatus !== 'Expired') {
            return p;
          }
          return { ...p, status: newStatus };
        }
        return p;
      })
    );
  };

  // Partial Allocation execution -> auto-split meals across the ranked matches.
  // Reuses the existing greedy calculatePartialAllocation (min(remaining,
  // needed) over the ranked matches). Idempotent: recomputes allocations from
  // scratch and recomputes request fulfilment across all posts, so re-running
  // never double-counts. Blocked once a donation has expired.
  const autoAllocatePost = (postId: string) => {
    if (!currentUser) throw new Error('Must be logged in');
    if (currentUser.role !== 'donor') throw new Error('Only donors can auto-allocate');

    const target = posts.find((p) => p.id === postId);
    if (!target) return;
    if (target.status === 'Expired') throw new Error('Cannot allocate an expired donation');
    if (!(target.quantityMeals > 0)) throw new Error('Donation quantity must be greater than zero');

    // Reuse the post's ranked matches when present; otherwise compute them
    // fresh with the existing weighted matcher (seed/imported posts ship with
    // matches: []). We persist the computed matches back onto the post so a
    // second click reuses the same stable ranking — keeping the greedy split
    // deterministic and idempotent (no double-counting on re-run).
    const rankedMatches =
      target.matches && target.matches.length > 0
        ? target.matches
        : getDynamicTop3Matches(target, users, requests, posts);

    const allocSteps = calculatePartialAllocation(target.quantityMeals, rankedMatches);

    const nextPosts = posts.map((p) =>
      p.id === postId
        ? {
            ...p,
            status: (p.status === 'Posted' ? 'Matched' : p.status) as DonationStatus,
            matches: rankedMatches,
            allocations: allocSteps,
            assignedReceiverId: allocSteps[0]?.receiverId,
            assignedReceiverName: allocSteps[0]?.receiverName,
          }
        : p
    );

    setPosts(nextPosts);
    setRequests((prev) => recomputeRequestFulfillment(nextPosts, prev));
  };

  // Accept Complete Donation - receiver accepts entire donation
  const acceptDonationComplete = (postId: string) => {
    if (!currentUser) throw new Error('Must be logged in');
    if (currentUser.role !== 'receiver') throw new Error('Only receivers can accept donations');

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          // Validate state transition
          if (p.status === 'Completed') {
            throw new Error('Donation already completed');
          }
          if (p.status === 'Collected') {
            throw new Error('Donation already collected');
          }

          // Check if expired
          const safeUntilTime = new Date(p.safeUntil).getTime();
          const currentTime = Date.now();
          if (currentTime > safeUntilTime) {
            throw new Error('Donation has expired and can no longer be accepted');
          }

          // Mark as accepted
          return {
            ...p,
            status: 'Accepted',
            assignedReceiverId: currentUser.id,
            assignedReceiverName: currentUser.name,
          };
        }
        return p;
      })
    );

    // Notify the donor that a receiver accepted the whole donation.
    const acceptedPost = posts.find((p) => p.id === postId);
    if (acceptedPost) {
      addNotification({
        type: 'allocation',
        title: 'Donation accepted',
        message: `${currentUser.name} accepted the full donation "${acceptedPost.title}".`,
        userId: acceptedPost.donorId,
        relatedPostId: acceptedPost.id,
        actionView: 'dashboard',
      });
    }
  };

  // Accept Partial Donation - receiver accepts their allocated portion
  const acceptDonationPartial = (postId: string) => {
    if (!currentUser) throw new Error('Must be logged in');
    if (currentUser.role !== 'receiver') throw new Error('Only receivers can accept donations');

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          // Validate state transition
          if (p.status === 'Completed') {
            throw new Error('Donation already completed');
          }
          if (p.status === 'Collected') {
            throw new Error('Donation already collected');
          }

          // Check if expired
          const safeUntilTime = new Date(p.safeUntil).getTime();
          const currentTime = Date.now();
          if (currentTime > safeUntilTime) {
            throw new Error('Donation has expired and can no longer be accepted');
          }

          // Find receiver's allocation
          const receiverAllocation = p.allocations.find((a) => a.receiverId === currentUser.id);
          if (!receiverAllocation) {
            throw new Error('No allocation found for this receiver');
          }
          if (receiverAllocation.allocated <= 0) {
            throw new Error('No quantity allocated to accept');
          }

          // Mark allocation as accepted by updating status
          return {
            ...p,
            status: 'Accepted',
          };
        }
        return p;
      })
    );

    // Notify the donor that a receiver accepted their allocated portion.
    const partialPost = posts.find((p) => p.id === postId);
    if (partialPost) {
      const alloc = partialPost.allocations.find((a) => a.receiverId === currentUser.id);
      addNotification({
        type: 'allocation',
        title: 'Allocation accepted',
        message: `${currentUser.name} accepted ${
          alloc ? `${alloc.allocated} meals` : 'their allocation'
        } from "${partialPost.title}".`,
        userId: partialPost.donorId,
        relatedPostId: partialPost.id,
        actionView: 'dashboard',
      });
    }
  };

  // Mark Donation Collected - receiver marks food as collected
  const markDonationCollected = (postId: string) => {
    if (!currentUser) throw new Error('Must be logged in');
    if (currentUser.role !== 'receiver') throw new Error('Only receivers can mark collected');

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          // Validate state transition
          if (p.status === 'Completed') {
            throw new Error('Donation already completed');
          }
          if (p.status === 'Collected') {
            return p; // Idempotent - already collected
          }
          if (p.status !== 'Accepted') {
            throw new Error('Donation must be accepted before collection');
          }

          // Mark as collected
          return {
            ...p,
            status: 'Collected',
          };
        }
        return p;
      })
    );

    // Notify the donor that their food has been picked up.
    const collectedPost = posts.find((p) => p.id === postId);
    if (collectedPost) {
      addNotification({
        type: 'pickup',
        title: 'Food picked up',
        message: `${currentUser.name} has collected "${collectedPost.title}".`,
        userId: collectedPost.donorId,
        relatedPostId: collectedPost.id,
        actionView: 'dashboard',
      });
    }
  };

  // Mark Donation Completed - final step in lifecycle
  const markDonationCompleted = (postId: string) => {
    if (!currentUser) throw new Error('Must be logged in');

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          // Validate state transition
          if (p.status === 'Completed') {
            return p; // Idempotent - already completed
          }
          if (p.status !== 'Collected') {
            throw new Error('Donation must be collected before completion');
          }

          // Mark as completed
          return {
            ...p,
            status: 'Completed',
          };
        }
        return p;
      })
    );

    // Notify both parties that the donation was delivered/completed.
    const completedPost = posts.find((p) => p.id === postId);
    if (completedPost) {
      addNotification({
        type: 'delivery',
        title: 'Donation delivered',
        message: `"${completedPost.title}" has been delivered and completed.`,
        userId: completedPost.donorId,
        relatedPostId: completedPost.id,
        actionView: 'dashboard',
      });
      if (completedPost.assignedReceiverId) {
        addNotification({
          type: 'delivery',
          title: 'Donation delivered',
          message: `"${completedPost.title}" has been delivered and completed.`,
          userId: completedPost.assignedReceiverId,
          relatedPostId: completedPost.id,
          actionView: 'dashboard',
        });
      }
    }
  };

  // Create Receiver Request
  const createReceiverRequest = (reqData: {
    mealsRequired: number;
    dietaryNotes: string[];
    urgency: 'Normal' | 'High' | 'Immediate';
    locationAddress: string;
  }): ReceiverRequest => {
    if (!currentUser) throw new Error('Must be logged in as Receiver');
    if (currentUser.role !== 'receiver') throw new Error('Only receivers can create requests');

    // Validate required fields
    if (typeof reqData.mealsRequired !== 'number' || reqData.mealsRequired <= 0) {
      throw new Error('Meals required must be greater than zero');
    }
    if (!reqData.locationAddress || !reqData.locationAddress.trim()) {
      throw new Error('Location address is required');
    }
    if (!['Normal', 'High', 'Immediate'].includes(reqData.urgency)) {
      throw new Error('Invalid urgency level');
    }

    const newReq: ReceiverRequest = {
      id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      receiverId: currentUser.id,
      receiverName: currentUser.name,
      mealsRequired: reqData.mealsRequired,
      fulfilledMeals: 0,
      dietaryNotes: reqData.dietaryNotes || [],
      urgency: reqData.urgency,
      locationAddress: reqData.locationAddress.trim(),
      status: 'Active',
      createdAt: new Date().toISOString(),
    };
    setRequests((prev) => [newReq, ...prev]);
    return newReq;
  };

  // Submit Rating (Donor <-> Receiver) and update average rating & reliability %
  const submitRating = (
    toUserId: string,
    donationId: string,
    ratingValue: number,
    reliabilityScore: number,
    comment: string
  ) => {
    if (!currentUser) return;

    // --- Validation ---
    // Rating must be 1-5
    if (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      console.error('Invalid rating value:', ratingValue);
      return;
    }

    // Reliability must be 50-100
    if (!Number.isInteger(reliabilityScore) || reliabilityScore < 50 || reliabilityScore > 100) {
      console.error('Invalid reliability score:', reliabilityScore);
      return;
    }

    // Comment: trim whitespace, allow empty
    const trimmedComment = (comment || '').trim();

    // --- Eligibility: donation must exist and be Completed ---
    const post = posts.find((p) => p.id === donationId);
    if (!post) {
      console.error('Donation not found:', donationId);
      return;
    }
    if (post.status !== 'Completed') {
      console.error('Rating only available for Completed donations. Current status:', post.status);
      return;
    }

    // --- Target user validation: must exist and participate in donation ---
    const targetUser = users.find((u) => u.id === toUserId);
    if (!targetUser) {
      console.error('Target user not found:', toUserId);
      return;
    }

    // --- Duplicate rating prevention: same fromUserId + toUserId + donationId ---
    const duplicate = ratings.find(
      (r) => r.fromUserId === currentUser.id && r.toUserId === toUserId && r.donationId === donationId
    );
    if (duplicate) {
      console.log('Duplicate rating detected for', currentUser.id, '+', toUserId, '+', donationId);
      return;
    }

    // --- Ownership validation: currentUser must be participant in this donation ---
    const isDonor = post.donorId === currentUser.id;
    const isReceiver = post.donorId !== currentUser.id && currentUser.role !== 'donor';
    // Allow if currentUser is either the donor or a receiver participant (not random user)
    if (!isDonor && currentUser.role !== 'receiver') {
      console.error('User is not a participant in this donation');
      return;
    }

    // --- Build new rating ---
    const newRating: RatingReview = {
      id: `rating-${Date.now()}`,
      fromUserId: currentUser.id,
      fromUserName: currentUser.name,
      toUserId,
      toUserName: targetUser.name,
      donationId,
      rating: ratingValue,
      reliabilityScore: reliabilityScore,
      comment: trimmedComment,
      createdAt: new Date().toISOString(),
    };

    setRatings((prev) => [newRating, ...prev]);

    // --- Update the recipient's average rating and reliability score ---
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === toUserId) {
          const newCount = (u.ratingCount || 0) + 1;
          const newAvgRating = parseFloat(
            ((u.rating * (u.ratingCount || 0) + ratingValue) / newCount).toFixed(1)
          );
          const newReliability = Math.round(
            (u.reliability * (u.ratingCount || 0) + reliabilityScore) / newCount
          );
          return {
            ...u,
            rating: newAvgRating,
            ratingCount: newCount,
            reliability: newReliability,
          };
        }
        return u;
      })
    );

    // Mark post as ratingGiven
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === donationId) {
          return { ...p, ratingGiven: true };
        }
        return p;
      })
    );
  };

  // Call backend to generate AI matches and allocation logic
  const runAiMatching = async (targetPost: DonationPost) => {
    setAiMatchingLoading(true);
    try {
      const candidates = targetPost.type === 'food'
        ? users.filter((u) => u.role === 'receiver')
        : users.filter((u) => u.role === 'waste_processor');

      const response = await fetch('/api/ai-matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postDetails: targetPost, candidates }),
      });

      if (response.ok) {
        const data = await response.json();
        setPosts((prev) =>
          prev.map((p) => {
            if (p.id === targetPost.id) {
              return {
                ...p,
                matches: data.matches || p.matches,
                allocations: data.allocations || p.allocations,
              };
            }
            return p;
          })
        );
      } else {
        console.warn('AI matching failed or API key not set, using heuristic matches');
      }
    } catch (error) {
      console.error('Error running AI matching:', error);
    } finally {
      setAiMatchingLoading(false);
    }
  };

  // Chat with Gemini Advisor
  const sendMessageToAdvisor = async (content: string) => {
    if (!content.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };

    const updatedMessages = [...advisorMessages, userMsg];
    setAdvisorMessages(updatedMessages);
    setAdvisorLoading(true);

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          userRole: currentUser?.role || 'participant',
          userName: currentUser?.name || 'User',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: data.reply || 'Sorry, I encountered an issue.',
          createdAt: new Date().toISOString(),
        };
        setAdvisorMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error('Chat API error');
      }
    } catch (error) {
      console.error('Error sending message to advisor:', error);
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: 'I could not connect to the Gemini AI advisor right now. Please ensure the backend is running and the GEMINI_API_KEY is configured.',
        createdAt: new Date().toISOString(),
      };
      setAdvisorMessages((prev) => [...prev, errorMsg]);
    } finally {
      setAdvisorLoading(false);
    }
  };

  const clearAdvisorChat = () => {
    setAdvisorMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Hello! I am your FoodBridge AI Recovery Advisor. How can I help you optimize food rescue, safety, or logistics today?',
        createdAt: new Date().toISOString()
      }
    ]);
  };

  // Reset to initial mock data
  const resetDemoData = () => {
    localStorage.removeItem(STORAGE_KEY_USERS);
    localStorage.removeItem(STORAGE_KEY_POSTS);
    localStorage.removeItem(STORAGE_KEY_REQUESTS);
    localStorage.removeItem(STORAGE_KEY_RATINGS);
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    localStorage.removeItem('FoodBridge_advisor_chat');
    localStorage.removeItem(STORAGE_KEY_NOTIFICATIONS);
    setUsers(ALL_MOCK_USERS);
    setPosts(INITIAL_DONATION_POSTS);
    setRequests(INITIAL_RECEIVER_REQUESTS);
    setRatings([]);
    setNotifications([]);
    emittedRef.current.clear();
    clearAdvisorChat();
    setCurrentUser(ALL_MOCK_USERS[0]);
  };

  // --- Auto-Expiry Sweep ---------------------------------------------------
  // Once a food donation passes its safety window while still available
  // (Posted/Matched), flip it to Expired, stamp expiredAt, and route the
  // remaining (un-allocated) quantity to the waste-management workflow.
  // History and any prior allocations are preserved. Runs every second and
  // only writes state when something actually changed; cleans up on unmount.
  useEffect(() => {
    const WARN_MS = 30 * 60 * 1000; // 30 min -> warning
    const CRITICAL_MS = 15 * 60 * 1000; // 15 min -> critical

    const sweep = () => {
      const now = Date.now();
      setPosts((prev) => {
        let changed = false;
        const next = prev.map((p) => {
          const eligible =
            p.type === 'food' && (p.status === 'Posted' || p.status === 'Matched');
          if (eligible && now > new Date(p.safeUntil).getTime()) {
            changed = true;
            return {
              ...p,
              status: 'Expired' as DonationStatus,
              expiredAt: new Date(now).toISOString(),
              recoveryPath: 'waste_processor' as const,
            };
          }
          return p;
        });
        return changed ? next : prev;
      });

      // Emit one-shot expiry notifications off the SAME sweep (no extra timer).
      // Reads the latest posts via postsRef; emittedRef ensures each post fires
      // each threshold at most once. Reuses the existing countdown timestamps.
      for (const p of postsRef.current) {
        if (p.type !== 'food') continue;
        if (p.status !== 'Posted' && p.status !== 'Matched') continue;
        const remainingMs = new Date(p.safeUntil).getTime() - now;

        if (remainingMs <= 0) {
          const key = `${p.id}:expired`;
          if (!emittedRef.current.has(key)) {
            emittedRef.current.add(key);
            const allocated = (p.allocations || []).reduce(
              (sum, a) => sum + (a.allocated || 0),
              0
            );
            const remainingMeals = Math.max(0, p.quantityMeals - allocated);
            addNotification({
              type: 'waste_management',
              title: 'Donation expired',
              message: `"${p.title}" expired — ${remainingMeals} remaining meals routed to waste management.`,
              relatedPostId: p.id,
              actionView: 'dashboard',
            });
          }
        } else if (remainingMs <= CRITICAL_MS) {
          const key = `${p.id}:critical`;
          if (!emittedRef.current.has(key)) {
            emittedRef.current.add(key);
            addNotification({
              type: 'expiry_warning',
              title: 'Critical: food expiring soon',
              message: `"${p.title}" is within 15 minutes of expiry. Confirm pickup now.`,
              userId: p.donorId,
              relatedPostId: p.id,
              actionView: 'dashboard',
            });
          }
        } else if (remainingMs <= WARN_MS) {
          const key = `${p.id}:warning`;
          if (!emittedRef.current.has(key)) {
            emittedRef.current.add(key);
            addNotification({
              type: 'expiry_warning',
              title: 'Food expiring within 30 minutes',
              message: `"${p.title}" has under 30 minutes of safe time left.`,
              userId: p.donorId,
              relatedPostId: p.id,
              actionView: 'dashboard',
            });
          }
        }
      }
    };
    sweep(); // evaluate immediately on mount
    const intervalId = setInterval(sweep, 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Waste processor marks the expired-food remainder as processed
  // (composting / biogas). Software status only — it does not assert that a
  // physical transfer happened.
  const markExpiredFoodProcessed = (postId: string) => {
    if (!currentUser) throw new Error('Must be logged in');
    if (currentUser.role !== 'waste_processor') {
      throw new Error('Only waste processors can process waste');
    }
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        // Only expired food routed to waste management can be processed.
        if (p.status !== 'Expired' || p.recoveryPath !== 'waste_processor') {
          return p;
        }
        return { ...p, recoveryPath: 'completed' as const };
      })
    );
  };

  // -------------------------------------------------------------------------

  // --- In-app notifications ------------------------------------------------
  const addNotification = (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
    setNotifications((prev) => {
      const notif: AppNotification = {
        ...n,
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        createdAt: new Date().toISOString(),
        read: false,
      };
      // Newest first; cap the log so it can never grow without bound.
      return [notif, ...prev].slice(0, 50);
    });
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // --- Admin: user verification -------------------------------------------
  // Flips the existing `verified` flag (and keeps `verificationStatus` in sync)
  // in shared frontend state. Reuses the existing users→localStorage persistence
  // effect; no Supabase / DB write. Only the Admin dashboard calls this.
  const setUserVerification = (userId: string, verified: boolean) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, verified, verificationStatus: verified ? 'verified' : 'pending_review' }
          : u
      )
    );
  };

  // Notifications visible to the current user: broadcasts (no userId) + those
  // targeted at them. The dropdown and the unread badge both use this view.
  const visibleNotifications = notifications.filter(
    (n) => n.userId === undefined || n.userId === currentUser?.id
  );
  const unreadNotificationCount = visibleNotifications.filter((n) => !n.read).length;

  // --- Pickup / delivery tracking ------------------------------------------
  // Advances the logistics overlay one step along the main timeline. Only the
  // immediate next step is accepted (the UI derives it via nextTrackingStatus),
  // so the demo cannot skip states. The donation status itself is untouched —
  // effectiveTrackingStatus() merges this overlay with the donation lifecycle.
  const advanceTracking = (postId: string, next: TrackingStatus) => {
    const target = postsRef.current.find((p) => p.id === postId);
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const current = effectiveTrackingStatus(p);
        if (nextTrackingStatus(current) !== next) return p; // only the valid next step
        const event: TrackingEvent = { status: next, timestamp: new Date().toISOString() };
        const prevInfo = p.tracking;
        return {
          ...p,
          tracking: {
            status: next,
            history: [...(prevInfo?.history || []), event],
            pickupLocation: prevInfo?.pickupLocation ?? p.locationAddress,
            deliveryLocation: prevInfo?.deliveryLocation ?? p.assignedReceiverName,
            estimatedPickupTime: prevInfo?.estimatedPickupTime,
            estimatedDeliveryTime: prevInfo?.estimatedDeliveryTime,
          },
        };
      })
    );

    if (target) {
      if (next === 'pickup_scheduled') {
        addNotification({
          type: 'pickup',
          title: 'Pickup scheduled',
          message: `Pickup scheduled for "${target.title}".`,
          userId: target.donorId,
          relatedPostId: target.id,
          actionView: 'dashboard',
        });
      } else if (next === 'picked_up') {
        addNotification({
          type: 'pickup',
          title: 'Picked up',
          message: `"${target.title}" has been picked up and is on the way.`,
          userId: target.donorId,
          relatedPostId: target.id,
          actionView: 'dashboard',
        });
      } else if (next === 'delivered') {
        addNotification({
          type: 'delivery',
          title: 'Delivered',
          message: `"${target.title}" has been delivered to the receiver.`,
          userId: target.donorId,
          relatedPostId: target.id,
          actionView: 'dashboard',
        });
      }
    }
  };

  // --- Supabase authentication (progressive enhancement) -------------------
  // Resolve a Supabase session (identified by email) to an app User. Prefer an
  // existing local profile (created via registration / seeded demo data); if
  // none exists yet, synthesize a minimal one so the session still lands on a
  // usable dashboard. Real profile/role data continues to come from the
  // existing registration flow (POST /api/users).
  const syncSupabaseUser = (email: string) => {
    const normalized = normalizeEmail(email);
    const existing = usersRef.current.find((u) => normalizeEmail(u.email) === normalized);
    if (existing) {
      setCurrentUser(existing);
      setActiveView('dashboard');
      return;
    }
    const displayName = email.split('@')[0] || 'FoodBridge User';
    const synthesized: User = {
      id: `user-supabase-${normalized}`,
      name: displayName,
      role: 'donor',
      email: normalized,
      phone: '+91',
      address: '',
      contactPerson: displayName,
      verified: true,
      verificationStatus: 'verified',
      rating: 5,
      ratingCount: 1,
      reliability: 100,
      location: { lat: 13.0827, lng: 80.2707, addressText: 'Chennai' },
    };
    setUsers((prev) => (prev.some((u) => u.id === synthesized.id) ? prev : [...prev, synthesized]));
    setCurrentUser(synthesized);
    setActiveView('dashboard');
  };

  const loginWithSupabase = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; message?: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, message: 'Secure sign-in is not configured on this deployment.' };
    }
    setAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizeEmail(email),
        password,
      });
      if (error) {
        return { success: false, message: error.message };
      }
      const sessionEmail = (data.user?.email as string | undefined) || normalizeEmail(email);
      syncSupabaseUser(sessionEmail);
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Sign-in failed' };
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
    } catch {
      // ignore sign-out errors — we still clear the local session below
    }
    setCurrentUser(null);
    setActiveView('landing');
  };

  // On mount, restore any existing Supabase session and subscribe to auth
  // changes. No-op (and instantly "not loading") when Supabase isn't configured.
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setAuthLoading(false);
      return;
    }
    let active = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        const sessionEmail = data.session?.user?.email;
        if (sessionEmail) syncSupabaseUser(sessionEmail);
        setAuthLoading(false);
      })
      .catch(() => {
        if (active) setAuthLoading(false);
      });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionEmail = session?.user?.email;
      if (sessionEmail) syncSupabaseUser(sessionEmail);
    });

    return () => {
      active = false;
      authListener?.subscription?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        posts,
        requests,
        ratings,
        activeView,
        setActiveView,
        setCurrentUser,
        loginUserByRole,
        loginByEmail,
        registerUser,
        createDonationPost,
        updatePostStatus,
        autoAllocatePost,
        acceptDonationComplete,
        acceptDonationPartial,
        markDonationCollected,
        markDonationCompleted,
        markExpiredFoodProcessed,
        createReceiverRequest,
        submitRating,
        resetDemoData,
        aiMatchingLoading,
        advisorMessages,
        advisorLoading,
        sendMessageToAdvisor,
        clearAdvisorChat,
        runAiMatching,
        notifications: visibleNotifications,
        unreadNotificationCount,
        addNotification,
        markNotificationRead,
        markAllNotificationsRead,
        clearNotifications,
        advanceTracking,
        authLoading,
        isSupabaseAuthEnabled: isSupabaseConfigured,
        loginWithSupabase,
        logout,
        setUserVerification,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
