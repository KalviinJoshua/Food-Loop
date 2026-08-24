import {
  User,
  DonationPost,
  ReceiverRequest,
  MatchResult,
  UserRole,
} from '../types';

/**
 * Haversine formula: Calculate distance between two lat/lng points in miles
 */
export function calculateHaversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate outstanding demand for a receiver
 * Outstanding = original requested - already allocated/fulfilled
 */
export function calculateOutstandingDemand(
  receiver: User,
  request: ReceiverRequest | undefined,
  allocations: Array<{ receiverId: string; allocatedAmount?: number }>
): number {
  if (!request) {
    // No explicit request - use mealsRequired fallback
    return Math.max(0, receiver.mealsRequired || 0);
  }

  // Sum allocated/fulfilled amount
  const fulfilledAmount =
    (request.fulfilledMeals || 0) +
    allocations
      .filter((a) => a.receiverId === receiver.id)
      .reduce((sum, a) => sum + (a.allocatedAmount || 0), 0);

  const outstanding = Math.max(0, request.mealsRequired - fulfilledAmount);
  return outstanding;
}

/**
 * Calculate processor remaining capacity
 */
export function calculateRemainingCapacity(
  processor: User,
  allocations: Array<{ receiverId: string; allocatedAmount?: number }>
): number {
  const totalCapacity = processor.capacityTons || 100;
  const usedCapacity = allocations
    .filter((a) => a.receiverId === processor.id)
    .reduce((sum, a) => sum + (a.allocatedAmount || 0), 0);

  return Math.max(0, totalCapacity - usedCapacity);
}

/**
 * Distance Score: 40% weight
 * Closer = better. Up to delivery radius = 40, beyond decays proportionally.
 */
export function calculateDistanceScore(
  donorLat: number,
  donorLng: number,
  candidateLat: number,
  candidateLng: number,
  deliveryRadiusMiles: number
): { score: number; distanceMiles: number } {
  // If coordinates missing, use neutral score
  if (
    !Number.isFinite(donorLat) ||
    !Number.isFinite(donorLng) ||
    !Number.isFinite(candidateLat) ||
    !Number.isFinite(candidateLng)
  ) {
    return { score: 20, distanceMiles: 0 };
  }

  const distanceMiles = calculateHaversineDistance(donorLat, donorLng, candidateLat, candidateLng);

  // If within delivery radius, full 40 points
  if (distanceMiles <= deliveryRadiusMiles) {
    return { score: 40, distanceMiles };
  }

  // Beyond delivery radius, linear decay to 0
  // At 2x radius: ~20, at 3x radius: ~0 (scaled to deliveryRadiusMiles)
  const decayRatio = Math.max(0, 1 - (distanceMiles - deliveryRadiusMiles) / deliveryRadiusMiles);
  const score = Math.round(decayRatio * 40);

  return { score, distanceMiles };
}

/**
 * Quantity Match Score: 25% weight
 * Optimal when available quantity matches need
 */
export function calculateQuantityScore(
  availableQuantity: number,
  neededQuantity: number
): number {
  if (neededQuantity <= 0 || availableQuantity <= 0) {
    return 0;
  }

  const ratio = Math.min(availableQuantity, neededQuantity) / Math.max(availableQuantity, neededQuantity);
  return Math.round(ratio * 25);
}

/**
 * Transport Compatibility Score: 15% weight
 */
export function calculateTransportScore(canCollect: string | undefined): number {
  if (!canCollect) return 12;

  if (canCollect.includes('Daily') || canCollect.includes('Fleet')) {
    return 15;
  }
  if (canCollect.includes('Responsive')) {
    return 14;
  }
  return 12;
}

/**
 * Food Type / Facility Match Score: 10% weight
 */
export function calculateFoodTypeScore(
  postType: 'food' | 'organic_waste',
  candidate: User,
  allergens?: string[]
): number {
  if (postType === 'food') {
    // Check for dietary incompatibility (allergen safety)
    if (allergens && allergens.length > 0) {
      // If receiver has strict allergen restrictions that conflict, lower score
      // For simplicity, assume dietaryNeeds includes allergen info if present
      if (candidate.dietaryNeeds && candidate.dietaryNeeds.some(need => 
        allergens.some(allergen => 
          need.toLowerCase().includes('no ' + allergen.toLowerCase()) ||
          need.toLowerCase().includes('allergy to ' + allergen.toLowerCase())
        )
      )) {
        return 0; // Safety incompatibility
      }
    }

    // Dietary match
    if (
      candidate.dietaryNeeds?.includes('Vegan-Friendly') ||
      candidate.dietaryNeeds?.includes('All Types')
    ) {
      return 10;
    }
    return 9;
  } else {
    // Organic waste - match processor facility type
    if (
      candidate.facilityType === 'Biogas Plant' ||
      candidate.facilityType === 'Compost Facility'
    ) {
      return 10;
    }
    return 9;
  }
}

/**
 * Reliability Score: 10% weight
 */
export function calculateReliabilityScore(reliability: number): number {
  if (!Number.isFinite(reliability) || reliability < 0) {
    return 0;
  }
  return Math.round((Math.min(100, reliability) / 100) * 10);
}

/**
 * Calculate complete match score for a candidate
 */
export function calculateMatchScore(
  donorPost: DonationPost,
  candidate: User,
  outstandingDemand: number,
  allUsers: User[]
): MatchResult | null {
  // Skip if no outstanding demand
  if (outstandingDemand <= 0 && donorPost.type === 'food') {
    return null;
  }

  // Skip if insufficient capacity (for processors)
  if (donorPost.type === 'organic_waste' && candidate.capacityTons && candidate.capacityTons < 0) {
    return null;
  }

  const donor = allUsers.find((u) => u.id === donorPost.donorId);
  if (!donor) return null;

  const { score: distanceScore, distanceMiles } = calculateDistanceScore(
    donor.location.lat,
    donor.location.lng,
    candidate.location.lat,
    candidate.location.lng,
    donorPost.deliveryRadiusMiles
  );

  const quantityScore = calculateQuantityScore(
    donorPost.quantityMeals,
    outstandingDemand
  );

  const transportScore = calculateTransportScore(candidate.canCollect);

  const foodTypeScore = calculateFoodTypeScore(
    donorPost.type,
    candidate,
    donorPost.allergens
  );

  const reliabilityScore = calculateReliabilityScore(candidate.reliability);

  const totalScore = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        distanceScore +
          quantityScore +
          transportScore +
          foodTypeScore +
          reliabilityScore
      )
    )
  );

  return {
    receiverId: candidate.id,
    receiverName: candidate.name,
    receiverRole: candidate.role,
    matchPercentage: totalScore,
    distanceMiles,
    quantityRequired: outstandingDemand,
    canCollect: candidate.canCollect || 'Daily Pickup',
    reliability: candidate.reliability,
    breakdown: {
      distanceScore,
      quantityMatch: quantityScore,
      transportCompatibility: transportScore,
      foodTypeMatch: foodTypeScore,
      reliabilityScore,
      totalScore,
    },
  };
}

/**
 * Get top 3 dynamic matches for a donation
 */
export function getDynamicTop3Matches(
  donorPost: DonationPost,
  allUsers: User[],
  allRequests: ReceiverRequest[],
  allPosts: DonationPost[]
): MatchResult[] {
  // Determine candidate role
  const candidateRole: UserRole =
    donorPost.type === 'food' ? 'receiver' : 'waste_processor';

  // Get all active candidates
  const candidates = allUsers.filter(
    (u) => u.role === candidateRole && u.id !== donorPost.donorId
  );

  const matches: MatchResult[] = [];

  for (const candidate of candidates) {
    // Calculate outstanding demand for this candidate
    let outstandingDemand = 0;

    if (donorPost.type === 'food') {
      // For receivers, get active request
      const request = allRequests.find(
        (r) => r.receiverId === candidate.id && r.status === 'Active'
      );
      
      // Get existing allocations to this receiver from all posts
      const existingAllocations = allPosts
        .filter(
          (p) =>
            p.type === 'food' &&
            p.status !== 'Completed' &&
            p.allocations?.some((a) => a.receiverId === candidate.id)
        )
        .flatMap((p) => p.allocations || [])
        .filter((a) => a.receiverId === candidate.id);

      outstandingDemand = calculateOutstandingDemand(candidate, request, existingAllocations);
    } else {
      // For processors, use capacity
      const existingAllocations = allPosts
        .filter((p) => p.type === 'organic_waste' && p.status !== 'Completed')
        .flatMap((p) => p.allocations || [])
        .filter((a) => a.receiverId === candidate.id);

      outstandingDemand = calculateRemainingCapacity(candidate, existingAllocations);
    }

    if (outstandingDemand <= 0) {
      continue;
    }

    const match = calculateMatchScore(donorPost, candidate, outstandingDemand, allUsers);

    if (match && match.matchPercentage > 0) {
      matches.push(match);
    }
  }

  // Sort by total score descending, with tie-breaking
  matches.sort((a, b) => {
    if (b.breakdown.totalScore !== a.breakdown.totalScore) {
      return b.breakdown.totalScore - a.breakdown.totalScore;
    }
    // Tie-break: reliability
    if (b.reliability !== a.reliability) {
      return b.reliability - a.reliability;
    }
    // Tie-break: distance (closer is better)
    return a.distanceMiles - b.distanceMiles;
  });

  return matches.slice(0, 3);
}
