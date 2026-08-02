import {
  User,
  DonationPost,
  ReceiverRequest,
  MatchResult,
  PartialAllocationStep,
  MapMarkerData,
  UserRole,
} from '../types';

// ==========================================
// 15 MOCK DONORS
// ==========================================
export const MOCK_DONORS: User[] = [
  {
    id: 'donor-1',
    name: 'Green Bistro',
    role: 'donor',
    email: 'contact@greenbistro.com',
    phone: '+1 (212) 555-0101',
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
    phone: '+1 (212) 555-0102',
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
    phone: '+1 (212) 555-0103',
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
    name: 'Daily Bread Artisanal Bakery',
    role: 'donor',
    email: 'hello@dailybread.com',
    phone: '+1 (212) 555-0104',
    address: '210 Bleeker St, Greenwich Village, NY',
    contactPerson: 'Sarah Jenkins',
    fssai: '11523004000191',
    gstin: '07AABCU9603R1Z5',
    verified: true,
    rating: 4.9,
    ratingCount: 51,
    reliability: 99,
    location: { lat: 40.7308, lng: -74.002, addressText: 'Greenwich Village, NY' },
  },
  {
    id: 'donor-5',
    name: 'Sunset Catering & Banquets',
    role: 'donor',
    email: 'ops@sunsetcatering.com',
    phone: '+1 (212) 555-0105',
    address: '450 W 33rd St, Hudson Yards, NY',
    contactPerson: 'Julian Morales',
    fssai: '11523004000192',
    gstin: '07AABCU9603R1Z6',
    verified: true,
    rating: 4.6,
    ratingCount: 29,
    reliability: 91,
    location: { lat: 40.7527, lng: -74.0003, addressText: 'Hudson Yards, NY' },
  },
  {
    id: 'donor-6',
    name: 'Gourmet Kitchens NYC',
    role: 'donor',
    email: 'info@gourmetkitchens.com',
    phone: '+1 (212) 555-0106',
    address: '155 W 19th St, Chelsea, NY',
    contactPerson: 'Hannah Abbott',
    fssai: '11523004000193',
    gstin: '07AABCU9603R1Z7',
    verified: true,
    rating: 4.8,
    ratingCount: 34,
    reliability: 95,
    location: { lat: 40.7415, lng: -73.9965, addressText: 'Chelsea, NY' },
  },
  {
    id: 'donor-7',
    name: 'Blue Ribbon Oyster & Seafood',
    role: 'donor',
    email: 'manager@blueribbonnyc.com',
    phone: '+1 (212) 555-0107',
    address: '97 Sullivan St, SoHo, NY',
    contactPerson: 'Robert Thorne',
    fssai: '11523004000194',
    gstin: '07AABCU9603R1Z8',
    verified: true,
    rating: 4.7,
    ratingCount: 21,
    reliability: 93,
    location: { lat: 40.726, lng: -74.0028, addressText: 'SoHo, NY' },
  },
  {
    id: 'donor-8',
    name: 'Little Italy Pasta House',
    role: 'donor',
    email: 'pasta@littleitalynyc.com',
    phone: '+1 (212) 555-0108',
    address: '130 Mulberry St, Little Italy, NY',
    contactPerson: 'Gianni Rossi',
    fssai: '11523004000195',
    gstin: '07AABCU9603R1Z9',
    verified: true,
    rating: 4.9,
    ratingCount: 48,
    reliability: 97,
    location: { lat: 40.7191, lng: -73.9973, addressText: 'Little Italy, NY' },
  },
  {
    id: 'donor-9',
    name: 'Skyline Events & Convention Hub',
    role: 'donor',
    email: 'banquets@skylineevents.com',
    phone: '+1 (212) 555-0109',
    address: '655 W 34th St, Convention Center, NY',
    contactPerson: 'Clara Oswald',
    fssai: '11523004000196',
    gstin: '07AABCU9603R1A1',
    verified: true,
    rating: 4.8,
    ratingCount: 59,
    reliability: 94,
    location: { lat: 40.758, lng: -74.002, addressText: 'Midtown West, NY' },
  },
  {
    id: 'donor-10',
    name: 'Whole Harvest Grocers',
    role: 'donor',
    email: 'waste@wholeharvest.com',
    phone: '+1 (212) 555-0110',
    address: '270 Greenwich St, Tribeca, NY',
    contactPerson: 'Noah Webster',
    fssai: '11523004000197',
    gstin: '07AABCU9603R1A2',
    verified: true,
    rating: 4.9,
    ratingCount: 72,
    reliability: 98,
    location: { lat: 40.7145, lng: -74.0112, addressText: 'Tribeca, NY' },
  },
  {
    id: 'donor-11',
    name: 'East River Deli & Cafe',
    role: 'donor',
    email: 'orders@eastriverdeli.com',
    phone: '+1 (212) 555-0111',
    address: '400 E 23rd St, Stuyvesant Town, NY',
    contactPerson: 'Peter Parker',
    fssai: '11523004000198',
    gstin: '07AABCU9603R1A3',
    verified: true,
    rating: 4.5,
    ratingCount: 19,
    reliability: 89,
    location: { lat: 40.7365, lng: -73.978, addressText: 'Stuyvesant Town, NY' },
  },
  {
    id: 'donor-12',
    name: 'Midtown Buffet Express',
    role: 'donor',
    email: 'info@midtownbuffet.com',
    phone: '+1 (212) 555-0112',
    address: '150 W 48th St, Midtown, NY',
    contactPerson: 'Kevin Lin',
    fssai: '11523004000199',
    gstin: '07AABCU9603R1A4',
    verified: true,
    rating: 4.7,
    ratingCount: 44,
    reliability: 95,
    location: { lat: 40.7589, lng: -73.9831, addressText: 'Midtown, NY' },
  },
  {
    id: 'donor-13',
    name: 'Harborfront Seafood & Grill',
    role: 'donor',
    email: 'ops@harborfrontgrill.com',
    phone: '+1 (212) 555-0113',
    address: '89 South St, Pier 17, NY',
    contactPerson: 'Lisa Cuddy',
    fssai: '11523004000200',
    gstin: '07AABCU9603R1A5',
    verified: true,
    rating: 4.6,
    ratingCount: 26,
    reliability: 92,
    location: { lat: 40.7058, lng: -74.0023, addressText: 'Financial District, NY' },
  },
  {
    id: 'donor-14',
    name: 'Central Park Terrace Restaurant',
    role: 'donor',
    email: 'contact@cpterrace.com',
    phone: '+1 (212) 555-0114',
    address: '180 Central Park S, NY',
    contactPerson: 'Siddhartha Mehta',
    fssai: '11523004000201',
    gstin: '07AABCU9603R1A6',
    verified: true,
    rating: 4.9,
    ratingCount: 81,
    reliability: 99,
    location: { lat: 40.7663, lng: -73.9777, addressText: 'Central Park South, NY' },
  },
  {
    id: 'donor-15',
    name: 'Urban Roasters & Bistro',
    role: 'donor',
    email: 'team@urbanroasters.com',
    phone: '+1 (212) 555-0115',
    address: '55 E 8th St, East Village, NY',
    contactPerson: 'Chloe Decker',
    fssai: '11523004000202',
    gstin: '07AABCU9603R1A7',
    verified: true,
    rating: 4.8,
    ratingCount: 33,
    reliability: 96,
    location: { lat: 40.7302, lng: -73.993, addressText: 'East Village, NY' },
  },
];

// ==========================================
// 15 MOCK RECEIVERS (NGOs / ORPHANAGES)
// ==========================================
export const MOCK_RECEIVERS: User[] = [
  {
    id: 'receiver-1',
    name: 'Hope Foundation',
    role: 'receiver',
    email: 'aid@hopefoundation.org',
    phone: '+1 (212) 555-0201',
    address: '45 E 1st St, East Village, NY',
    contactPerson: 'Sister Mary Grace',
    verified: true,
    rating: 5.0,
    ratingCount: 94,
    reliability: 100,
    mealsRequired: 80,
    canCollect: 'Daily Pickup',
    dietaryNeeds: ['Vegan-Friendly', 'No Nuts'],
    location: { lat: 40.7238, lng: -73.9893, addressText: '0.8 miles away' },
  },
  {
    id: 'receiver-2',
    name: 'Smile Trust',
    role: 'receiver',
    email: 'hello@smiletrust.org',
    phone: '+1 (212) 555-0202',
    address: '188 Bowery, Lower East Side, NY',
    contactPerson: 'Michael Chang',
    verified: true,
    rating: 4.9,
    ratingCount: 76,
    reliability: 95,
    mealsRequired: 120,
    canCollect: 'Responsive',
    dietaryNeeds: ['All Types'],
    location: { lat: 40.7212, lng: -73.9939, addressText: '2.4 miles away' },
  },
  {
    id: 'receiver-3',
    name: "Children's Home",
    role: 'receiver',
    email: 'care@childrenshome.org',
    phone: '+1 (212) 555-0203',
    address: '320 W 11th St, West Village, NY',
    contactPerson: 'Angela Brooks',
    verified: true,
    rating: 4.7,
    ratingCount: 52,
    reliability: 85,
    mealsRequired: 100,
    canCollect: 'Weekend Special',
    dietaryNeeds: ['Dairy Free', 'Vegan-Friendly'],
    location: { lat: 40.7356, lng: -74.0068, addressText: '4.1 miles away' },
  },
  {
    id: 'receiver-4',
    name: 'Unity Shelter NYC',
    role: 'receiver',
    email: 'intake@unityshelter.org',
    phone: '+1 (212) 555-0204',
    address: '110 Lafayette St, Chinatown, NY',
    contactPerson: 'David O\'Connor',
    verified: true,
    rating: 4.9,
    ratingCount: 110,
    reliability: 97,
    mealsRequired: 150,
    canCollect: 'Daily Pickup',
    dietaryNeeds: ['All Types'],
    location: { lat: 40.718, lng: -74.001, addressText: '1.2 miles away' },
  },
  {
    id: 'receiver-5',
    name: 'Community Kitchen NYC',
    role: 'receiver',
    email: 'soup@communitykitchen.org',
    phone: '+1 (212) 555-0205',
    address: '252 W 116th St, Harlem, NY',
    contactPerson: 'Reverend Thomas',
    verified: true,
    rating: 4.8,
    ratingCount: 88,
    reliability: 93,
    mealsRequired: 200,
    canCollect: 'Responsive',
    dietaryNeeds: ['Halal', 'Vegetarian'],
    location: { lat: 40.803, lng: -73.953, addressText: '6.2 miles away' },
  },
  {
    id: 'receiver-6',
    name: 'Second Harvest NGO',
    role: 'receiver',
    email: 'logistics@secondharvest.org',
    phone: '+1 (212) 555-0206',
    address: '88 E 3rd St, Manhattan, NY',
    contactPerson: 'Jessica Alba',
    verified: true,
    rating: 4.9,
    ratingCount: 61,
    reliability: 98,
    mealsRequired: 90,
    canCollect: 'Daily Pickup',
    dietaryNeeds: ['Vegan-Friendly'],
    location: { lat: 40.7255, lng: -73.9875, addressText: '1.5 miles away' },
  },
  {
    id: 'receiver-7',
    name: 'Sunshine Orphanage & Daycare',
    role: 'receiver',
    email: 'info@sunshinekids.org',
    phone: '+1 (212) 555-0207',
    address: '140 E 14th St, Gramercy, NY',
    contactPerson: 'Anita Desai',
    verified: true,
    rating: 4.8,
    ratingCount: 45,
    reliability: 91,
    mealsRequired: 65,
    canCollect: 'Responsive',
    dietaryNeeds: ['No Nuts', 'Low Sodium'],
    location: { lat: 40.7335, lng: -73.9882, addressText: '1.8 miles away' },
  },
  {
    id: 'receiver-8',
    name: 'Grace Relief Center',
    role: 'receiver',
    email: 'relief@gracenyc.org',
    phone: '+1 (212) 555-0208',
    address: '305 W 42nd St, Hell\'s Kitchen, NY',
    contactPerson: 'Raymond Reddington',
    verified: true,
    rating: 4.9,
    ratingCount: 79,
    reliability: 96,
    mealsRequired: 110,
    canCollect: 'Daily Pickup',
    dietaryNeeds: ['All Types'],
    location: { lat: 40.7583, lng: -73.9928, addressText: '3.1 miles away' },
  },
  {
    id: 'receiver-9',
    name: 'Bowery Mission Outreach',
    role: 'receiver',
    email: 'bowery@missionnyc.org',
    phone: '+1 (212) 555-0209',
    address: '227 Bowery, Lower Manhattan, NY',
    contactPerson: 'Pastor James',
    verified: true,
    rating: 5.0,
    ratingCount: 140,
    reliability: 99,
    mealsRequired: 180,
    canCollect: 'Daily Pickup',
    dietaryNeeds: ['All Types'],
    location: { lat: 40.722, lng: -73.993, addressText: '1.1 miles away' },
  },
  {
    id: 'receiver-10',
    name: 'St. Anthony Community Pantry',
    role: 'receiver',
    email: 'pantry@stanthony.org',
    phone: '+1 (212) 555-0210',
    address: '155 Sullivan St, SoHo, NY',
    contactPerson: 'Brother Francis',
    verified: true,
    rating: 4.8,
    ratingCount: 67,
    reliability: 94,
    mealsRequired: 75,
    canCollect: 'Responsive',
    dietaryNeeds: ['Vegetarian Friendly'],
    location: { lat: 40.7278, lng: -74.0012, addressText: '0.9 miles away' },
  },
  {
    id: 'receiver-11',
    name: 'Haven for Youth NYC',
    role: 'receiver',
    email: 'intake@havenyouth.org',
    phone: '+1 (212) 555-0211',
    address: '400 W 23rd St, Chelsea, NY',
    contactPerson: 'Tara Thornton',
    verified: true,
    rating: 4.7,
    ratingCount: 39,
    reliability: 90,
    mealsRequired: 85,
    canCollect: 'Weekend Special',
    dietaryNeeds: ['All Types'],
    location: { lat: 40.7468, lng: -74.002, addressText: '2.5 miles away' },
  },
  {
    id: 'receiver-12',
    name: 'City Harvest Distribution Hub',
    role: 'receiver',
    email: 'logistics@cityharvest.org',
    phone: '+1 (212) 555-0212',
    address: '150 52nd St, Sunset Park, NY',
    contactPerson: 'Greg House',
    verified: true,
    rating: 4.9,
    ratingCount: 125,
    reliability: 99,
    mealsRequired: 300,
    canCollect: 'Daily Pickup',
    dietaryNeeds: ['All Types'],
    location: { lat: 40.648, lng: -74.017, addressText: '5.8 miles away' },
  },
  {
    id: 'receiver-13',
    name: 'Good Samaritan Women\'s Shelter',
    role: 'receiver',
    email: 'shelter@goodsamaritan.org',
    phone: '+1 (212) 555-0213',
    address: '120 E 34th St, Murray Hill, NY',
    contactPerson: 'Monica Geller',
    verified: true,
    rating: 4.9,
    ratingCount: 84,
    reliability: 97,
    mealsRequired: 95,
    canCollect: 'Daily Pickup',
    dietaryNeeds: ['No Nuts', 'Dairy Free'],
    location: { lat: 40.746, lng: -73.98, addressText: '2.2 miles away' },
  },
  {
    id: 'receiver-14',
    name: 'Chinatown Community Care',
    role: 'receiver',
    email: 'care@chinatowncare.org',
    phone: '+1 (212) 555-0214',
    address: '60 Mott St, Chinatown, NY',
    contactPerson: 'Wong Ka-wai',
    verified: true,
    rating: 4.8,
    ratingCount: 53,
    reliability: 92,
    mealsRequired: 115,
    canCollect: 'Responsive',
    dietaryNeeds: ['Asian Traditional', 'No Dairy'],
    location: { lat: 40.715, lng: -73.998, addressText: '1.4 miles away' },
  },
  {
    id: 'receiver-15',
    name: 'East River Community Table',
    role: 'receiver',
    email: 'table@eastriver.org',
    phone: '+1 (212) 555-0215',
    address: '505 E 14th St, StuyTown, NY',
    contactPerson: 'Samantha Jones',
    verified: true,
    rating: 4.7,
    ratingCount: 41,
    reliability: 88,
    mealsRequired: 70,
    canCollect: 'Weekend Special',
    dietaryNeeds: ['Vegan-Friendly'],
    location: { lat: 40.7298, lng: -73.9789, addressText: '1.9 miles away' },
  },
];

// ==========================================
// 8 MOCK WASTE PROCESSORS (COMPOST / BIOGAS)
// ==========================================
export const MOCK_WASTE_PROCESSORS: User[] = [
  {
    id: 'processor-1',
    name: 'EcoCompost Facility',
    role: 'waste_processor',
    email: 'ops@ecocompost.com',
    phone: '+1 (212) 555-0301',
    address: '400 Varick Ave, Brooklyn, NY',
    contactPerson: 'Arthur Pendelton',
    verified: true,
    rating: 4.9,
    ratingCount: 88,
    reliability: 99,
    facilityType: 'Compost Facility',
    capacityTons: 120,
    canCollect: 'Heavy Commercial Fleet',
    location: { lat: 40.7115, lng: -73.9318, addressText: '4.2 miles away' },
  },
  {
    id: 'processor-2',
    name: 'BioEnergy Gas Plant #4',
    role: 'waste_processor',
    email: 'intake@bioenergyny.com',
    phone: '+1 (212) 555-0302',
    address: '1500 Review Ave, Queens, NY',
    contactPerson: 'Vikram Patel',
    verified: true,
    rating: 4.8,
    ratingCount: 62,
    reliability: 96,
    facilityType: 'Biogas Plant',
    capacityTons: 350,
    canCollect: 'Daily Industrial Pickup',
    location: { lat: 40.732, lng: -73.935, addressText: '5.1 miles away' },
  },
  {
    id: 'processor-3',
    name: 'GreenEarth Recyclers & Mulching',
    role: 'waste_processor',
    email: 'info@greenearthrecyclers.com',
    phone: '+1 (212) 555-0303',
    address: '890 E 135th St, Bronx, NY',
    contactPerson: 'Cynthia Vance',
    verified: true,
    rating: 4.7,
    ratingCount: 44,
    reliability: 94,
    facilityType: 'Compost Facility',
    capacityTons: 80,
    canCollect: 'Responsive Trucks',
    location: { lat: 40.803, lng: -73.916, addressText: '7.8 miles away' },
  },
  {
    id: 'processor-4',
    name: 'OrganiCycle Industrial Anaerobics',
    role: 'waste_processor',
    email: 'dispatch@organicycle.com',
    phone: '+1 (212) 555-0304',
    address: '300 N Henry St, Brooklyn, NY',
    contactPerson: 'Hassan Al-Sayed',
    verified: true,
    rating: 4.9,
    ratingCount: 71,
    reliability: 98,
    facilityType: 'Biogas Plant',
    capacityTons: 250,
    canCollect: 'Daily Commercial Fleet',
    location: { lat: 40.729, lng: -73.942, addressText: '4.8 miles away' },
  },
  {
    id: 'processor-5',
    name: 'SoilRenew Urban Composting Hub',
    role: 'waste_processor',
    email: 'urban@soilrenew.org',
    phone: '+1 (212) 555-0305',
    address: '220 Red Hook Ln, Brooklyn, NY',
    contactPerson: 'Fiona Gallagher',
    verified: true,
    rating: 4.8,
    ratingCount: 39,
    reliability: 93,
    facilityType: 'Compost Facility',
    capacityTons: 50,
    canCollect: 'Light Van Fleet',
    location: { lat: 40.678, lng: -73.987, addressText: '3.6 miles away' },
  },
  {
    id: 'processor-6',
    name: 'Metro Biogas & Power Generation',
    role: 'waste_processor',
    email: 'power@metrobiogas.com',
    phone: '+1 (212) 555-0306',
    address: '1000 Richmond Terrace, Staten Island, NY',
    contactPerson: 'Liam Neeson',
    verified: true,
    rating: 4.9,
    ratingCount: 54,
    reliability: 97,
    facilityType: 'Biogas Plant',
    capacityTons: 500,
    canCollect: 'Heavy Tanker Trucks',
    location: { lat: 40.644, lng: -74.113, addressText: '9.2 miles away' },
  },
  {
    id: 'processor-7',
    name: 'BioLoop Composting Works',
    role: 'waste_processor',
    email: 'hello@bioloopcompost.com',
    phone: '+1 (212) 555-0307',
    address: '75 2nd Ave, Gowanus, NY',
    contactPerson: 'Zoe Saldana',
    verified: true,
    rating: 4.7,
    ratingCount: 48,
    reliability: 92,
    facilityType: 'Compost Facility',
    capacityTons: 95,
    canCollect: 'Responsive',
    location: { lat: 40.673, lng: -73.99, addressText: '4.0 miles away' },
  },
  {
    id: 'processor-8',
    name: 'EarthFirst Organics Conversion',
    role: 'waste_processor',
    email: 'conversion@earthfirst.com',
    phone: '+1 (212) 555-0308',
    address: '340 Exterior St, Bronx, NY',
    contactPerson: 'George Clooney',
    verified: true,
    rating: 4.8,
    ratingCount: 61,
    reliability: 96,
    facilityType: 'Compost Facility',
    capacityTons: 180,
    canCollect: 'Daily Industrial Pickup',
    location: { lat: 40.816, lng: -73.931, addressText: '8.4 miles away' },
  },
];

export const ALL_MOCK_USERS: User[] = [
  ...MOCK_DONORS,
  ...MOCK_RECEIVERS,
  ...MOCK_WASTE_PROCESSORS,
];

// ==========================================
// SMART MATCHING ENGINE FORMULA
// ==========================================
/**
 * Smart Matching Engine
 * Formula: Match Score = Distance (40%) * Quantity (25%) * Transport (15%) * Food Type (10%) * Reliability (10%)
 */
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
    (1 + Math.abs(candidate.location.lat - 40.7128) * 45 + Math.abs(candidate.location.lng - (-74.006)) * 45).toFixed(1)
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
    status: 'Matched',
    createdAt: '2026-08-02T16:00:00',
    matches: [
      {
        receiverId: 'receiver-1',
        receiverName: 'Hope Foundation',
        receiverRole: 'receiver',
        matchPercentage: 98,
        distanceMiles: 0.8,
        quantityRequired: 80,
        canCollect: 'Daily Pickup',
        reliability: 100,
        allocatedAmount: 80,
        breakdown: {
          distanceScore: 40,
          quantityMatch: 24,
          transportCompatibility: 15,
          foodTypeMatch: 10,
          reliabilityScore: 10,
          totalScore: 98,
        },
      },
      {
        receiverId: 'receiver-2',
        receiverName: 'Smile Trust',
        receiverRole: 'receiver',
        matchPercentage: 92,
        distanceMiles: 2.4,
        quantityRequired: 120,
        canCollect: 'Responsive',
        reliability: 95,
        allocatedAmount: 120,
        breakdown: {
          distanceScore: 36,
          quantityMatch: 23,
          transportCompatibility: 14,
          foodTypeMatch: 10,
          reliabilityScore: 9,
          totalScore: 92,
        },
      },
      {
        receiverId: 'receiver-3',
        receiverName: "Children's Home",
        receiverRole: 'receiver',
        matchPercentage: 88,
        distanceMiles: 4.1,
        quantityRequired: 100,
        canCollect: 'Weekend Special',
        reliability: 85,
        allocatedAmount: 100,
        breakdown: {
          distanceScore: 33,
          quantityMatch: 23,
          transportCompatibility: 14,
          foodTypeMatch: 10,
          reliabilityScore: 8,
          totalScore: 88,
        },
      },
    ],
    allocations: [
      {
        receiverId: 'receiver-1',
        receiverName: 'Hope Foundation',
        needed: 80,
        allocated: 80,
        remainingBefore: 300,
        remainingAfter: 220,
        matchScore: 98,
      },
      {
        receiverId: 'receiver-2',
        receiverName: 'Smile Trust',
        needed: 120,
        allocated: 120,
        remainingBefore: 220,
        remainingAfter: 100,
        matchScore: 92,
      },
      {
        receiverId: 'receiver-3',
        receiverName: "Children's Home",
        needed: 100,
        allocated: 100,
        remainingBefore: 100,
        remainingAfter: 0,
        matchScore: 88,
      },
    ],
  },
  {
    id: 'post-2',
    donorId: 'donor-2',
    donorName: 'Grand Plaza Hotel & Suites',
    type: 'food',
    title: '150 Gourmet Sandwiches & Fresh Fruit Cups',
    description: 'Assorted artisan sandwiches (turkey, roast beef, vegetarian hummus) and organic fruit cups from corporate breakfast seminar.',
    quantityMeals: 150,
    prepTime: '13:00',
    allergens: ['Dairy', 'Gluten Free Option'],
    safeUntil: '2026-08-02T19:00:00',
    deliveryRadiusMiles: 15,
    locationAddress: '350 5th Ave, Midtown, NY',
    status: 'Accepted',
    createdAt: '2026-08-02T12:00:00',
    matches: [
      {
        receiverId: 'receiver-4',
        receiverName: 'Unity Shelter NYC',
        receiverRole: 'receiver',
        matchPercentage: 96,
        distanceMiles: 1.2,
        quantityRequired: 150,
        canCollect: 'Daily Pickup',
        reliability: 97,
        allocatedAmount: 150,
        breakdown: {
          distanceScore: 38,
          quantityMatch: 25,
          transportCompatibility: 15,
          foodTypeMatch: 10,
          reliabilityScore: 8,
          totalScore: 96,
        },
      },
    ],
    allocations: [
      {
        receiverId: 'receiver-4',
        receiverName: 'Unity Shelter NYC',
        needed: 150,
        allocated: 150,
        remainingBefore: 150,
        remainingAfter: 0,
        matchScore: 96,
      },
    ],
    assignedReceiverId: 'receiver-4',
    assignedReceiverName: 'Unity Shelter NYC',
  },
  {
    id: 'post-3',
    donorId: 'donor-4',
    donorName: 'Daily Bread Artisanal Bakery',
    type: 'food',
    title: '85 Sourdough Loaves & Assorted Pastries',
    description: 'Freshly baked sourdough boules, baguettes, and breakfast pastries from morning production.',
    quantityMeals: 85,
    prepTime: '17:00',
    allergens: ['Nuts Free', 'Vegetarian'],
    safeUntil: '2026-08-03T10:00:00',
    deliveryRadiusMiles: 5,
    locationAddress: '210 Bleeker St, Greenwich Village, NY',
    status: 'Completed',
    createdAt: '2026-08-01T17:30:00',
    matches: [],
    allocations: [],
    assignedReceiverId: 'receiver-1',
    assignedReceiverName: 'Hope Foundation',
    ratingGiven: true,
  },
  {
    id: 'post-4',
    donorId: 'donor-1',
    donorName: 'Green Bistro',
    type: 'organic_waste',
    title: '120 kg Organic Vegetable Trimmings & Kitchen Scraps',
    description: 'Clean organic vegetable peels, coffee grounds, and kitchen prep trimmings suitable for anaerobic digestion or high-grade compost.',
    quantityMeals: 120,
    safeUntil: '2026-08-03T18:00:00',
    deliveryRadiusMiles: 15,
    locationAddress: '142 Green St, Downtown, NY',
    status: 'Posted',
    createdAt: '2026-08-02T15:00:00',
    matches: [
      {
        receiverId: 'processor-1',
        receiverName: 'EcoCompost Facility',
        receiverRole: 'waste_processor',
        matchPercentage: 97,
        distanceMiles: 4.2,
        quantityRequired: 120,
        canCollect: 'Heavy Commercial Fleet',
        reliability: 99,
        breakdown: {
          distanceScore: 36,
          quantityMatch: 25,
          transportCompatibility: 15,
          foodTypeMatch: 10,
          reliabilityScore: 11,
          totalScore: 97,
        },
      },
      {
        receiverId: 'processor-4',
        receiverName: 'OrganiCycle Industrial Anaerobics',
        receiverRole: 'waste_processor',
        matchPercentage: 94,
        distanceMiles: 4.8,
        quantityRequired: 250,
        canCollect: 'Daily Commercial Fleet',
        reliability: 98,
        breakdown: {
          distanceScore: 35,
          quantityMatch: 22,
          transportCompatibility: 15,
          foodTypeMatch: 10,
          reliabilityScore: 12,
          totalScore: 94,
        },
      },
      {
        receiverId: 'processor-5',
        receiverName: 'SoilRenew Urban Composting Hub',
        receiverRole: 'waste_processor',
        matchPercentage: 89,
        distanceMiles: 3.6,
        quantityRequired: 50,
        canCollect: 'Light Van Fleet',
        reliability: 93,
        breakdown: {
          distanceScore: 37,
          quantityMatch: 18,
          transportCompatibility: 13,
          foodTypeMatch: 10,
          reliabilityScore: 11,
          totalScore: 89,
        },
      },
    ],
    allocations: [],
  },
];

// ==========================================
// INITIAL MOCK RECEIVER REQUESTS
// ==========================================
export const INITIAL_RECEIVER_REQUESTS: ReceiverRequest[] = [
  {
    id: 'req-1',
    receiverId: 'receiver-1',
    receiverName: 'Hope Foundation',
    mealsRequired: 80,
    dietaryNotes: ['Vegan-Friendly', 'No Nuts', 'Hot Dinners Preferred'],
    urgency: 'Immediate',
    locationAddress: '45 E 1st St, East Village, NY',
    status: 'Matched',
    createdAt: '2026-08-02T14:30:00',
    matchedDonationId: 'post-1',
  },
  {
    id: 'req-2',
    receiverId: 'receiver-4',
    receiverName: 'Unity Shelter NYC',
    mealsRequired: 150,
    dietaryNotes: ['All Types Welcome', 'Halal Options Approved'],
    urgency: 'High',
    locationAddress: '110 Lafayette St, Chinatown, NY',
    status: 'Matched',
    createdAt: '2026-08-02T11:00:00',
    matchedDonationId: 'post-2',
  },
  {
    id: 'req-3',
    receiverId: 'receiver-5',
    receiverName: 'Community Kitchen NYC',
    mealsRequired: 200,
    dietaryNotes: ['Vegetarian', 'Low Sodium'],
    urgency: 'Normal',
    locationAddress: '252 W 116th St, Harlem, NY',
    status: 'Active',
    createdAt: '2026-08-02T15:15:00',
  },
  {
    id: 'req-4',
    receiverId: 'receiver-9',
    receiverName: 'Bowery Mission Outreach',
    mealsRequired: 180,
    dietaryNotes: ['All Types'],
    urgency: 'High',
    locationAddress: '227 Bowery, Lower Manhattan, NY',
    status: 'Active',
    createdAt: '2026-08-02T16:20:00',
  },
];

// ==========================================
// MAP MARKERS HELPER
// ==========================================
export function getMapMarkersData(posts: DonationPost[]): MapMarkerData[] {
  const markers: MapMarkerData[] = [];

  // Add all Donors (Green)
  MOCK_DONORS.forEach((d) => {
    // Find active post quantity if any
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

  // Add all Receivers (Blue)
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

  // Add all Waste Processors (Brown)
  MOCK_WASTE_PROCESSORS.forEach((w) => {
    markers.push({
      id: w.id,
      name: w.name,
      role: 'waste_processor',
      lat: w.location.lat,
      lng: w.location.lng,
      distanceMiles: 4.5,
      availableQuantity: `Capacity: ${w.capacityTons} Tons`,
      matchScore: 97,
      addressText: w.address,
      verified: w.verified,
      reliability: w.reliability,
    });
  });

  return markers;
}
