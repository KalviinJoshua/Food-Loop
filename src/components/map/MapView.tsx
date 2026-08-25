import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getMapMarkersData } from '../../data/mockData';
import { getDynamicTop3Matches } from '../../data/matchingEngine';
import { MapMarkerData, MatchResult, UserRole } from '../../types';
import { milesToKm, formatKm, formatTravelEstimate } from '../../utils/geo';

// --- Interactive network map -------------------------------------------------
// Zero-dependency, zero-API-key coordinate map. Marker positions are a real
// equirectangular projection of each node's lat/lng (north-up) over the bounds
// of all nodes — not an index scatter. Straight-line distances reuse the
// existing Haversine engine (via getMapMarkersData / geo helpers) and travel
// times are clearly-labeled ESTIMATES (no routing service). Match breakdowns
// are computed with the EXISTING matching engine (getDynamicTop3Matches), never
// a second algorithm.

// Percentage padding inside the canvas so pins never touch the edges.
const PAD = 10;

export const MapView: React.FC = () => {
  const { posts, users, requests, currentUser, setActiveView, setCurrentUser, loginUserByRole } = useApp();
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [selectedMarker, setSelectedMarker] = useState<MapMarkerData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRoute, setShowRoute] = useState(true);

  // The hub the map is anchored on (route origin + distance reference). Prefer
  // the logged-in donor; otherwise the demo anchor (Chennai Central Restaurant,
  // donor-1); otherwise any donor.
  const focusDonor = useMemo(() => {
    if (currentUser?.role === 'donor') return currentUser;
    return (
      users.find((u) => u.id === 'donor-1' && u.role === 'donor') ||
      users.find((u) => u.role === 'donor') ||
      null
    );
  }, [currentUser, users]);

  const originLat = focusDonor?.location?.lat;
  const originLng = focusDonor?.location?.lng;

  // Distances on markers are computed relative to this same origin.
  const allMarkers = useMemo(
    () =>
      getMapMarkersData(
        posts,
        originLat != null && originLng != null ? { lat: originLat, lng: originLng } : undefined
      ),
    [posts, originLat, originLng]
  );

  // The hub donor's active FOOD post drives the on-map match breakdown.
  const focusPost = useMemo(() => {
    if (!focusDonor) return null;
    return (
      posts.find(
        (p) =>
          p.donorId === focusDonor.id &&
          p.type === 'food' &&
          p.status !== 'Completed' &&
          p.status !== 'Expired'
      ) || null
    );
  }, [focusDonor, posts]);

  // Receiver-id -> MatchResult, from the EXISTING engine (fallback to any
  // persisted matches on the post). Never a re-implemented scorer.
  const matchByReceiver = useMemo(() => {
    const map = new Map<string, MatchResult>();
    if (focusPost) {
      let results: MatchResult[] = [];
      try {
        results = getDynamicTop3Matches(focusPost, users, requests, posts);
      } catch {
        results = focusPost.matches || [];
      }
      if (!results || results.length === 0) results = focusPost.matches || [];
      results.forEach((m) => map.set(m.receiverId, m));
    }
    return map;
  }, [focusPost, users, requests, posts]);

  const topReceiverId = useMemo(() => {
    let best: MatchResult | null = null;
    matchByReceiver.forEach((m) => {
      if (!best || m.matchPercentage > best.matchPercentage) best = m;
    });
    return best ? (best as MatchResult).receiverId : null;
  }, [matchByReceiver]);

  const filteredMarkers = allMarkers.filter((m) => {
    const matchesRole = roleFilter === 'all' || m.role === roleFilter;
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.addressText.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  // Projection bounds over every node (+ the origin) so the layout is stable
  // regardless of the active filter.
  const bounds = useMemo(() => {
    const pts = allMarkers.map((m) => ({ lat: m.lat, lng: m.lng }));
    if (originLat != null && originLng != null) pts.push({ lat: originLat, lng: originLng });
    if (pts.length === 0) return { minLat: 0, maxLat: 1, minLng: 0, maxLng: 1 };
    const lats = pts.map((p) => p.lat);
    const lngs = pts.map((p) => p.lng);
    return {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
    };
  }, [allMarkers, originLat, originLng]);

  // Equirectangular projection to canvas percentages. `|| 1` guards a zero span.
  const projX = (lng: number): number => {
    const range = bounds.maxLng - bounds.minLng || 1;
    return PAD + ((lng - bounds.minLng) / range) * (100 - 2 * PAD);
  };
  const projY = (lat: number): number => {
    const range = bounds.maxLat - bounds.minLat || 1;
    return PAD + ((bounds.maxLat - lat) / range) * (100 - 2 * PAD); // invert so north is up
  };

  const selMatch = selectedMarker ? matchByReceiver.get(selectedMarker.id) : undefined;
  const selKm = selectedMarker ? milesToKm(selectedMarker.distanceMiles) : 0;

  // Enter the exact selected node's portal (better than role-only switching).
  const openPortal = (m: MapMarkerData) => {
    const u = users.find((x) => x.id === m.id);
    if (u) {
      setCurrentUser(u);
      setActiveView('dashboard');
    } else {
      loginUserByRole(m.role);
    }
  };

  const roleDotClass = (role: UserRole): string =>
    role === 'donor' ? 'bg-emerald-500' : role === 'receiver' ? 'bg-blue-500' : 'bg-amber-600';

  return (
    <div className="pt-24 pb-16 px-container-padding max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold uppercase tracking-wider mb-2">
            Network Map — Chennai
          </span>
          <h1 className="font-display-lg text-headline-lg text-primary font-bold">
            Interactive Zero-Waste Ecosystem Map
          </h1>
          <p className="font-body-md text-sm text-on-surface-variant">
            Donors, receivers, and waste processors on a coordinate map. Distances are straight-line
            (Haversine); travel times are estimates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveView('dashboard')}
            className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:opacity-90 shadow-md flex items-center gap-2 transition-all"
          >
            <span className="material-symbols-outlined text-sm">dashboard</span>
            <span>Open Dashboard</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-outline-variant shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
        {/* Role Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              roleFilter === 'all'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface-bright border border-outline-variant text-on-surface-variant hover:text-primary'
            }`}
          >
            All Nodes ({allMarkers.length})
          </button>
          <button
            onClick={() => setRoleFilter('donor')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              roleFilter === 'donor'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            Donors (Green)
          </button>
          <button
            onClick={() => setRoleFilter('receiver')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              roleFilter === 'receiver'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            Receivers (Blue)
          </button>
          <button
            onClick={() => setRoleFilter('waste_processor')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              roleFilter === 'waste_processor'
                ? 'bg-amber-800 text-white shadow-sm'
                : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
            Waste Processors (Brown)
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-lg">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search organization or area..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-outline-variant text-xs bg-surface-bright focus:border-secondary focus:ring-secondary"
          />
        </div>
      </div>

      {/* Main Map Container & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coordinate Map Display */}
        <div className="lg:col-span-2 bg-slate-900 rounded-3xl border border-outline-variant overflow-hidden min-h-[500px] relative shadow-xl flex flex-col justify-between p-6">
          {/* Top Map Toolbar Overlay */}
          <div className="flex justify-between items-center z-20">
            <div className="bg-slate-800/90 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-700 text-white text-xs flex items-center gap-2 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-bold">Chennai Metropolitan Area</span>
            </div>

            <div className="bg-slate-800/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-slate-300 text-[11px] font-bold">
              {filteredMarkers.length} Nodes Displayed
            </div>
          </div>

          {/* Coordinate Node Canvas */}
          <div className="relative my-8 h-96 w-full rounded-2xl bg-[#0f172a] border border-slate-800 overflow-hidden p-4">
            {/* Grid lines styling */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(#38bdf8 1px, transparent 1px)`,
                backgroundSize: '24px 24px',
              }}
            ></div>

            {/* Real route line: hub (donor) -> selected node */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
              {selectedMarker && showRoute && originLat != null && originLng != null && (
                <>
                  <line
                    x1={`${projX(originLng)}%`}
                    y1={`${projY(originLat)}%`}
                    x2={`${projX(selectedMarker.lng)}%`}
                    y2={`${projY(selectedMarker.lat)}%`}
                    className="stroke-emerald-400"
                    strokeWidth={2.5}
                    strokeDasharray="6 4"
                  />
                </>
              )}
            </svg>

            {/* Node Pins (projected from lat/lng) */}
            <div className="absolute inset-0">
              {filteredMarkers.map((marker) => {
                const topPct = projY(marker.lat);
                const leftPct = projX(marker.lng);
                const isSelected = selectedMarker?.id === marker.id;
                const isHub = focusDonor?.id === marker.id;

                const roleColor =
                  marker.role === 'donor'
                    ? 'bg-emerald-500 text-white'
                    : marker.role === 'receiver'
                    ? 'bg-blue-500 text-white'
                    : 'bg-amber-600 text-white';

                return (
                  <button
                    key={marker.id}
                    onClick={() => {
                      setSelectedMarker(marker);
                      setShowRoute(true);
                    }}
                    style={{ top: `${topPct}%`, left: `${leftPct}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all group z-10 hover:scale-125 focus:outline-none ${
                      isSelected ? 'scale-125 z-30 ring-4 ring-white rounded-full' : ''
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg border-2 ${
                        isHub ? 'border-yellow-300' : 'border-white'
                      } ${roleColor}`}
                    >
                      <span className="material-symbols-outlined text-sm">
                        {marker.role === 'donor'
                          ? 'restaurant'
                          : marker.role === 'receiver'
                          ? 'volunteer_activism'
                          : 'recycling'}
                      </span>
                    </div>

                    {isHub && (
                      <span className="absolute -top-1 left-full ml-1 text-[9px] font-bold text-yellow-300 whitespace-nowrap">
                        HUB
                      </span>
                    )}

                    {/* Tooltip on Hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-40 whitespace-nowrap">
                      <div className="bg-slate-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-xl border border-slate-700">
                        {marker.name}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {marker.availableQuantity} • {formatKm(milesToKm(marker.distanceMiles))}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Map Legend */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-800/90 backdrop-blur-md p-4 rounded-xl border border-slate-700 z-20 text-xs text-slate-300">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                Food Donors
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                NGO Receivers
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-600"></span>
                Waste Processors
              </span>
            </div>
            <span className="text-[11px] text-slate-400">Click any marker for match details &amp; route</span>
          </div>
        </div>

        {/* Node Detail & List Panel */}
        <div className="space-y-6">
          {/* Selected Node Details Card */}
          {selectedMarker ? (
            <div className="bg-white p-6 rounded-3xl border border-outline-variant shadow-md animate-in fade-in duration-200">
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    selectedMarker.role === 'donor'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedMarker.role === 'receiver'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {selectedMarker.role.replace('_', ' ')}
                </span>
                {selMatch && selectedMarker.id === topReceiverId && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold uppercase">
                    <span className="material-symbols-outlined text-xs">star</span>
                    Best Match
                  </span>
                )}
              </div>

              <h3 className="font-headline-md text-headline-md text-primary font-bold mb-1">
                {selectedMarker.name}
              </h3>
              <p className="text-xs text-on-surface-variant mb-4">{selectedMarker.addressText}</p>

              {/* Distance + estimated travel (always available, geo-derived) */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="p-3 rounded-xl bg-surface-bright border border-outline-variant">
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Distance</span>
                  <span className="text-primary font-bold text-sm">{formatKm(selKm)}</span>
                </div>
                <div className="p-3 rounded-xl bg-surface-bright border border-outline-variant">
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Est. travel</span>
                  <span className="text-primary font-bold text-sm">{formatTravelEstimate(selKm)}</span>
                  <span className="text-[9px] text-on-surface-variant block leading-none">estimate</span>
                </div>
              </div>

              {/* Match score breakdown — only for receivers scored against the
                  hub donor's active post, straight from the matching engine. */}
              {selMatch ? (
                <div className="p-4 rounded-xl bg-secondary-container/20 border border-secondary/20 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-primary flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">insights</span>
                      Match score vs {focusDonor?.name}
                    </span>
                    <span className="font-bold text-sm text-emerald-700">{selMatch.matchPercentage}%</span>
                  </div>

                  {[
                    { label: 'Distance', value: selMatch.breakdown.distanceScore, max: 40 },
                    { label: 'Quantity', value: selMatch.breakdown.quantityMatch, max: 25 },
                    { label: 'Transport', value: selMatch.breakdown.transportCompatibility, max: 15 },
                    { label: 'Food suitability', value: selMatch.breakdown.foodTypeMatch, max: 10 },
                    { label: 'Reliability', value: selMatch.breakdown.reliabilityScore, max: 10 },
                  ].map((f) => (
                    <div key={f.label} className="mb-1.5 last:mb-0">
                      <div className="flex justify-between text-[10px] text-on-surface-variant">
                        <span>{f.label}</span>
                        <span className="font-bold text-primary">
                          {Math.round(f.value)}/{f.max}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                        <div
                          className="h-full rounded-full bg-secondary"
                          style={{ width: `${Math.max(0, Math.min(100, (f.value / f.max) * 100))}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}

                  {selMatch.reasoning && (
                    <p className="text-[11px] text-primary-light font-medium leading-relaxed mt-2">
                      {selMatch.reasoning}
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-surface-bright border border-outline-variant space-y-2 text-xs mb-4">
                  <p>
                    <strong>Available / Capacity:</strong>{' '}
                    <span className="text-primary font-bold">{selectedMarker.availableQuantity}</span>
                  </p>
                  <p>
                    <strong>Reliability:</strong>{' '}
                    <span className="text-emerald-700 font-bold">{selectedMarker.reliability}%</span>
                  </p>
                  <p>
                    <strong>Verified:</strong>{' '}
                    <span className={selectedMarker.verified ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                      {selectedMarker.verified ? 'Yes' : 'Pending'}
                    </span>
                  </p>
                  {selectedMarker.role === 'receiver' && (
                    <p className="text-[11px] text-on-surface-variant">
                      Not in {focusDonor?.name ?? 'the hub donor'}&apos;s current top matches.
                    </p>
                  )}
                </div>
              )}

              {/* Pickup / delivery endpoints */}
              <div className="grid grid-cols-1 gap-2 text-xs mb-4">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm text-emerald-700 mt-0.5">trip_origin</span>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Pickup</span>
                    <span className="text-on-surface">{focusDonor?.address ?? focusDonor?.name ?? 'Donor hub'}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm text-blue-700 mt-0.5">location_on</span>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Delivery</span>
                    <span className="text-on-surface">{selectedMarker.addressText}</span>
                  </div>
                </div>
              </div>

              {/* Actions: View Route + Select / Open portal */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowRoute((v) => !v)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                    showRoute
                      ? 'bg-secondary-container text-on-secondary-container border-secondary/30'
                      : 'bg-surface-bright text-on-surface-variant border-outline-variant hover:text-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">route</span>
                  {showRoute ? 'Hide Route' : 'View Route'}
                </button>
                <button
                  onClick={() => openPortal(selectedMarker)}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:opacity-90 transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  <span>{selectedMarker.role === 'receiver' ? 'Select Receiver' : 'Open Portal'}</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-3xl border border-outline-variant shadow-sm text-center py-10">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">
                touch_app
              </span>
              <h3 className="font-bold text-primary text-sm">Select a Marker on the Map</h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Click any pin to inspect match scores, distance, estimated travel, and the pickup → delivery route.
              </p>
            </div>
          )}

          {/* Quick List of Network Nodes */}
          <div className="bg-white p-6 rounded-3xl border border-outline-variant shadow-sm max-h-[420px] overflow-y-auto">
            <h3 className="font-headline-md text-sm text-primary font-bold mb-4">
              Registered Network Members ({filteredMarkers.length})
            </h3>
            <div className="space-y-3">
              {filteredMarkers.map((m) => {
                const km = milesToKm(m.distanceMiles);
                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      setSelectedMarker(m);
                      setShowRoute(true);
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-left ${
                      selectedMarker?.id === m.id
                        ? 'border-secondary bg-secondary-container/20'
                        : 'border-outline-variant hover:border-primary bg-surface-bright'
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-xs text-primary">{m.name}</h4>
                      <p className="text-[11px] text-on-surface-variant">
                        {m.availableQuantity} • {formatKm(km)}
                      </p>
                    </div>
                    <span className={`w-2.5 h-2.5 rounded-full ${roleDotClass(m.role)}`}></span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
