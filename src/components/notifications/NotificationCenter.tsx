import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AppNotification, NotificationType } from '../../types';

// --- In-app notification center ----------------------------------------------
// A self-contained bell + unread badge + dropdown panel. It is purely a view
// over the notification state that already lives in AppContext (no DB, no timers
// of its own). Clicking a notification marks it read and, if it carries an
// `actionView`, navigates there via the existing `setActiveView` router.

// Per-type presentation: material icon + a subtle tinted chip. Colours reuse the
// existing Tailwind palette so the panel matches the rest of the app.
const TYPE_PRESENTATION: Record<
  NotificationType,
  { icon: string; chip: string }
> = {
  match: { icon: 'handshake', chip: 'bg-secondary-container text-on-secondary-container' },
  expiry_warning: { icon: 'timer', chip: 'bg-amber-100 text-amber-900' },
  allocation: { icon: 'inventory_2', chip: 'bg-emerald-100 text-emerald-800' },
  pickup: { icon: 'local_shipping', chip: 'bg-blue-100 text-blue-800' },
  delivery: { icon: 'check_circle', chip: 'bg-emerald-100 text-emerald-800' },
  waste_management: { icon: 'recycling', chip: 'bg-orange-100 text-orange-900' },
  system: { icon: 'info', chip: 'bg-surface-container-high text-on-surface-variant' },
};

// Compact "time ago" label derived from an ISO timestamp. Recomputed on render;
// good enough for a notification list (no live ticking needed).
function timeAgo(iso: string, now: number): string {
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return '';
  const secs = Math.max(0, Math.round((now - then) / 1000));
  if (secs < 60) return 'just now';
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

export const NotificationCenter: React.FC = () => {
  const {
    notifications,
    unreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
    setActiveView,
  } = useApp();

  const [open, setOpen] = useState(false);
  // Snapshot "now" whenever the panel opens so the relative timestamps are fresh.
  const [now, setNow] = useState<number>(() => Date.now());
  const containerRef = useRef<HTMLDivElement>(null);

  // Close the dropdown on any outside click / Escape.
  useEffect(() => {
    if (!open) return;
    setNow(Date.now());
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleNotificationClick = (n: AppNotification) => {
    markNotificationRead(n.id);
    if (n.actionView) {
      setActiveView(n.actionView);
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-full text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
        title="Notifications"
        aria-label={`Notifications${unreadNotificationCount > 0 ? ` (${unreadNotificationCount} unread)` : ''}`}
      >
        <span className="material-symbols-outlined">notifications</span>
        {unreadNotificationCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center leading-none shadow-sm">
            {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-stripe border border-outline-variant z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant bg-surface-bright">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">notifications</span>
              <span className="font-label-md text-sm font-bold text-primary">Notifications</span>
              {unreadNotificationCount > 0 && (
                <span className="text-[10px] bg-error text-white px-1.5 py-0.5 rounded-full font-bold">
                  {unreadNotificationCount} new
                </span>
              )}
            </div>
            {unreadNotificationCount > 0 && (
              <button
                onClick={markAllNotificationsRead}
                className="text-[11px] font-bold text-secondary hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-3xl opacity-40">notifications_off</span>
                <p className="text-xs mt-2">You&apos;re all caught up.</p>
              </div>
            ) : (
              notifications.map((n) => {
                const pres = TYPE_PRESENTATION[n.type] ?? TYPE_PRESENTATION.system;
                const clickable = Boolean(n.actionView);
                return (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full text-left px-4 py-3 border-b border-outline-variant/60 last:border-b-0 flex gap-3 transition-colors ${
                      n.read ? 'bg-white hover:bg-surface-container-low' : 'bg-secondary-container/20 hover:bg-secondary-container/30'
                    } ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <span
                      className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${pres.chip}`}
                    >
                      <span className="material-symbols-outlined text-base">{pres.icon}</span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm leading-tight ${n.read ? 'font-medium text-on-surface' : 'font-bold text-primary'}`}>
                          {n.title}
                        </p>
                        {!n.read && (
                          <span className="shrink-0 mt-1 w-2 h-2 rounded-full bg-secondary" aria-hidden="true"></span>
                        )}
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5 leading-snug">{n.message}</p>
                      <p className="text-[10px] text-on-surface-variant/70 mt-1">{timeAgo(n.createdAt, now)}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-outline-variant bg-surface-bright text-right">
              <button
                onClick={clearNotifications}
                className="text-[11px] font-bold text-on-surface-variant hover:text-error transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
