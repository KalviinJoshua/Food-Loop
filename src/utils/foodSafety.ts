import { DonationPost } from '../types';

// --- Food Safety Countdown ---------------------------------------------------
// Single source of truth for the safety window state used by the live countdown
// component, the auto-expiry sweep in AppContext, and the dashboard cards.
// Everything is derived from the donation's `safeUntil` timestamp so the state
// is stable across refreshes (no resettable timers).

export type SafetyState = 'available' | 'urgent' | 'critical' | 'expired';

export interface SafetyInfo {
  remainingMs: number;
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string; // "HH:MM:SS" (clamped at 00:00:00 once expired)
  state: SafetyState;
  label: string; // "Available" | "Urgent" | "Critical" | "Expired"
  badgeClasses: string; // Tailwind classes for the state badge
  dotClasses: string; // Tailwind classes for a small status dot
}

// Thresholds (spec): >60m Available, 15-60m Urgent, <15m Critical, <=0 Expired.
export const URGENT_THRESHOLD_MS = 60 * 60 * 1000; // 60 minutes
export const CRITICAL_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes

const pad = (n: number) => Math.max(0, n).toString().padStart(2, '0');

export function getSafetyState(safeUntil: string, now: number = Date.now()): SafetyInfo {
  const target = new Date(safeUntil).getTime();
  const remainingMs = Number.isFinite(target) ? target - now : 0;
  const clamped = Math.max(0, remainingMs);

  const totalSeconds = Math.floor(clamped / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const formatted = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  let state: SafetyState;
  let label: string;
  let badgeClasses: string;
  let dotClasses: string;

  if (remainingMs <= 0) {
    state = 'expired';
    label = 'Expired';
    badgeClasses = 'bg-gray-200 text-gray-700';
    dotClasses = 'bg-gray-400';
  } else if (remainingMs < CRITICAL_THRESHOLD_MS) {
    state = 'critical';
    label = 'Critical';
    badgeClasses = 'bg-red-100 text-red-800';
    dotClasses = 'bg-red-500';
  } else if (remainingMs <= URGENT_THRESHOLD_MS) {
    state = 'urgent';
    label = 'Urgent';
    badgeClasses = 'bg-amber-100 text-amber-800';
    dotClasses = 'bg-amber-500';
  } else {
    state = 'available';
    label = 'Available';
    badgeClasses = 'bg-emerald-100 text-emerald-800';
    dotClasses = 'bg-emerald-500';
  }

  return { remainingMs, hours, minutes, seconds, formatted, state, label, badgeClasses, dotClasses };
}

// True once the safety window has elapsed. Used to gate visibility/allocation.
export function isExpired(safeUntil: string, now: number = Date.now()): boolean {
  const target = new Date(safeUntil).getTime();
  return Number.isFinite(target) ? now >= target : false;
}

// --- Allocation summary ------------------------------------------------------
// Derived from `quantityMeals` + `allocations` so we never duplicate quantity
// state on the donation model.

export interface AllocationSummary {
  total: number; // quantityMeals (food available)
  allocated: number; // sum of allocation steps (recovered / rescued)
  remaining: number; // total - allocated (routed to waste after expiry)
}

export function getAllocationSummary(post: DonationPost): AllocationSummary {
  const total = post.quantityMeals || 0;
  const allocatedRaw = (post.allocations || []).reduce((sum, step) => sum + (step.allocated || 0), 0);
  const allocated = Math.min(Math.max(0, allocatedRaw), total);
  return { total, allocated, remaining: Math.max(0, total - allocated) };
}
