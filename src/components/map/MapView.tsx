import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getMapMarkersData } from '../../data/mockData';
import { MapMarkerData, UserRole } from '../../types';

export const MapView: React.FC = () => {
  const { posts, setActiveView, loginUserByRole } = useApp();
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [selectedMarker, setSelectedMarker] = useState<MapMarkerData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const allMarkers = getMapMarkersData(posts);

  const filteredMarkers = allMarkers.filter((m) => {
    const matchesRole = roleFilter === 'all' || m.role === roleFilter;
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.addressText.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="pt-24 pb-16 px-container-padding max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold uppercase tracking-wider mb-2">
            Real-Time Network Map
          </span>
          <h1 className="font-display-lg text-headline-lg text-primary font-bold">
            Interactive Zero-Waste Ecosystem Map
          </h1>
          <p className="font-body-md text-sm text-on-surface-variant">
            Visualizing real-time food recovery routes connecting donors, receivers, and industrial waste processors.
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
        {/* Simulated Interactive Map Display */}
        <div className="lg:col-span-2 bg-slate-900 rounded-3xl border border-outline-variant overflow-hidden min-h-[500px] relative shadow-xl flex flex-col justify-between p-6">
          {/* Top Map Toolbar Overlay */}
          <div className="flex justify-between items-center z-20">
            <div className="bg-slate-800/90 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-700 text-white text-xs flex items-center gap-2 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-bold">Live GPS Grid: NYC Metropolitan Area</span>
            </div>

            <div className="bg-slate-800/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-slate-300 text-[11px] font-bold">
              {filteredMarkers.length} Nodes Displayed
            </div>
          </div>

          {/* Interactive Node Canvas Grid Representation */}
          <div className="relative my-8 h-96 w-full rounded-2xl bg-[#0f172a] border border-slate-800 overflow-hidden flex items-center justify-center p-4">
            {/* Grid lines styling */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(#38bdf8 1px, transparent 1px)`,
                backgroundSize: '24px 24px',
              }}
            ></div>

            {/* Simulated Animated Match Routes */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-emerald-500/30 stroke-[2] stroke-dasharray-[6]">
              <line x1="20%" y1="30%" x2="50%" y2="60%" className="animate-pulse" />
              <line x1="50%" y1="60%" x2="80%" y2="40%" className="animate-pulse" />
              <line x1="30%" y1="70%" x2="70%" y2="75%" className="animate-pulse" />
            </svg>

            {/* Node Pins */}
            <div className="relative w-full h-full">
              {filteredMarkers.slice(0, 18).map((marker, idx) => {
                // Scatter markers visually on canvas based on index/coordinates
                const topPct = 15 + ((idx * 17) % 70);
                const leftPct = 10 + ((idx * 23) % 80);

                const isSelected = selectedMarker?.id === marker.id;

                const roleColor =
                  marker.role === 'donor'
                    ? 'bg-emerald-500 text-white'
                    : marker.role === 'receiver'
                    ? 'bg-blue-500 text-white'
                    : 'bg-amber-600 text-white';

                return (
                  <button
                    key={marker.id}
                    onClick={() => setSelectedMarker(marker)}
                    style={{ top: `${topPct}%`, left: `${leftPct}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all group z-10 hover:scale-125 focus:outline-none ${
                      isSelected ? 'scale-125 z-30 ring-4 ring-white' : ''
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg border-2 border-white ${roleColor}`}
                    >
                      <span className="material-symbols-outlined text-sm">
                        {marker.role === 'donor'
                          ? 'restaurant'
                          : marker.role === 'receiver'
                          ? 'volunteer_activism'
                          : 'recycling'}
                      </span>
                    </div>

                    {/* Tooltip on Hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-40 whitespace-nowrap">
                      <div className="bg-slate-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-xl border border-slate-700">
                        {marker.name}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {marker.availableQuantity}
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
            <span className="text-[11px] text-slate-400">Click any marker to view detail</span>
          </div>
        </div>

        {/* Node Detail & List Panel */}
        <div className="space-y-6">
          {/* Selected Node Details Card */}
          {selectedMarker ? (
            <div className="bg-white p-6 rounded-3xl border border-outline-variant shadow-md animate-in fade-in duration-200">
              <div className="flex items-center justify-between mb-4">
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
                <span className="text-xs text-on-surface-variant font-bold">
                  ★ {selectedMarker.reliability}% Reliability
                </span>
              </div>

              <h3 className="font-headline-md text-headline-md text-primary font-bold mb-1">
                {selectedMarker.name}
              </h3>
              <p className="text-xs text-on-surface-variant mb-4">{selectedMarker.addressText}</p>

              <div className="p-4 rounded-xl bg-surface-bright border border-outline-variant space-y-2 text-xs mb-6">
                <p>
                  <strong>Available Payload / Capacity:</strong>{' '}
                  <span className="text-primary font-bold">{selectedMarker.availableQuantity}</span>
                </p>
                <p>
                  <strong>Distance to Core Hub:</strong> {selectedMarker.distanceMiles} miles
                </p>
                <p>
                  <strong>Automated Verification:</strong>{' '}
                  <span className="text-emerald-700 font-bold">Verified = True</span>
                </p>
              </div>

              <button
                onClick={() => {
                  loginUserByRole(selectedMarker.role);
                }}
                className="w-full py-3 rounded-xl bg-primary text-white text-xs font-bold hover:opacity-90 transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <span>Switch to {selectedMarker.name} Portal</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-3xl border border-outline-variant shadow-sm text-center py-10">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">
                touch_app
              </span>
              <h3 className="font-bold text-primary text-sm">Select a Marker on the Map</h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Click any pin on the interactive grid to inspect match scores, inventory, and location details.
              </p>
            </div>
          )}

          {/* Quick List of Network Nodes */}
          <div className="bg-white p-6 rounded-3xl border border-outline-variant shadow-sm max-h-[420px] overflow-y-auto">
            <h3 className="font-headline-md text-sm text-primary font-bold mb-4">
              Registered Network Members ({filteredMarkers.length})
            </h3>
            <div className="space-y-3">
              {filteredMarkers.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setSelectedMarker(m)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-left ${
                    selectedMarker?.id === m.id
                      ? 'border-secondary bg-secondary-container/20'
                      : 'border-outline-variant hover:border-primary bg-surface-bright'
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-xs text-primary">{m.name}</h4>
                    <p className="text-[11px] text-on-surface-variant">{m.availableQuantity}</p>
                  </div>
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      m.role === 'donor'
                        ? 'bg-emerald-500'
                        : m.role === 'receiver'
                        ? 'bg-blue-500'
                        : 'bg-amber-600'
                    }`}
                  ></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
