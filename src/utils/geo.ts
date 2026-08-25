// --- Geo helpers -------------------------------------------------------------
// Thin, dependency-free helpers used by the map + tracking features. Distance
// math reuses the existing Haversine implementation in matchingEngine (which
// returns MILES) so we never fork the distance logic. Travel time is a coarse
// ESTIMATE (there is no real routing engine / API key) and is always labeled as
// such in the UI.

import { calculateHaversineDistance } from '../data/matchingEngine';

const MILES_TO_KM = 1.60934;

// Assumed average urban door-to-door speed (km/h) incl. stops/loading. Used only
// to derive a human-readable "estimated travel" figure for the map/tracking UI.
const AVG_URBAN_KMH = 24;

export function milesToKm(miles: number): number {
  return miles * MILES_TO_KM;
}

// Straight-line distance in kilometres between two lat/lng points.
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return milesToKm(calculateHaversineDistance(lat1, lng1, lat2, lng2));
}

// Rounded km for display (1 decimal place).
export function formatKm(km: number): string {
  return `${km.toFixed(1)} km`;
}

// Estimated travel time in whole minutes for a given distance in km. Estimate
// only — no live traffic / routing.
export function estimateTravelMinutes(km: number): number {
  if (!Number.isFinite(km) || km <= 0) return 1;
  return Math.max(1, Math.round((km / AVG_URBAN_KMH) * 60));
}

// "12 min" style label for the estimated travel time of a km distance.
export function formatTravelEstimate(km: number): string {
  return `~${estimateTravelMinutes(km)} min`;
}
