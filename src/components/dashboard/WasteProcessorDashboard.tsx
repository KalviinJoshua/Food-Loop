import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DonationPost, DonationStatus } from '../../types';
import { RatingModal } from '../ratings/RatingModal';

export const WasteProcessorDashboard: React.FC = () => {
  const {
    currentUser,
    posts,
    updatePostStatus,
    setActiveView,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'feed' | 'collections' | 'specs' | 'profile'>('feed');

  // Rating Modal state
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [ratingTarget, setRatingTarget] = useState<{
    toUserId: string;
    toUserName: string;
    donationId: string;
    donationTitle: string;
  } | null>(null);

  const organicWastePosts = posts.filter(
    (p) => p.type === 'organic_waste' && p.status !== 'Completed'
  );

  const completedCollections = posts.filter(
    (p) => p.type === 'organic_waste' && p.status === 'Completed'
  );

  const handleStatusStep = (post: DonationPost, nextStatus: DonationStatus) => {
    updatePostStatus(post.id, nextStatus);
    if (nextStatus === 'Completed') {
      setRatingTarget({
        toUserId: post.donorId,
        toUserName: post.donorName,
        donationId: post.id,
        donationTitle: post.title,
      });
      setRatingModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-surface-bright flex">
      {/* SideNavBar */}
      <aside className="w-64 bg-surface-container-lowest border-r border-outline-variant flex flex-col justify-between hidden md:flex sticky top-0 h-screen">
        <div className="p-6">
          <div
            onClick={() => setActiveView('landing')}
            className="flex items-center gap-3 cursor-pointer mb-8"
          >
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-md">
              <span className="material-symbols-outlined">recycling</span>
            </div>
            <div>
              <span className="font-headline-md text-headline-md font-bold text-primary block leading-none">
                FoodLoop
              </span>
              <span className="text-[10px] uppercase tracking-wider text-amber-800 font-bold block mt-0.5">
                Waste Processor
              </span>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('feed')}
            className="w-full bg-amber-800 text-white font-label-md text-sm py-3 px-4 rounded-xl shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-2 mb-6"
          >
            <span className="material-symbols-outlined text-lg">local_shipping</span>
            <span>Schedule Fleet</span>
          </button>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('feed')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'feed'
                  ? 'bg-secondary-container/50 text-primary'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined">compost</span>
                <span>Organic Waste Feed</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                {organicWastePosts.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('collections')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'collections'
                  ? 'bg-secondary-container/50 text-primary'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined">check_circle</span>
                <span>My Collections</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-surface-container text-xs font-bold">
                {completedCollections.length}
              </span>
            </button>

            <button
              onClick={() => setActiveView('map')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-on-surface-variant hover:bg-surface-container-low transition-all"
            >
              <span className="material-symbols-outlined text-secondary">map</span>
              <span>Interactive Map</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'profile'
                  ? 'bg-secondary-container/50 text-primary'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              <span className="material-symbols-outlined">verified</span>
              <span>Facility Specs</span>
            </button>
          </nav>
        </div>

        <div className="p-6 border-t border-outline-variant">
          <div className="bg-surface p-4 rounded-xl border border-outline-variant">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-amber-700 animate-pulse"></span>
              <span className="text-xs font-bold text-primary">Industrial Composting</span>
            </div>
            <p className="text-[11px] text-on-surface-variant">
              Capacity: {currentUser?.capacityTons || 120} Tons / month
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 pt-20 md:pt-0">
        {/* Header */}
        <header className="bg-white border-b border-outline-variant px-8 py-5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-headline-md text-primary font-bold">
                  Welcome, {currentUser?.name || 'EcoCompost Facility'}!
                </h1>
                {/* Verified Badge Requirement 1 */}
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold">
                  <span
                    className="material-symbols-outlined text-sm"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    verified
                  </span>
                  Verified
                </span>
              </div>
              <p className="font-body-md text-sm text-on-surface-variant">
                Compost &amp; Biogas Processing Portal • {currentUser?.address || '400 Varick Ave, Brooklyn'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container text-xs font-bold text-primary">
              <span className="material-symbols-outlined text-sm text-secondary">star</span>
              <span>{currentUser?.rating || 4.9} ★</span>
              <span className="text-on-surface-variant">•</span>
              <span className="text-secondary">{currentUser?.reliability || 99}% Reliability</span>
            </div>

            <button
              onClick={() => setActiveView('map')}
              className="px-4 py-2 bg-secondary-container text-on-secondary-container rounded-lg font-label-md text-sm hover:opacity-90 flex items-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">explore</span>
              <span>Open Network Map</span>
            </button>
          </div>
        </header>

        {/* Workspace Body */}
        <div className="p-8 max-w-7xl mx-auto space-y-8">
          {/* STATS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm hover-lift">
              <div className="flex justify-between items-center mb-2">
                <span className="font-label-md text-xs uppercase text-on-surface-variant">
                  Waste Processed
                </span>
                <span className="w-8 h-8 rounded-lg bg-waste-accent/15 text-waste-accent flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">recycling</span>
                </span>
              </div>
              <h3 className="font-display-lg text-2xl text-primary font-bold">34.5 Tons</h3>
              <p className="text-xs text-waste-accent font-medium mt-1">↑ 4.2 tons this week</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm hover-lift">
              <div className="flex justify-between items-center mb-2">
                <span className="font-label-md text-xs uppercase text-on-surface-variant">
                  Active Routes
                </span>
                <span className="w-8 h-8 rounded-lg bg-secondary/15 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">local_shipping</span>
                </span>
              </div>
              <h3 className="font-display-lg text-2xl text-primary font-bold">3</h3>
              <p className="text-xs text-on-surface-variant mt-1">Commercial tankers</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm hover-lift">
              <div className="flex justify-between items-center mb-2">
                <span className="font-label-md text-xs uppercase text-on-surface-variant">
                  Biogas Converted
                </span>
                <span className="w-8 h-8 rounded-lg bg-receiver-accent/15 text-receiver-accent flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">bolt</span>
                </span>
              </div>
              <h3 className="font-display-lg text-2xl text-primary font-bold">12,800</h3>
              <p className="text-xs text-receiver-accent font-medium mt-1">kWh clean energy</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm hover-lift">
              <div className="flex justify-between items-center mb-2">
                <span className="font-label-md text-xs uppercase text-on-surface-variant">
                  Facility Capacity
                </span>
                <span className="w-8 h-8 rounded-lg bg-secondary/15 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">warehouse</span>
                </span>
              </div>
              <h3 className="font-display-lg text-2xl text-primary font-bold">
                {currentUser?.capacityTons || 120} Tons
              </h3>
              <p className="text-xs text-on-surface-variant mt-1">78% utilization rate</p>
            </div>
          </div>

          {/* FEED: AVAILABLE ORGANIC WASTE */}
          {activeTab === 'feed' && (
            <div className="bg-white p-6 rounded-2xl border border-outline-variant shadow-sm">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-outline-variant">
                <div>
                  <h2 className="font-headline-md text-primary font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-800">compost</span>
                    Available Organic Waste from Restaurants &amp; Supermarkets
                  </h2>
                  <p className="font-body-md text-xs text-on-surface-variant mt-1">
                    Sorted by weight, distance, and industrial suitability
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {organicWastePosts.map((post) => (
                  <div
                    key={post.id}
                    className="p-5 rounded-xl border border-outline-variant bg-surface-bright hover-lift flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-amber-800 block">
                            {post.donorName}
                          </span>
                          <h3 className="font-bold text-primary text-base">{post.title}</h3>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-xs">
                          {post.status}
                        </span>
                      </div>

                      <p className="text-xs text-on-surface-variant mb-4">{post.description}</p>

                      <div className="text-xs text-on-surface-variant space-y-1 mb-4 py-2 border-y border-outline-variant/40">
                        <p>
                          <strong>Weight:</strong> {post.quantityMeals} kg ({((post.quantityMeals * 2.2) / 2000).toFixed(2)} Tons)
                        </p>
                        <p>
                          <strong>Pickup Location:</strong> {post.locationAddress}
                        </p>
                        <p>
                          <strong>Safe Until:</strong> {new Date(post.safeUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      {post.matches?.find((m) => m.receiverId === currentUser?.id) && (() => {
                        const m = post.matches.find((m) => m.receiverId === currentUser?.id)!;
                        return (
                          <div className="mb-4 bg-secondary-container/20 p-3 rounded-xl border border-secondary/15">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[11px] font-bold text-primary flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">smart_toy</span>
                                AI Suitability Analytics
                              </span>
                              <span className="font-bold text-xs text-emerald-700">{m.matchPercentage}% Match</span>
                            </div>
                            {m.reasoning && (
                              <p className="text-[11px] text-primary-light font-semibold leading-relaxed mt-1">
                                {m.reasoning}
                              </p>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleStatusStep(post, 'Accepted')}
                        className="w-full py-2.5 rounded-lg bg-amber-800 text-white text-xs font-bold hover:opacity-90 transition-all shadow-sm flex items-center justify-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">local_shipping</span>
                        <span>Schedule Fleet Pickup</span>
                      </button>
                    </div>

                    {(post.status === 'Accepted' || post.status === 'Collected') && (
                      <div className="mt-4 pt-3 border-t border-outline-variant flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[10px] text-amber-900 font-bold uppercase">
                          Progress Status:
                        </span>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleStatusStep(post, 'Collected')}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-bold"
                          >
                            Mark Collected
                          </button>
                          <button
                            onClick={() => handleStatusStep(post, 'Completed')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold"
                          >
                            Mark Completed
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW: COLLECTIONS */}
          {activeTab === 'collections' && (
            <div className="bg-white p-6 rounded-2xl border border-outline-variant shadow-sm">
              <h2 className="font-headline-md text-primary font-bold mb-4">
                Completed Collections &amp; Processed History
              </h2>
              <div className="space-y-4">
                {completedCollections.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-xl border border-outline-variant bg-surface-bright flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-primary">{p.title}</h4>
                      <p className="text-xs text-on-surface-variant">
                        {p.donorName} • {p.quantityMeals} kg processed into high-grade compost &amp; biogas
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                      Completed
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW: PROFILE */}
          {activeTab === 'profile' && (
            <div className="bg-white p-8 rounded-2xl border border-outline-variant shadow-sm max-w-3xl">
              <h2 className="font-headline-md text-primary font-bold mb-6">
                Facility Specifications &amp; Industrial Credentials
              </h2>
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3 mb-6">
                <span
                  className="material-symbols-outlined text-amber-800 text-3xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  verified
                </span>
                <div>
                  <h3 className="font-bold text-amber-950">
                    Verified Industrial Waste Processor
                  </h3>
                  <p className="text-xs text-amber-900">
                    EPA &amp; State Environmental Composting &amp; Biogas permit verified.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-4 rounded-xl bg-surface-bright border border-outline-variant">
                  <span className="text-xs text-on-surface-variant block">Organization</span>
                  <strong className="text-primary">{currentUser?.name}</strong>
                </div>
                <div className="p-4 rounded-xl bg-surface-bright border border-outline-variant">
                  <span className="text-xs text-on-surface-variant block">Contact Person</span>
                  <strong className="text-primary">{currentUser?.contactPerson || 'Facility Manager'}</strong>
                </div>
                <div className="p-4 rounded-xl bg-surface-bright border border-outline-variant">
                  <span className="text-xs text-on-surface-variant block">Email</span>
                  <strong className="text-primary">{currentUser?.email}</strong>
                </div>
                <div className="p-4 rounded-xl bg-surface-bright border border-outline-variant">
                  <span className="text-xs text-on-surface-variant block">Phone</span>
                  <strong className="text-primary">{currentUser?.phone}</strong>
                </div>
                <div className="p-4 rounded-xl bg-surface-bright border border-outline-variant">
                  <span className="text-xs text-on-surface-variant block">Facility Type</span>
                  <strong className="text-primary">{currentUser?.facilityType || 'Compost Facility'}</strong>
                </div>
                <div className="p-4 rounded-xl bg-surface-bright border border-outline-variant">
                  <span className="text-xs text-on-surface-variant block">Facility Capacity</span>
                  <strong className="text-primary">{currentUser?.capacityTons || 0} Tons</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* RATING MODAL */}
      {ratingTarget && (
        <RatingModal
          isOpen={ratingModalOpen}
          toUserId={ratingTarget.toUserId}
          toUserName={ratingTarget.toUserName}
          donationId={ratingTarget.donationId}
          donationTitle={ratingTarget.donationTitle}
          onClose={() => setRatingModalOpen(false)}
        />
      )}
    </div>
  );
};
