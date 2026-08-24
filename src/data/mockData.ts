import {
  User,
  DonationPost,
  ReceiverRequest,
  MatchResult,
  PartialAllocationStep,
  MapMarkerData,
  UserRole,
} from '../types';

import {
  calculateHaversineDistance,
  calculateOutstandingDemand,
  calculateRemainingCapacity,
  calculateDistanceScore,
  calculateQuantityScore,
  calculateTransportScore,
  calculateFoodTypeScore,
  calculateReliabilityScore,
  getDynamicTop3Matches,
} from './matchingEngine';

// ==========================================
// 15 MOCK DONORS
// ==========================================
export const MOCK_DONORS: User[] = [
  {
    id: 'donor-1',
    name: 'Green Bistro',
    role: 'donor',
    email: 'contact@greenbistro.com',
    phone: '+91',
    address: '142 Green St, Downtown, NY',
    contactPerson: 'Marcus Vance',
    fssai: '11523004000188',
    gstin: '07AABCU9603R1Z2',
    verified: true,
    rating: 4.9,
    ratingCount: 42,
    reliability: 98,
    location: { lat: 40.7128, lng: -74.006, addressText: 'Downtown, NY' },
  },
  {
    id: 'donor-2',
    name: 'Grand Plaza Hotel & Suites',
    role: 'donor',
    email: 'csr@grandplaza.com',
    phone: '+91',
    address: '350 5th Ave, Midtown, NY',
    contactPerson: 'Elena Rostova',
    fssai: '11523004000189',
    gstin: '07AABCU9603R1Z3',
    verified: true,
    rating: 4.8,
    ratingCount: 65,
    reliability: 96,
    location: { lat: 40.7484, lng: -73.9857, addressText: 'Midtown, NY' },
  },
  {
    id: 'donor-3',
    name: 'Metro Fresh Supermarket',
    role: 'donor',
    email: 'sustainability@metrofresh.com',
    phone: '+91',
    address: '88 Lexington Ave, Gramercy, NY',
    contactPerson: 'David Chen',
    fssai: '11523004000190',
    gstin: '07AABCU9603R1Z4',
    verified: true,
    rating: 4.7,
    ratingCount: 38,
    reliability: 94,
    location: { lat: 40.7411, lng: -73.983, addressText: 'Gramercy, NY' },
  },
  {
    id: 'donor-4',
    name: 'Sunrise Nursing Home',
    role: 'donor',
    email: 'nutrition@sunshinenursing.com',
    phone: '+91',
    address: '45 Sunset Blvd, Upper West Side, NY',
    contactPerson: 'Sarah Johnson',
    fssai: '11523004000191',
    gstin: '07AABCU9603R1Z5',
    verified: true,
    rating: 4.8,
    ratingCount: 52,
    reliability: 95,
    location: { lat: 40.7829, lng: -73.9654, addressText: 'Upper West Side, NY' },
  },
  {
    id: 'donor-5',
    name: 'City Community Kitchen',
    role: 'donor',
    email: 'info@citycommunitykitchen.org',
    phone: '+91',
    address: '200 1st Avenue, East Village, NY',
    contactPerson: 'Mike Rivera',
    fssai: '11523004000192',
    gstin: '07AABCU9603R1Z6',
    verified: true,
    rating: 4.6,
    ratingCount: 29,
    reliability: 92,
    location: { lat: 40.7282, lng: -73.9857, addressText: 'East Village, NY' },
  },
  {
    id: 'donor-6',
    name: 'EcoFresh Produce Market',
    role: 'donor',
    email: 'sales@ecofresh.com',
    phone: '+91',
    address: '88 Willow Street, SoHo, NY',
    contactPerson: 'Jenna Lee',
    fssai: '11523004000193',
    gstin: '07AABCU9603R1Z7',
    verified: true,
    rating: 4.9,
    ratingCount: 45,
    reliability: 97,
    location: { lat: 40.7247, lng: -73.9959, addressText: 'SoHo, NY' },
  },
  {
    id: 'donor-7',
    name: 'Riverside Bakery & Cafe',
    role: 'donor',
    email: 'order@riversidecafe.com',
    phone: '+91',
    address: '120 Riverside Drive, Riverside South, NY',
    contactPerson: 'Tom Anderson',
    fssai: '11523004000194',
    gstin: '07AABCU9603R1Z8',
    verified: true,
    rating: 4.7,
    ratingCount: 34,
    reliability: 93,
    location: { lat: 40.8325, lng: -74.0115, addressText: 'Riverside South, NY' },
  },
  {
    id: 'donor-8',
    name: 'Green Leaf Hospital',
    role: 'donor',
    email: 'catering@greenleafhospital.com',
    phone: '+91',
    address: '300 Park Avenue, Midtown East, NY',
    contactPerson: 'Dr. Emily Chen',
    fssai: '11523004000195',
    gstin: '07AABCU9603R1Z9',
    verified: true,
    rating: 4.9,
    ratingCount: 58,
    reliability: 99,
    location: { lat: 40.7602, lng: -73.9757, addressText: 'Midtown East, NY' },
  },
  {
    id: 'donor-9',
    name: 'Sunset Restaurant Group',
    role: 'donor',
    email: 'events@sunsetrestaurantgroup.com',
    phone: '+91',
    address: '500 Ocean Drive, Coney Island, NY',
    contactPerson: 'Carlos Martinez',
    fssai: '11523004000196',
    gstin: '07AABCU9603R1Z0',
    verified: true,
    rating: 4.8,
    ratingCount: 41,
    reliability: 94,
    location: { lat: 40.5576, lng: -73.9932, addressText: 'Coney Island, NY' },
  },
  {
    id: 'donor-10',
    name: 'Harvest Hope Food Bank',
    role: 'donor',
    email: 'donations@harvesthope.org',
    phone: '+91',
    address: '800 Hope Street, Brownsville, NY',
    contactPerson: 'James Wilson',
    fssai: '11523004000197',
    gstin: '07AABCU9603R1Z1',
    verified: true,
    rating: 4.5,
    ratingCount: 27,
    reliability: 88,
    location: { lat: 40.6713, lng: -73.8999, addressText: 'Brownsville, NY' },
  },
];

// ==========================================
// 10 MOCK RECEIVERS
// ==========================================
export const MOCK_RECEIVERS: User[] = [
  {
    id: 'receiver-1',
    name: 'Hope Foundation',
    role: 'receiver',
    email: 'admin@hopefoundation.org',
    phone: '+91',
    address: '45 E 1st St, East Village, NY',
    contactPerson: 'Sarah Martinez',
    mealsRequired: 250,
    canCollect: 'Daily Pickup',
    dietaryNeeds: ['Vegan-Friendly', 'No Nuts'],
    rating: 4.9,
    ratingCount: 52,
    reliability: 96,
    location: { lat: 40.7282, lng: -73.9857, addressText: 'East Village, NY' },
    verified: true,
  },
  {
    id: 'receiver-2',
    name: 'City Meals on Wheels',
    role: 'receiver',
    email: 'contact@citymeals.org',
    phone: '+91',
    address: '120 W 3rd St, Greenwich Village, NY',
    contactPerson: 'David Kim',
    mealsRequired: 180,
    canCollect: 'Responsive',
    dietaryNeeds: ['Vegetarian', 'Dairy-Free'],
    rating: 4.7,
    ratingCount: 41,
    reliability: 94,
    location: { lat: 40.7308, lng: -74.0005, addressText: 'Greenwich Village, NY' },
    verified: true,
  },
  {
    id: 'receiver-3',
    name: 'Community Kitchen Collective',
    role: 'receiver',
    email: 'info@communitykitchen.org',
    phone: '+91',
    address: '88 MacDougal St, SoHo, NY',
    contactPerson: 'Maria Garcia',
    mealsRequired: 320,
    canCollect: 'Daily Pickup',
    dietaryNeeds: ['All Types'],
    rating: 4.8,
    ratingCount: 47,
    reliability: 95,
    location: { lat: 40.7247, lng: -73.9959, addressText: 'SoHo, NY' },
    verified: true,
  },
  {
    id: 'receiver-4',
    name: 'Green Spaces Food Pantry',
    role: 'receiver',
    email: 'support@greenspaces.org',
    phone: '+91',
    address: '200 Avenger Place, Gramercy, NY',
    contactPerson: 'Robert Chen',
    mealsRequired: 150,
    canCollect: 'Weekend Special',
    dietaryNeeds: ['Low Sodium', 'Gluten-Free'],
    rating: 4.6,
    ratingCount: 33,
    reliability: 92,
    location: { lat: 40.7411, lng: -73.983, addressText: 'Gramercy, NY' },
    verified: true,
  },
  {
    id: 'receiver-5',
    name: 'Youth Outreach Program',
    role: 'receiver',
    email: 'youthoutreach@school.org',
    phone: '+91',
    address: '300 School Street, Lower East Side, NY',
    contactPerson: 'Lisa Anderson',
    mealsRequired: 200,
    canCollect: 'Responsive',
    dietaryNeeds: ['Halal', 'No Pork'],
    rating: 4.5,
    ratingCount: 29,
    reliability: 91,
    location: { lat: 40.7194, lng: -73.9888, addressText: 'Lower East Side, NY' },
    verified: true,
  },
  {
    id: 'receiver-6',
    name: 'Senior Citizens Center',
    role: 'receiver',
    email: 'seniors@community.org',
    phone: '+91',
    address: '500 Maple Avenue, Washington Heights, NY',
    contactPerson: 'Thomas Wright',
    mealsRequired: 280,
    canCollect: 'Daily Pickup',
    dietaryNeeds: ['Soft Food', 'Low Sugar'],
    rating: 4.8,
    ratingCount: 38,
    reliability: 94,
    location: { lat: 40.8425, lng: -73.9436, addressText: 'Washington Heights, NY' },
    verified: true,
  },
  {
    id: 'receiver-7',
    name: 'Family Hunger Relief',
    role: 'receiver',
    email: 'help@familyrelief.org',
    phone: '+91',
    address: '88 Hope Lane, Flatbush, NY',
    contactPerson: 'Michelle Torres',
    mealsRequired: 190,
    canCollect: 'Responsive',
    dietaryNeeds: ['Peanut-Free', 'Dairy-Free'],
    rating: 4.7,
    ratingCount: 35,
    reliability: 93,
    location: { lat: 40.6436, lng: -73.9442, addressText: 'Flatbush, NY' },
    verified: true,
  },
  {
    id: 'receiver-8',
    name: 'Weekend Food Ministry',
    role: 'receiver',
    email: 'ministry@weekendfood.org',
    phone: '+91',
    address: '120 Church Street, Tribeca, NY',
    contactPerson: 'Paul Evans',
    mealsRequired: 160,
    canCollect: 'Weekend Special',
    dietaryNeeds: ['Kosher'],
    rating: 4.9,
    ratingCount: 44,
    reliability: 98,
    location: { lat: 40.7214, lng: -74.0074, addressText: 'Tribeca, NY' },
    verified: true,
  },
  {
    id: 'receiver-9',
    name: 'After School Programs',
    role: 'receiver',
    email: 'programs@school.org',
    phone: '+91',
    address: '45 School Lane, Lower East Side, NY',
    contactPerson: 'Jessica Lee',
    mealsRequired: 220,
    canCollect: 'Daily Pickup',
    dietaryNeeds: ['All Types'],
    rating: 4.8,
    ratingCount: 39,
    reliability: 96,
    location: { lat: 40.7194, lng: -73.9888, addressText: 'Lower East Side, NY' },
    verified: true,
  },
  {
    id: 'receiver-10',
    name: 'Emergency Food Relief',
    role: 'receiver',
    email: 'emergency@relief.org',
    phone: '+91',
    address: '88 Crisis Avenue, Brownsville, NY',
    contactPerson: 'Mark Stevens',
    mealsRequired: 140,
    canCollect: 'Responsive',
    dietaryNeeds: ['Emergency'],
    rating: 4.4,
    ratingCount: 22,
    reliability: 87,
    location: { lat: 40.6713, lng: -73.8999, addressText: 'Brownsville, NY' },
    verified: true,
  },
];

// ==========================================
// 5 MOCK WASTE PROCESSORS
// ==========================================
export const MOCK_WASTE_PROCESSORS: User[] = [
  {
    id: 'waste-1',
    name: 'EcoCompost Facility',
    role: 'waste_processor',
    email: 'info@ecocomp.com',
    phone: '+91',
    address: '500 Industrial Way, Bronx, NY',
    contactPerson: 'Mike Roberts',
    facilityType: 'Compost Facility',
    capacityTons: 50,
    rating: 4.8,
    ratingCount: 28,
    reliability: 93,
    location: { lat: 40.8178, lng: -73.9214, addressText: 'Bronx, NY' },
    verified: true,
  },
  {
    id: 'waste-2',
    name: 'Green Energy Biogas Plant',
    role: 'waste_processor',
    email: 'operations@greenbiogas.com',
    phone: '+91',
    address: '200 Bioenergy Drive, Queens, NY',
    contactPerson: 'Lisa Chen',
    facilityType: 'Biogas Plant',
    capacityTons: 75,
    rating: 4.9,
    ratingCount: 35,
    reliability: 97,
    location: { lat: 40.7139, lng: -73.7989, addressText: 'Queens, NY' },
    verified: true,
  },
  {
    id: 'waste-3',
    name: 'Urban Anaerobic Digester',
    role: 'waste_processor',
    email: 'contact@urbandigester.com',
    phone: '+91',
    address: '300 Waste Road, Brooklyn, NY',
    contactPerson: 'James Smith',
    facilityType: 'Industrial Anaerobic Digester',
    capacityTons: 100,
    rating: 4.7,
    ratingCount: 31,
    reliability: 94,
    location: { lat: 40.6402, lng: -73.9442, addressText: 'Brooklyn, NY' },
    verified: true,
  },
  {
    id: 'waste-4',
    name: 'Clean Earth Composters',
    role: 'waste_processor',
    email: 'info@cleanearthcompost.com',
    phone: '+91',
    address: '150 Greenway, Staten Island, NY',
    contactPerson: 'Sarah Brown',
    facilityType: 'Compost Facility',
    capacityTons: 40,
    rating: 4.6,
    ratingCount: 26,
    reliability: 92,
    location: { lat: 40.5761, lng: -74.1386, addressText: 'Staten Island, NY' },
    verified: true,
  },
  {
    id: 'waste-5',
    name: 'Renew Energy Solutions',
    role: 'waste_processor',
    email: 'sales@renewenergy.com',
    phone: '+91',
    address: '250 Eco Drive, Westchester, NY',
    contactPerson: 'Daniel Lee',
    facilityType: 'Biogas Plant',
    capacityTons: 60,
    rating: 4.8,
    ratingCount: 30,
    reliability: 95,
    location: { lat: 40.9589, lng: -73.7529, addressText: 'Westchester, NY' },
    verified: true,
  },
];

export const ALL_MOCK_USERS = [...MOCK_DONORS, ...MOCK_RECEIVERS, ...MOCK_WASTE_PROCESSORS];

// ==========================================
// SMART MATCHING ENGINE FORMULA
// ==========================================
export function calculateMatchScore(
  donorPost: {
    type: 'food' | 'organic_waste';
    quantityMeals: number;
    allergens?: string[];
    deliveryRadiusMiles: number;
  },
  candidate: User
): MatchResult {
  // 1. Distance Score (40% max weight)
  // Closer is better. Up to 5 miles = near 100%, drops linearly to 40% at 15 miles
  const distanceMiles = parseFloat(
    (1 + Math.abs(candidate.location.lat - 40.7128) * 45 + Math.abs(candidate.location.lng - (-73.9857)) * 45).toFixed(1)
  );
  let distRatio = Math.max(0, 1 - distanceMiles / 15);
  const distanceScore = Math.round(distRatio * 40);

  // 2. Quantity Match (25% max weight)
  // Optimal when receiver's mealsRequired or facility capacity matches the donation quantity
  const required = donorPost.type === 'food' ? (candidate.mealsRequired || 100) : (candidate.capacityTons || 100);
  const ratio = Math.min(donorPost.quantityMeals, required) / Math.max(donorPost.quantityMeals, required, 1);
  const quantityMatch = Math.round(ratio * 25);

  // 3. Transport Compatibility (15% max weight)
  let transportCompatibility = 12;
  if (candidate.canCollect?.includes('Daily') || candidate.canCollect?.includes('Fleet')) {
    transportCompatibility = 15;
  } else if (candidate.canCollect?.includes('Responsive')) {
    transportCompatibility = 14;
  }

  // 4. Food Type / Facility Match (10% max weight)
  let foodTypeMatch = 9;
  if (donorPost.type === 'food') {
    if (candidate.dietaryNeeds?.includes('Vegan-Friendly') || candidate.dietaryNeeds?.includes('All Types')) {
      foodTypeMatch = 10;
    }
  } else {
    if (candidate.facilityType === 'Biogas Plant' || candidate.facilityType === 'Compost Facility') {
      foodTypeMatch = 10;
    }
  }

  // 5. Reliability Score (10% max weight)
  const reliabilityScore = Math.round((candidate.reliability / 100) * 10);

  // Total Percentage (0 - 100)
  const totalScore = Math.min(
    100,
    Math.round(distanceScore + quantityMatch + transportCompatibility + foodTypeMatch + reliabilityScore)
  );

  return {
    receiverId: candidate.id,
    receiverName: candidate.name,
    receiverRole: candidate.role,
    matchPercentage: totalScore,
    distanceMiles,
    quantityRequired: required,
    canCollect: candidate.canCollect || 'Daily Pickup',
    reliability: candidate.reliability,
    breakdown: {
      distanceScore,
      quantityMatch,
      transportCompatibility,
      foodTypeMatch,
      reliabilityScore,
      totalScore,
    },
  };
}

/**
 * Computes Top 3 Matches for a Donation Post
 */
export function getTop3Matches(
  donorPost: {
    type: 'food' | 'organic_waste';
    quantityMeals: number;
    allergens?: string[];
    deliveryRadiusMiles: number;
  }
): MatchResult[] {
  const candidates = donorPost.type === 'food' ? MOCK_RECEIVERS : MOCK_WASTE_PROCESSORS;

  const matches = candidates.map((candidate) => calculateMatchScore(donorPost, candidate));

  // Sort descending by match percentage
  matches.sort((a, b) => b.matchPercentage - a.matchPercentage);

  return matches.slice(0, 3);
}

/**
 * Partial Allocation Engine
 * Automatically distributes total meals among the top receivers.
 * Example: Restaurant: 300 meals -> Receiver A Needs 80 Remaining 220 -> Receiver B Needs 100 Remaining 120 -> Receiver C Needs 120 Remaining 0.
 */
export function calculatePartialAllocation(
  totalQuantity: number,
  matches: MatchResult[]
): PartialAllocationStep[] {
  let remaining = totalQuantity;
  const steps: PartialAllocationStep[] = [];

  for (const m of matches) {
    if (remaining <= 0) break;

    const needed = m.quantityRequired;
    const allocated = Math.min(remaining, needed);
    const before = remaining;
    remaining = Math.max(0, remaining - allocated);

    steps.push({
      receiverId: m.receiverId,
      receiverName: m.receiverName,
      needed,
      allocated,
      remainingBefore: before,
      remainingAfter: remaining,
      matchScore: m.matchPercentage,
    });
  }

  return steps;
}

// ==========================================
// INITIAL MOCK DONATION POSTS
// ==========================================
export const INITIAL_DONATION_POSTS: DonationPost[] = [
  {
    id: 'post-1',
    donorId: 'donor-1',
    donorName: 'Green Bistro',
    type: 'food',
    title: '300 Meals - Mixed Hot Buffet & Fresh Salads',
    description: 'Hot buffet trays of roasted chicken, herb rice, steamed vegetables, and seasonal salad bowls. Kept in sealed thermal cambro containers.',
    quantityMeals: 300,
    prepTime: '18:30',
    allergens: ['Nuts', 'Dairy', 'Vegan-Friendly'],
    safeUntil: '2026-08-02T22:30:00',
    deliveryRadiusMiles: 10,
    locationAddress: '142 Green St, Downtown, NY',
    status: 'Posted',
    createdAt: '2026-08-24T16:20:00',
    matches: [],
    allocations: [],
  },
  {
    id: 'post-2',
    donorId: 'donor-2',
    donorName: 'Grand Plaza Hotel & Suites',
    type: 'food',
    title: '500 Meals - Banquet Style Buffet',
    description: 'Gourmet banquet spread featuring beef, chicken, vegetarian options, and fresh desserts. All dietary restrictions available upon request.',
    quantityMeals: 500,
    prepTime: '19:00',
    allergens: ['Nuts', 'Dairy', 'Eggs', 'Gluten'],
    safeUntil: '2026-08-25T20:30:00',
    deliveryRadiusMiles: 15,
    locationAddress: '350 5th Ave, Midtown, NY',
    status: 'Posted',
    createdAt: '2026-08-24T14:10:00',
    matches: [],
    allocations: [],
  },
  {
    id: 'post-3',
    donorId: 'donor-3',
    donorName: 'Metro Fresh Supermarket',
    type: 'food',
    title: '200 Meals - Dietary Specific Program',
    description: 'Meals prepared for specific dietary requirements. Available: Vegan, Vegetarian, Halal, Kosher, Diabetic-friendly options.',
    quantityMeals: 200,
    prepTime: '17:00',
    allergens: ['Soy', 'Wheat', 'Tree Nuts'],
    safeUntil: '2026-08-24T23:30:00',
    deliveryRadiusMiles: 8,
    locationAddress: '88 Lexington Ave, Gramercy, NY',
    status: 'Posted',
    createdAt: '2026-08-24T12:00:00',
    matches: [],
    allocations: [],
  },
  {
    id: 'post-4',
    donorId: 'donor-4',
    donorName: 'Sunrise Nursing Home',
    type: 'organic_waste',
    title: '75 Tons - Food Waste for Composting',
    description: 'Daily food waste from nursing home kitchen. High organic content, no plastics or treated wood. Ready for pickup Monday through Friday.',
    quantityMeals: 75,
    prepTime: '08:00',
    allergens: [],
    safeUntil: '2026-08-30T18:00:00',
    deliveryRadiusMiles: 20,
    locationAddress: '45 Sunset Blvd, Upper West Side, NY',
    status: 'Posted',
    createdAt: '2026-08-24T10:30:00',
    matches: [],
    allocations: [],
  },
  {
    id: 'post-5',
    donorId: 'donor-5',
    donorName: 'City Community Kitchen',
    type: 'organic_waste',
    title: '40 Tons - Restaurant Food Waste',
    description: 'Commercial kitchen waste from multiple food service operations. Contains vegetables, fruits, meats, and grains. Suitable for anaerobic digestion.',
    quantityMeals: 40,
    prepTime: '09:00',
    allergens: [],
    safeUntil: '2026-08-31T16:00:00',
    deliveryRadiusMiles: 25,
    locationAddress: '200 1st Avenue, East Village, NY',
    status: 'Posted',
    createdAt: '2026-08-24T11:15:00',
    matches: [],
    allocations: [],
  },
  {
    id: 'post-6',
    donorId: 'donor-6',
    donorName: 'EcoFresh Produce Market',
    type: 'food',
    title: '150 Meals - Fresh Produce & Proteins',
    description: 'Daily selection of fresh produce, proteins, and pantry staples. Mostly seasonal ingredients, minimal processed foods.',
    quantityMeals: 150,
    prepTime: '17:30',
    allergens: ['Fish', 'Shellfish', 'Soy'],
    safeUntil: '2026-08-25T22:00:00',
    deliveryRadiusMiles: 12,
    locationAddress: '88 Willow Street, SoHo, NY',
    status: 'Posted',
    createdAt: '2026-08-24T13:45:00',
    matches: [],
    allocations: [],
  },
  {
    id: 'post-7',
    donorId: 'donor-7',
    donorName: 'Riverside Bakery & Cafe',
    type: 'food',
    title: '80 Meals - Baked Goods & Pastries',
    description: 'Fresh baked goods including bread, pastries, muffins, and cakes. All baked with premium ingredients, some contain dairy and eggs.',
    quantityMeals: 80,
    prepTime: '06:30',
    allergens: ['Dairy', 'Eggs', 'Wheat'],
    safeUntil: '2026-08-25T16:45:00',
    deliveryRadiusMiles: 6,
    locationAddress: '120 Riverside Drive, Riverside South, NY',
    status: 'Posted',
    createdAt: '2026-08-24T09:20:00',
    matches: [],
    allocations: [],
  },
  {
    id: 'post-8',
    donorId: 'donor-8',
    donorName: 'Green Leaf Hospital',
    type: 'food',
    title: '400 Meals - Patient Dietary Requirements',
    description: 'Meals prepared for hospital patients with various dietary needs. Low sodium, diabetes-friendly, post-surgery recovery options available.',
    quantityMeals: 400,
    prepTime: '18:00',
    allergens: ['Soy', 'Corn', 'Artificial Sweeteners'],
    safeUntil: '2026-08-27T20:00:00',
    deliveryRadiusMiles: 18,
    locationAddress: '300 Park Avenue, Midtown East, NY',
    status: 'Posted',
    createdAt: '2026-08-24T15:00:00',
    matches: [],
    allocations: [],
  },
  {
    id: 'post-9',
    donorId: 'donor-9',
    donorName: 'Sunset Restaurant Group',
    type: 'food',
    title: '120 Meals - Special Events Catering',
    description: 'Catering for private events and celebrations. Customizable menus available. Fresh ingredients, dietary accommodations provided.',
    quantityMeals: 120,
    prepTime: '17:30',
    allergens: ['Shellfish', 'Peanuts', 'Tree Nuts'],
    safeUntil: '2026-08-26T19:00:00',
    deliveryRadiusMiles: 22,
    locationAddress: '500 Ocean Drive, Coney Island, NY',
    status: 'Posted',
    createdAt: '2026-08-24T16:00:00',
    matches: [],
    allocations: [],
  },
  {
    id: 'post-10',
    donorId: 'donor-10',
    donorName: 'Harvest Hope Food Bank',
    type: 'food',
    title: '250 Meals - Emergency Food Supply',
    description: 'Emergency food distribution for communities in need. Non-perishable items, some fresh produce available.',
    quantityMeals: 250,
    prepTime: '20:00',
    allergens: ['Peanuts', 'Soy'],
    safeUntil: '2026-08-28T17:30:00',
    deliveryRadiusMiles: 30,
    locationAddress: '800 Hope Street, Brownsville, NY',
    status: 'Posted',
    createdAt: '2026-08-24T17:00:00',
    matches: [],
    allocations: [],
  },
];

export const INITIAL_RECEIVER_REQUESTS: ReceiverRequest[] = [
  {
    id: 'req-1',
    receiverId: 'receiver-1',
    receiverName: 'Hope Foundation',
    mealsRequired: 250,
    dietaryNotes: ['Vegan-Friendly', 'No Nuts'],
    urgency: 'High',
    locationAddress: '45 E 1st St, East Village, NY',
    status: 'Active',
    createdAt: '2026-08-24T14:00:00',
  },
  {
    id: 'req-2',
    receiverId: 'receiver-2',
    receiverName: 'City Meals on Wheels',
    mealsRequired: 180,
    dietaryNotes: ['Vegetarian', 'Dairy-Free'],
    urgency: 'Normal',
    locationAddress: '120 W 3rd St, Greenwich Village, NY',
    status: 'Active',
    createdAt: '2026-08-24T15:00:00',
  },
  {
    id: 'req-3',
    receiverId: 'receiver-3',
    receiverName: 'Community Kitchen Collective',
    mealsRequired: 320,
    dietaryNotes: ['All Types'],
    urgency: 'High',
    locationAddress: '88 MacDougal St, SoHo, NY',
    status: 'Active',
    createdAt: '2026-08-24T16:00:00',
  },
  {
    id: 'req-4',
    receiverId: 'receiver-4',
    receiverName: 'Green Spaces Food Pantry',
    mealsRequired: 150,
    dietaryNotes: ['Low Sodium', 'Gluten-Free'],
    urgency: 'Normal',
    locationAddress: '200 Avenger Place, Gramercy, NY',
    status: 'Active',
    createdAt: '2026-08-24T17:00:00',
  },
  {
    id: 'req-5',
    receiverId: 'receiver-5',
    receiverName: 'Youth Outreach Program',
    mealsRequired: 200,
    dietaryNotes: ['Halal', 'No Pork'],
    urgency: 'Immediate',
    locationAddress: '300 School Street, Lower East Side, NY',
    status: 'Active',
    createdAt: '2026-08-24T18:00:00',
  },
  {
    id: 'req-6',
    receiverId: 'receiver-6',
    receiverName: 'Senior Citizens Center',
    mealsRequired: 280,
    dietaryNotes: ['Soft Food', 'Low Sugar'],
    urgency: 'High',
    locationAddress: '500 Maple Avenue, Washington Heights, NY',
    status: 'Active',
    createdAt: '2026-08-24T19:00:00',
  },
  {
    id: 'req-7',
    receiverId: 'receiver-7',
    receiverName: 'Family Hunger Relief',
    mealsRequired: 190,
    dietaryNotes: ['Peanut-Free', 'Dairy-Free'],
    urgency: 'Normal',
    locationAddress: '88 Hope Lane, Flatbush, NY',
    status: 'Active',
    createdAt: '2026-08-24T20:00:00',
  },
  {
    id: 'req-8',
    receiverId: 'receiver-8',
    receiverName: 'Weekend Food Ministry',
    mealsRequired: 160,
    dietaryNotes: ['Kosher'],
    urgency: 'Normal',
    locationAddress: '120 Church Street, Tribeca, NY',
    status: 'Active',
    createdAt: '2026-08-24T21:00:00',
  },
  {
    id: 'req-9',
    receiverId: 'receiver-9',
    receiverName: 'After School Programs',
    mealsRequired: 220,
    dietaryNotes: ['All Types'],
    urgency: 'High',
    locationAddress: '45 School Lane, Lower East Side, NY',
    status: 'Active',
    createdAt: '2026-08-24T22:00:00',
  },
  {
    id: 'req-10',
    receiverId: 'receiver-10',
    receiverName: 'Emergency Food Relief',
    mealsRequired: 140,
    dietaryNotes: ['Emergency'],
    urgency: 'Immediate',
    locationAddress: '88 Crisis Avenue, Brownsville, NY',
    status: 'Active',
    createdAt: '2026-08-24T23:00:00',
  },
];

// ==========================================
// MAP MARKERS HELPER
// ==========================================
export function getMapMarkersData(posts: DonationPost[]): MapMarkerData[] {
  const markers: MapMarkerData[] = [];

  // Add all Mock Donors (Green)
  MOCK_DONORS.forEach((d) => {
    const activePost = posts.find((p) => p.donorId === d.id && p.status !== 'Completed');
    markers.push({
      id: d.id,
      name: d.name,
      role: 'donor',
      lat: d.location.lat,
      lng: d.location.lng,
      distanceMiles: 0.8,
      availableQuantity: activePost ? `${activePost.quantityMeals} Meals Available` : '300 Meals Daily',
      matchScore: 98,
      addressText: d.address,
      verified: d.verified,
      reliability: d.reliability,
    });
  });

  // Add all Mock Receivers (Blue)
  MOCK_RECEIVERS.forEach((r) => {
    markers.push({
      id: r.id,
      name: r.name,
      role: 'receiver',
      lat: r.location.lat,
      lng: r.location.lng,
      distanceMiles: 1.4,
      availableQuantity: `Needs ${r.mealsRequired || 100} Meals`,
      matchScore: 94,
      addressText: r.address,
      verified: r.verified,
      reliability: r.reliability,
    });
  });

  // Add all Mock Waste Processors (Brown)
  MOCK_WASTE_PROCESSORS.forEach((w) => {
    markers.push({
      id: w.id,
      name: w.name,
      role: 'waste_processor',
      lat: w.location.lat,
      lng: w.location.lng,
      distanceMiles: 4.5,
      availableQuantity: `Capacity: ${w.capacityTons || 0} Tons`,
      matchScore: 92,
      addressText: w.address,
      verified: w.verified,
      reliability: w.reliability,
    });
  });

  return markers;
}
