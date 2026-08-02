import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  DonationPost,
  ReceiverRequest,
  RatingReview,
  UserRole,
  DonationStatus,
  ChatMessage,
} from '../types';
import {
  ALL_MOCK_USERS,
  INITIAL_DONATION_POSTS,
  INITIAL_RECEIVER_REQUESTS,
  getTop3Matches,
  calculatePartialAllocation,
} from '../data/mockData';

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
    newUserData: Omit<User, 'id' | 'verified' | 'rating' | 'ratingCount' | 'reliability'>
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

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USERS);
      return saved ? JSON.parse(saved) : ALL_MOCK_USERS;
    } catch {
      return ALL_MOCK_USERS;
    }
  });

  const [posts, setPosts] = useState<DonationPost[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_POSTS);
      return saved ? JSON.parse(saved) : INITIAL_DONATION_POSTS;
    } catch {
      return INITIAL_DONATION_POSTS;
    }
  });

  const [requests, setRequests] = useState<ReceiverRequest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_REQUESTS);
      return saved ? JSON.parse(saved) : INITIAL_RECEIVER_REQUESTS;
    } catch {
      return INITIAL_RECEIVER_REQUESTS;
    }
  });

  const [ratings, setRatings] = useState<RatingReview[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RATINGS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    // Default to Green Bistro for immediate interactive demo
    return ALL_MOCK_USERS[0];
  });

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
    const found = users.find((u) => u.role === role);
    if (found) {
      setCurrentUser(found);
      setActiveView('dashboard');
    }
  };

  // Login by Email
  const loginByEmail = (email: string): boolean => {
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      setCurrentUser(found);
      setActiveView('dashboard');
      return true;
    }
    return false;
  };

  // Register User -> Automatically assigns verified = true and shows Verified Badge!
  const registerUser = (
    newUserData: Omit<User, 'id' | 'verified' | 'rating' | 'ratingCount' | 'reliability'>
  ): User => {
    const newUser: User = {
      ...newUserData,
      id: `user-${Date.now()}`,
      verified: true, // Automatically verified per Requirement 1
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

    // Calculate Top 3 matches using our Smart Matching Engine
    const topMatches = getTop3Matches({
      type: postData.type,
      quantityMeals: postData.quantityMeals,
      allergens: postData.allergens,
      deliveryRadiusMiles: postData.deliveryRadiusMiles,
    });

    const newPost: DonationPost = {
      id: `post-${Date.now()}`,
      donorId: currentUser.id,
      donorName: currentUser.name,
      type: postData.type,
      title: postData.title,
      description: postData.description,
      quantityMeals: postData.quantityMeals,
      prepTime: postData.prepTime,
      allergens: postData.allergens,
      safeUntil: postData.safeUntil,
      deliveryRadiusMiles: postData.deliveryRadiusMiles,
      locationAddress: postData.locationAddress,
      status: 'Posted',
      createdAt: new Date().toISOString(),
      matches: topMatches,
      allocations: [],
    };

    setPosts((prev) => [newPost, ...prev]);
    // Asynchronously call AI matching
    runAiMatching(newPost);
    return newPost;
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
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const allocSteps = calculatePartialAllocation(p.quantityMeals, p.matches);
          // also mark as Matched or Accepted
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

  // Create Receiver Request
  const createReceiverRequest = (reqData: {
    mealsRequired: number;
    dietaryNotes: string[];
    urgency: 'Normal' | 'High' | 'Immediate';
    locationAddress: string;
  }): ReceiverRequest => {
    if (!currentUser) throw new Error('Must be logged in as Receiver');
    const newReq: ReceiverRequest = {
      id: `req-${Date.now()}`,
      receiverId: currentUser.id,
      receiverName: currentUser.name,
      mealsRequired: reqData.mealsRequired,
      dietaryNotes: reqData.dietaryNotes,
      urgency: reqData.urgency,
      locationAddress: reqData.locationAddress,
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

    const newRating: RatingReview = {
      id: `rating-${Date.now()}`,
      fromUserId: currentUser.id,
      fromUserName: currentUser.name,
      toUserId,
      toUserName:
        users.find((u) => u.id === toUserId)?.name || 'Partner Organization',
      donationId,
      rating: ratingValue,
      reliabilityScore,
      comment,
      createdAt: new Date().toISOString(),
    };

    setRatings((prev) => [newRating, ...prev]);

    // Update the recipient's average rating and reliability score
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === toUserId) {
          const newCount = (u.ratingCount || 1) + 1;
          const newAvgRating = parseFloat(
            ((u.rating * u.ratingCount + ratingValue) / newCount).toFixed(1)
          );
          const newReliability = Math.round(
            (u.reliability * u.ratingCount + reliabilityScore) / newCount
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
