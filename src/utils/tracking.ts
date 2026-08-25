// --- Pickup / delivery tracking helpers --------------------------------------
// Pure helpers that project the EXISTING donation lifecycle (DonationStatus)
// onto a linear logistics timeline. The donation status remains the single
// source of truth; an optional `post.tracking` overlay only lets the demo user
// advance the timeline a step ahead of / off the main donation flow (e.g. mark
// "picked up" before the receiver marks "collected"). No real GPS is involved.

import type { DonationPost, DonationStatus, TrackingStatus } from '../types';

// The happy-path timeline, in order. Off-track states (cancelled / expired /
// waste_management) intentionally live outside this array.
export const TRACKING_ORDER: TrackingStatus[] = [
  'donation_created',
  'receiver_matched',
  'pickup_scheduled',
  'picked_up',
  'delivered',
];

export const TRACKING_LABELS: Record<TrackingStatus, string> = {
  donation_created: 'Donation created',
  receiver_matched: 'Receiver matched',
  pickup_scheduled: 'Pickup scheduled',
  picked_up: 'Picked up',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  expired: 'Expired',
  waste_management: 'Routed to waste management',
};

// Short helper copy shown under each timeline step.
export const TRACKING_DESCRIPTIONS: Record<TrackingStatus, string> = {
  donation_created: 'Donor posted the surplus food.',
  receiver_matched: 'A receiver was matched to this donation.',
  pickup_scheduled: 'Pickup has been arranged with the receiver.',
  picked_up: 'Food has been collected from the donor.',
  delivered: 'Food delivered to the receiver.',
  cancelled: 'This donation was cancelled.',
  expired: 'The safe-to-eat window elapsed before delivery.',
  waste_management: 'Remaining quantity routed to a waste processor.',
};

// Map a donation status to its equivalent point on the tracking timeline.
export function trackingFromDonationStatus(status: DonationStatus): TrackingStatus {
  switch (status) {
    case 'Posted':
      return 'donation_created';
    case 'Matched':
      return 'receiver_matched';
    case 'Accepted':
      return 'pickup_scheduled';
    case 'Collected':
      return 'picked_up';
    case 'Completed':
      return 'delivered';
    case 'Expired':
      return 'expired';
    default:
      return 'donation_created';
  }
}

// Index of a status within the main timeline, or -1 for off-track states.
export function trackingIndex(status: TrackingStatus): number {
  return TRACKING_ORDER.indexOf(status);
}

// The status actually shown in the UI: the further-along of the donation-derived
// status and any manual overlay, with hard/off-track states taking precedence.
export function effectiveTrackingStatus(post: DonationPost): TrackingStatus {
  const derived = trackingFromDonationStatus(post.status);

  // An expired donation is a hard state regardless of any overlay.
  if (derived === 'expired') return 'expired';

  const explicit = post.tracking?.status;
  if (!explicit) return derived;

  // Manually-set off-track states win.
  if (explicit === 'cancelled' || explicit === 'expired' || explicit === 'waste_management') {
    return explicit;
  }

  // Both on the main track — honour whichever is further along.
  return trackingIndex(explicit) >= trackingIndex(derived) ? explicit : derived;
}

// The next timeline step the demo user can advance to, or null when the current
// status is terminal (delivered) or off-track (no linear successor).
export function nextTrackingStatus(status: TrackingStatus): TrackingStatus | null {
  const idx = trackingIndex(status);
  if (idx === -1) return null; // off-track — no linear "next"
  if (idx >= TRACKING_ORDER.length - 1) return null; // already delivered
  return TRACKING_ORDER[idx + 1];
}

// Whether `status` is at or past `target` on the main timeline (for step
// completed/current/upcoming styling). Off-track states are never "past".
export function isTrackingReached(status: TrackingStatus, target: TrackingStatus): boolean {
  const s = trackingIndex(status);
  const t = trackingIndex(target);
  if (s === -1 || t === -1) return false;
  return s >= t;
}
