import React from 'react';
import { DonationPost, TrackingStatus } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  TRACKING_ORDER,
  TRACKING_LABELS,
  TRACKING_DESCRIPTIONS,
  effectiveTrackingStatus,
  trackingIndex,
  nextTrackingStatus,
} from '../../utils/tracking';

// --- Pickup / delivery tracking timeline -------------------------------------
// A read-through view of a donation's logistics progress. The donation status
// remains the source of truth (see utils/tracking.ts); this component only
// renders the derived timeline and — when `showActions` is set — offers the demo
// user a single "advance to next step" button that calls `advanceTracking`.
// No real GPS: pickup/delivery locations and ETAs are label-only estimates.

interface DonationTrackingTimelineProps {
  post: DonationPost;
  // Show the "advance status" control (donor-side demo affordance).
  showActions?: boolean;
  className?: string;
}

// Icon per timeline step (main track).
const STEP_ICON: Record<TrackingStatus, string> = {
  donation_created: 'add_box',
  receiver_matched: 'handshake',
  pickup_scheduled: 'event',
  picked_up: 'local_shipping',
  delivered: 'check_circle',
  cancelled: 'cancel',
  expired: 'timer_off',
  waste_management: 'recycling',
};

// Off-track terminal states get a distinct banner treatment.
const OFF_TRACK: TrackingStatus[] = ['cancelled', 'expired', 'waste_management'];

function formatTime(iso?: string): string {
  if (!iso) return '';
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '';
  return new Date(t).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const DonationTrackingTimeline: React.FC<DonationTrackingTimelineProps> = ({
  post,
  showActions = false,
  className = '',
}) => {
  const { advanceTracking } = useApp();

  const current = effectiveTrackingStatus(post);
  const offTrack = OFF_TRACK.includes(current);

  // Map each status to the most recent timestamp we know about (from the
  // manual-overlay history). donation_created falls back to the post's createdAt.
  const timestampByStatus: Partial<Record<TrackingStatus, string>> = {};
  (post.tracking?.history ?? []).forEach((e) => {
    timestampByStatus[e.status] = e.timestamp;
  });
  if (!timestampByStatus.donation_created) {
    timestampByStatus.donation_created = post.createdAt;
  }

  // High-water mark on the main track. When off-track, derive it from the
  // furthest on-track history event, defaulting to donation_created (index 0)
  // since every post was at least created.
  let reachedIndex: number;
  if (offTrack) {
    reachedIndex = 0;
    (post.tracking?.history ?? []).forEach((e) => {
      const i = trackingIndex(e.status);
      if (i > reachedIndex) reachedIndex = i;
    });
  } else {
    reachedIndex = trackingIndex(current);
  }

  const next = nextTrackingStatus(current);

  return (
    <div className={`rounded-xl border border-outline-variant bg-surface-container-low p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">route</span>
          <span className="font-label-md text-sm font-bold text-primary">Pickup &amp; Delivery Tracking</span>
        </div>
        <span className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">
          Status view
        </span>
      </div>

      {/* Vertical timeline of the main track */}
      <ol className="relative">
        {TRACKING_ORDER.map((step, i) => {
          const isCurrent = !offTrack && i === reachedIndex;
          const done = i < reachedIndex;
          const isLast = i === TRACKING_ORDER.length - 1 && !offTrack;
          const ts = timestampByStatus[step];

          // Node colour: done → primary filled, current → secondary ring, upcoming → muted.
          const nodeClasses = done
            ? 'bg-primary text-white border-primary'
            : isCurrent
            ? 'bg-secondary-container text-on-secondary-container border-secondary'
            : 'bg-surface-container-high text-on-surface-variant/50 border-outline-variant';

          return (
            <li key={step} className="flex gap-3 pb-4 last:pb-0 relative">
              {/* Connector line */}
              {!isLast && (
                <span
                  className={`absolute left-[15px] top-8 bottom-0 w-0.5 ${
                    done ? 'bg-primary' : 'bg-outline-variant'
                  }`}
                  aria-hidden="true"
                ></span>
              )}
              <span
                className={`shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 ${nodeClasses}`}
              >
                <span className="material-symbols-outlined text-base">{STEP_ICON[step]}</span>
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-center gap-2">
                  <p
                    className={`text-sm leading-tight ${
                      done || isCurrent ? 'font-bold text-primary' : 'font-medium text-on-surface-variant/70'
                    }`}
                  >
                    {TRACKING_LABELS[step]}
                  </p>
                  {isCurrent && (
                    <span className="text-[10px] bg-secondary text-white px-1.5 py-0.5 rounded-full font-bold uppercase">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-xs text-on-surface-variant leading-snug mt-0.5">
                  {TRACKING_DESCRIPTIONS[step]}
                </p>
                {ts && (done || isCurrent) && (
                  <p className="text-[10px] text-on-surface-variant/70 mt-0.5">{formatTime(ts)}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {/* Off-track terminal banner (expired / cancelled / routed to waste). */}
      {offTrack && (
        <div
          className={`mt-1 flex items-start gap-2 rounded-lg px-3 py-2 text-xs ${
            current === 'waste_management' || current === 'expired'
              ? 'bg-orange-50 border border-orange-200 text-orange-900'
              : 'bg-gray-50 border border-gray-200 text-gray-700'
          }`}
        >
          <span className="material-symbols-outlined text-base shrink-0">{STEP_ICON[current]}</span>
          <div>
            <p className="font-bold">{TRACKING_LABELS[current]}</p>
            <p className="mt-0.5 leading-snug">{TRACKING_DESCRIPTIONS[current]}</p>
            {timestampByStatus[current] && (
              <p className="text-[10px] opacity-70 mt-0.5">{formatTime(timestampByStatus[current])}</p>
            )}
          </div>
        </div>
      )}

      {/* Pickup / delivery locations + ETAs (estimates only). */}
      {(post.tracking?.pickupLocation ||
        post.tracking?.deliveryLocation ||
        post.tracking?.estimatedPickupTime ||
        post.tracking?.estimatedDeliveryTime) && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {(post.tracking?.pickupLocation || post.tracking?.estimatedPickupTime) && (
            <div className="rounded-lg bg-white border border-outline-variant p-2.5">
              <div className="flex items-center gap-1.5 text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">trip_origin</span>
                <span className="font-bold uppercase text-[10px] tracking-wider">Pickup</span>
              </div>
              {post.tracking?.pickupLocation && (
                <p className="text-on-surface mt-1 leading-snug">{post.tracking.pickupLocation}</p>
              )}
              {post.tracking?.estimatedPickupTime && (
                <p className="text-on-surface-variant/70 text-[10px] mt-0.5">
                  Est. {formatTime(post.tracking.estimatedPickupTime)}
                </p>
              )}
            </div>
          )}
          {(post.tracking?.deliveryLocation || post.tracking?.estimatedDeliveryTime) && (
            <div className="rounded-lg bg-white border border-outline-variant p-2.5">
              <div className="flex items-center gap-1.5 text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">location_on</span>
                <span className="font-bold uppercase text-[10px] tracking-wider">Delivery</span>
              </div>
              {post.tracking?.deliveryLocation && (
                <p className="text-on-surface mt-1 leading-snug">{post.tracking.deliveryLocation}</p>
              )}
              {post.tracking?.estimatedDeliveryTime && (
                <p className="text-on-surface-variant/70 text-[10px] mt-0.5">
                  Est. {formatTime(post.tracking.estimatedDeliveryTime)}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Demo affordance: advance to the next logistics step. Only shown when a
          valid on-track successor exists (never for terminal/off-track states). */}
      {showActions && next && (
        <button
          onClick={() => advanceTracking(post.id, next)}
          className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary text-on-primary text-sm font-label-md font-bold hover:opacity-90 active:scale-95 transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-base">arrow_forward</span>
          Mark as: {TRACKING_LABELS[next]}
        </button>
      )}
    </div>
  );
};

export default DonationTrackingTimeline;
