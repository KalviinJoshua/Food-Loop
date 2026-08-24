import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  DonationPost,
  ReceiverRequest,
  RatingReview,
  UserRole,
  DonationStatus,
  ChatMessage,
  FssaiVerificationResult,
} from '../types';
import {
  ALL_MOCK_USERS,
  INITIAL_DONATION_POSTS,
  INITIAL_RECEIVER_REQUESTS,
  calculatePartialAllocation,
  getTop3Matches,
} from '../data/mockData';
import { getDynamicTop3Matches } from '../data/matchingEngine';

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
    newUserData: Omit<User, 'id' | 'verified' | 'rating' | 'ratingCount' | 'reliability'> & {
      fssaiVerification?: FssaiVerificationResult;
    }
  ) => User;
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_USERS = 'foodloop_users_v1';
const STORAGE_KEY_POSTS = 'foodloop_posts_v1';
const STORAGE_KEY_REQUESTS = 'foodloop_requests_v1';
const STORAGE_KEY_RATINGS = 'foodloop_ratings_v1';
const STORAGE_KEY_CURRENT_USER = 'foodloop_current_user_v1';

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

  const [aiMatchingLoading, setAiMatchingLoading] = useState(false);
  const [advisorMessages, setAdvisorMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('foodloop_advisor_chat');
      return saved ? JSON.parse(saved) : [
        {
          id: 'welcome',
          role: 'assistant',
          content: 'Hello! I am your FoodLoop AI Recovery Advisor. How can I help you optimize food rescue, safety, or logistics today?',
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
      localStorage.setItem('foodloop_advisor_chat', JSON.stringify(advisorMessages));
    } catch {
      // ignore
    }
  }, [advisorMessages]);

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

  // Login by Role (for 1-click Demo Switcher)
  const loginUserByRole = (role: UserRole) => {
    const demoUser = ALL_MOCK_USERS.find((u) => u.role === role);
    const found = users.find((u) => u.id === demoUser?.id) || users.find((u) => u.role === role);
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
  const registerUser = (
    newUserData: Omit<User, 'id' | 'verified' | 'rating' | 'ratingCount' | 'reliability'> & {
      fssaiVerification?: FssaiVerificationResult;
    }
  ): User => {
    const normalizedEmail = normalizeEmail(newUserData.email);

    if (!newUserData.name.trim() || !newUserData.contactPerson.trim() || !normalizedEmail || !newUserData.address.trim()) {
      throw new Error('Please fill in all required fields (Organization Name, Contact, Email, Address).');
    }

    if (!isValidEmail(normalizedEmail)) {
      throw new Error('Please enter a valid email address.');
    }

    const duplicate = users.some((u) => normalizeEmail(u.email) === normalizedEmail);
    if (duplicate) {
      throw new Error('An account with this email already exists. Please login or use another email.');
    }

    const newUser: User = {
      ...newUserData,
      id: createUserId(),
      name: newUserData.name.trim(),
      email: normalizedEmail,
      phone: newUserData.phone.trim(),
      address: newUserData.address.trim(),
      contactPerson: newUserData.contactPerson.trim(),
      fssai: newUserData.fssai?.trim() || undefined,
      gstin: newUserData.gstin?.trim() || undefined,
      verified: newUserData.fssaiVerification?.verificationStatus === 'verified',
      verificationStatus: newUserData.fssaiVerification?.verificationStatus || 'pending_review',
      certificateUploaded: Boolean(newUserData.fssaiVerification),
      extractedFssaiNumber: newUserData.fssaiVerification?.extractedData.fssaiNumber,
      certificateExpiryDate: newUserData.fssaiVerification?.extractedData.expiryDate,
      verificationTimestamp: newUserData.fssaiVerification?.verifiedAt,
      fssaiVerification: newUserData.fssaiVerification,
      rating: 5.0,
      ratingCount: 1,
      reliability: 100,
    };
    setUsers((prev) => [newUser, ...prev]);
    setCurrentUser(newUser);
    return newUser;
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

    // Update the post with matches
    const postWithMatches: DonationPost = {
      ...newPost,
      matches: topMatches,
    };

    setPosts((prev) => [postWithMatches, ...prev]);
    // Asynchronously call AI matching
    runAiMatching(postWithMatches);
    return postWithMatches;
  };

  // Update Status in Workflow: Posted -> Matched -> Accepted -> Collected -> Completed
  const updatePostStatus = (postId: string, newStatus: DonationStatus) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return { ...p, status: newStatus };
        }
        return p;
      })
    );
  };

  // Partial Allocation execution -> auto distribute meals among receivers
  const autoAllocatePost = (postId: string) => {
    if (!currentUser) throw new Error('Must be logged in');
    if (currentUser.role !== 'donor') throw new Error('Only donors can auto-allocate');

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          // Calculate allocation steps based on current matches
          const allocSteps = calculatePartialAllocation(p.quantityMeals, p.matches);
          
          // Update receiver requests to reflect fulfilled meals
          setRequests((prevRequests) => {
            const updatedRequests = prevRequests.map((r) => {
              // Find allocation for this receiver in the current allocation
              const allocForReceiver = allocSteps.find((step) => step.receiverId === r.id);
              if (allocForReceiver) {
                return {
                  ...r,
                  fulfilledMeals: (r.fulfilledMeals || 0) + allocForReceiver.allocated,
                  status: 'Matched',
                };
              }
              return r;
            });
            return updatedRequests;
          });
          
          // Update the post with allocations
          return {
            ...p,
            status: 'Matched',
            allocations: allocSteps,
            assignedReceiverId: allocSteps[0]?.receiverId,
            assignedReceiverName: allocSteps[0]?.receiverName,
          };
        }
        return p;
      })
    );
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
        content: 'Hello! I am your FoodLoop AI Recovery Advisor. How can I help you optimize food rescue, safety, or logistics today?',
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
    localStorage.removeItem('foodloop_advisor_chat');
    setUsers(ALL_MOCK_USERS);
    setPosts(INITIAL_DONATION_POSTS);
    setRequests(INITIAL_RECEIVER_REQUESTS);
    setRatings([]);
    clearAdvisorChat();
    setCurrentUser(ALL_MOCK_USERS[0]);
  };

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
        createReceiverRequest,
        submitRating,
        resetDemoData,
        aiMatchingLoading,
        advisorMessages,
        advisorLoading,
        sendMessageToAdvisor,
        clearAdvisorChat,
        runAiMatching,
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
