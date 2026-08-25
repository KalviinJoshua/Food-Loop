import React, { useEffect, useState } from 'react';
import { getSafetyState } from '../../utils/foodSafety';

interface SafetyCountdownProps {
  safeUntil: string;
  // compact renders a single inline row; default renders the full boxed panel.
  compact?: boolean;
  className?: string;
}

/**
 * Live food-safety countdown. Ticks once per second off the wall clock and
 * derives everything from the `safeUntil` timestamp, so it stays correct across
 * refreshes and never drifts. Cleans up its interval on unmount.
 */
const SafetyCountdown: React.FC<SafetyCountdownProps> = ({ safeUntil, compact = false, className = '' }) => {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(intervalId);
  }, []);

  const info = getSafetyState(safeUntil, now);
  const expired = info.state === 'expired';

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1.5 ${className}`}>
        <span className={`w-2 h-2 rounded-full ${info.dotClasses}`}></span>
        <span className="font-mono font-bold tabular-nums">
          {expired ? 'Expired' : info.formatted}
        </span>
        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${info.badgeClasses}`}>
          {info.label}
        </span>
      </span>
    );
  }

  return (
    <div
      className={`p-3 rounded-xl border text-xs font-medium ${
        expired ? 'border-gray-300 bg-gray-50' : 'border-outline-variant bg-surface-container-low'
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-base" aria-hidden="true">
            {expired ? 'timer_off' : 'timer'}
          </span>
          <span className="text-on-surface-variant">
            {expired ? 'Food safety window:' : 'Food valid for:'}
          </span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${info.badgeClasses}`}>
          {info.label}
        </span>
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${info.dotClasses}`}></span>
        <span className={`font-mono text-xl font-bold tabular-nums ${expired ? 'text-gray-500' : 'text-primary'}`}>
          {expired ? '00:00:00' : info.formatted}
        </span>
      </div>
      {expired && (
        <p className="mt-1 text-[11px] text-gray-500">Recovery window closed — see waste-management routing below.</p>
      )}
    </div>
  );
};

export default SafetyCountdown;
