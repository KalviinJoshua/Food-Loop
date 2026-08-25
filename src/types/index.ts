export type UserRole = 'donor' | 'receiver' | 'waste_processor' | 'admin';

export type PostType = 'food' | 'organic_waste';

export type DonationStatus = 'Posted' | 'Matched' | 'Accepted' | 'Collected' | 'Completed' | 'Expired';

export type FssaiVerificationStatus = 'verified' | 'pending_review' | 'invalid' | 'expired' | 'document_unreadable';

export interface FssaiExtractedData {
  fssaiNumber?: string;
  organizationName?: string;
  address?: string;
  licenseType?: string;
  issueDate?: string;
  expiryDate?: string;
}

export interface FssaiVerificationChecks {
  fssaiNumberMatch: boolean;
  organizationNameMatch: boolean;
  documentReadable: boolean;
  certificateValid: boolean;
}

export interface FssaiVerificationResult {
  success: boolean;
  verificationStatus: FssaiVerificationStatus;
  extractedData: FssaiExtractedData;
  checks: FssaiVerificationChecks;
  message?: string;
  verifiedAt?: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  phone: string;
  address: string;
  contactPerson: string;
  fssai?: string;
  gstin?: string;
  verified: boolean;
  verificationStatus?: FssaiVerificationStatus;
  certificateUploaded?: boolean;
  extractedFssaiNumber?: string;
  certificateExpiryDate?: string;
  verificationTimestamp?: string;
  fssaiVerification?: FssaiVerificationResult;
  rating: number; // 1-5
  ratingCount: number;
  reliability: number; // 0-100%
  location: {
    lat: number;
    lng: number;
    addressText: string;
  };
  // Specific to receivers
  mealsRequired?: number;
  canCollect?: string; // e.g. "Daily Pickup", "Responsive", "Weekend Special"
  dietaryNeeds?: string[];
  // Specific to waste processors
  facilityType?: string; // e.g. "Biogas Plant", "Compost Facility", "Industrial Anaerobic Digester"
  capacityTons?: number;
}

export interface MatchScoreBreakdown {
  distanceScore: number;       // 40%
  quantityMatch: number;       // 25%
  transportCompatibility: number; // 15%
  foodTypeMatch: number;       // 10%
  reliabilityScore: number;    // 10%
  totalScore: number;          // 0-100 rounded
}

export interface MatchResult {
  receiverId: string;
  receiverName: string;
  receiverRole: UserRole;
  matchPercentage: number;
  distanceMiles: number;
  quantityRequired: number; // Meals required or Tons required
  canCollect: string;
  reliability: number;
  breakdown: MatchScoreBreakdown;
  allocatedAmount?: number;
  reasoning?: string;
}

export interface PartialAllocationStep {
  receiverId: string;
  receiverName: string;
  needed: number;
  allocated: number;
  remainingBefore: number;
  remainingAfter: number;
  matchScore: number;
}

// --- Pickup / Delivery logistics tracking -----------------------------------
// Status-based logistics timeline (no real GPS). In the demo the status is
// advanced manually and stored in frontend state. Modeled as an optional
// additive field on DonationPost so it maps 1:1 to a future Supabase `tracking`
// table without changing the existing donation shape.
export type TrackingStatus =
  | 'donation_created'
  | 'receiver_matched'
  | 'pickup_scheduled'
  | 'picked_up'
  | 'delivered'
  | 'cancelled'
  | 'expired'
  | 'waste_management';

export interface TrackingEvent {
  status: TrackingStatus;
  timestamp: string; // ISO 8601
  note?: string;
}

export interface TrackingInfo {
  status: TrackingStatus;
  history: TrackingEvent[];
  pickupLocation?: string;
  deliveryLocation?: string;
  estimatedPickupTime?: string; // ISO — estimate only (no real routing)
  estimatedDeliveryTime?: string; // ISO — estimate only (no real routing)
}

export interface DonationPost {
  id: string;
  donorId: string;
  donorName: string;
  type: PostType; // 'food' or 'organic_waste'
  title: string;
  description: string;
  quantityMeals: number; // or kg/tons for organic waste
  prepTime?: string;
  allergens?: string[];
  safeUntil: string;
  deliveryRadiusMiles: number;
  locationAddress: string;
  status: DonationStatus;
  createdAt: string;
  matches: MatchResult[];
  allocations: PartialAllocationStep[];
  assignedReceiverId?: string;
  assignedReceiverName?: string;
  ratingGiven?: boolean;
  // Food safety & recovery tracking
  recoveryPath?: 'donor' | 'waste_processor' | 'completed'; // tracking food recovery destination
  expiredAt?: string; // timestamp when donation was declared expired
  // Pickup/delivery logistics tracking (optional, additive — safe to persist later)
  tracking?: TrackingInfo;
}

export interface ReceiverRequest {
  id: string;
  receiverId: string;
  receiverName: string;
  mealsRequired: number;
  fulfilledMeals?: number;
  dietaryNotes: string[];
  urgency: 'Normal' | 'High' | 'Immediate';
  locationAddress: string;
  status: 'Active' | 'Matched' | 'Completed';
  createdAt: string;
  matchedDonationId?: string;
}

export interface RatingReview {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  donationId: string;
  rating: number; // 1-5
  reliabilityScore: number; // 0-100
  comment: string;
  createdAt: string;
}

export interface MapMarkerData {
  id: string;
  name: string;
  role: UserRole; // donor = Green, receiver = Blue, waste_processor = Brown
  lat: number;
  lng: number;
  distanceMiles: number;
  availableQuantity: string;
  matchScore: number;
  addressText: string;
  verified: boolean;
  reliability: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

// --- In-app notifications ----------------------------------------------------
// Reusable notification model kept entirely in frontend state (no DB table yet).
// Serializable so it can be persisted to a future Supabase `notifications` table
// 1:1. `userId` undefined = broadcast (visible to everyone / all roles).
export type NotificationType =
  | 'match'
  | 'expiry_warning'
  | 'allocation'
  | 'pickup'
  | 'delivery'
  | 'waste_management'
  | 'system';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string; // ISO 8601
  read: boolean;
  userId?: string; // target user id; undefined = broadcast to all
  relatedPostId?: string;
  actionView?: 'landing' | 'register' | 'login' | 'dashboard' | 'map';
}
