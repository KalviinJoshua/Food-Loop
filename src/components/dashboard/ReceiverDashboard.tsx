import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DonationPost, DonationStatus } from '../../types';
import { RatingModal } from '../ratings/RatingModal';

export const ReceiverDashboard: React.FC = () => {
  const {
    currentUser,
    posts,
    requests,
    createReceiverRequest,
    updatePostStatus,
    setActiveView,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'feed' | 'my_requests' | 'allocations' | 'profile'>('feed');

  // Form states for creating a new need request
  const [mealsRequired, setMealsRequired] = useState<number>(100);
  const [dietaryNotes, setDietaryNotes] = useState<string>('Vegan-Friendly, No Nuts');
  const [urgency, setUrgency] = useState<'Normal' | 'High' | 'Immediate'>('High');
  const [locationAddress, setLocationAddress] = useState(
    currentUser?.address || '45 E 1st St, East Village, NY'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Rating Modal state
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [ratingTarget, setRatingTarget] = useState<{
    toUserId: string;
    toUserName: string;
    donationId: string;
    donationTitle: string;
  } | null>(null);

  const activeFoodPosts = posts.filter(
    (p) => p.type === 'food' && p.status !== 'Completed'
  );
  // Filter to show only current receiver's requests
  const myRequests = requests.filter((r) => r.receiverId === currentUser?.id);

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    try {
      if (!mealsRequired || mealsRequired <= 0) return;
      
      setIsSubmitting(true);
      createReceiverRequest({
        mealsRequired: Number(mealsRequired),
        dietaryNotes: dietaryNotes.split(',').map((s) => s.trim()),
        urgency,
        locationAddress,
      });
      setMealsRequired(100);
      setDietaryNotes('Vegan-Friendly, No Nuts');
      setUrgency('High');
    } catch (error) {
      console.error('Failed to create request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
                FoodBridge
              </span>
              <span className="text-[10px] uppercase tracking-wider text-secondary font-bold block mt-0.5">
                Receiver Portal
              </span>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('my_requests')}
            className="w-full bg-primary text-on-primary font-label-md text-sm py-3 px-4 rounded-xl shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-2 mb-6"
          >
            <span className="material-symbols-outlined text-lg">campaign</span>
            <span>Request Food</span>
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
                <span className="material-symbols-outlined">restaurant</span>
                <span>Available Food</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-secondary-container text-xs font-bold text-on-secondary-container">
                {activeFoodPosts.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('my_requests')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'my_requests'
                  ? 'bg-secondary-container/50 text-primary'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined">assignment_turned_in</span>
                <span>My Requests</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-surface-container text-xs font-bold">
                {myRequests.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('allocations')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'allocations'
                  ? 'bg-secondary-container/50 text-primary'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              <span className="material-symbols-outlined">splitscreen</span>
              <span>Partial Allocations</span>
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
              <span>NGO Profile</span>
            </button>
          </nav>
        </div>

        <div className="p-6 border-t border-outline-variant">
          <div className="bg-surface p-4 rounded-xl border border-outline-variant">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-receiver-accent animate-pulse"></span>
              <span className="text-xs font-bold text-primary">NGO Community Center</span>
            </div>
            <p className="text-[11px] text-on-surface-variant">
              Daily Needs: {currentUser?.mealsRequired || 80} Meals
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
                  Welcome, {currentUser?.name || 'Hope Foundation'}!
                </h1>
                {/* Verified Badge Requirement 1 */}
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-receiver-accent/15 text-receiver-accent border border-outline-variant text-xs font-bold">
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
                Community Hunger Relief Portal • {currentUser?.address || '45 E 1st St, NY'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container text-xs font-bold text-primary">
              <span className="material-symbols-outlined text-sm text-secondary">star</span>
              <span>{currentUser?.rating || 5.0} ★</span>
              <span className="text-on-surface-variant">•</span>
              <span className="text-receiver-accent">{currentUser?.reliability || 100}% Reliability</span>
            </div>

            <button
              onClick={() => setActiveView('map')}
              className="px-4 py-2 bg-secondary-container text-on-secondary-container rounded-lg font-label-md text-sm hover:opacity-90 flex items-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">explore</span>
              <span>Open Map</span>
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
                  Meals Received
                </span>
                <span className="w-8 h-8 rounded-lg bg-receiver-accent/15 text-receiver-accent flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">local_dining</span>
                </span>
              </div>
              <h3 className="font-display-lg text-2xl text-primary font-bold">1,450</h3>
              <p className="text-xs text-receiver-accent font-medium mt-1">↑ 160 this week</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm hover-lift">
              <div className="flex justify-between items-center mb-2">
                <span className="font-label-md text-xs uppercase text-on-surface-variant">
                  Active Pickups
                </span>
                <span className="w-8 h-8 rounded-lg bg-secondary/15 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">local_shipping</span>
                </span>
              </div>
              <h3 className="font-display-lg text-2xl text-primary font-bold">2</h3>
              <p className="text-xs text-on-surface-variant mt-1">In transit now</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm hover-lift">
              <div className="flex justify-between items-center mb-2">
                <span className="font-label-md text-xs uppercase text-on-surface-variant">
                  Partner Donors
                </span>
                <span className="w-8 h-8 rounded-lg bg-waste-accent/15 text-waste-accent flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">storefront</span>
                </span>
              </div>
              <h3 className="font-display-lg text-2xl text-primary font-bold">18</h3>
              <p className="text-xs text-amber-700 font-medium mt-1">Active restaurants</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm hover-lift">
              <div className="flex justify-between items-center mb-2">
                <span className="font-label-md text-xs uppercase text-on-surface-variant">
                  Reliability Score
                </span>
                <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">verified</span>
                </span>
              </div>
              <h3 className="font-display-lg text-2xl text-primary font-bold">
                {currentUser?.reliability || 100}%
              </h3>
              <p className="text-xs text-on-surface-variant mt-1">Top-tier NGO partner</p>
            </div>
          </div>

          {/* FEED: AVAILABLE FOOD DONATIONS */}
          {activeTab === 'feed' && (
            <div className="bg-white p-6 rounded-2xl border border-outline-variant shadow-sm">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-outline-variant">
                <div>
                  <h2 className="font-headline-md text-primary font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary">restaurant</span>
                    Available Food Donations from Nearby Restaurants
                  </h2>
                  <p className="font-body-md text-xs text-on-surface-variant mt-1">
                    Sorted dynamically by Smart Match Score • Click to claim or accept partial allocation
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeFoodPosts.map((post) => (
                  <div
                    key={post.id}
                    className="p-5 rounded-xl border border-outline-variant bg-surface-bright hover-lift flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-secondary block">
                            {post.donorName}
                          </span>
                          <h3 className="font-bold text-primary text-base">{post.title}</h3>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-bold text-xs">
                          {post.status}
                        </span>
                      </div>

                      <p className="text-xs text-on-surface-variant mb-3">{post.description}</p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.allergens?.map((al, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-white border border-outline-variant text-[10px] text-primary font-medium"
                          >
                            {al}
                          </span>
                        ))}
                      </div>

                      <div className="text-xs text-on-surface-variant space-y-1 mb-4 py-2 border-y border-outline-variant/40">
                        <p>
                          <strong>Total Quantity:</strong> {post.quantityMeals} Meals
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
                                AI Match Analytics
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
                        className="w-1/2 py-2.5 rounded-lg bg-primary text-white text-xs font-bold hover:opacity-90 transition-all shadow-sm flex items-center justify-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">check</span>
                        <span>Accept Complete</span>
                      </button>
                      <button
                        onClick={() => handleStatusStep(post, 'Matched')}
                        className="w-1/2 py-2.5 rounded-lg bg-secondary-container text-on-secondary-container text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">splitscreen</span>
                        <span>Accept Partial</span>
                      </button>
                    </div>

                    {/* Stepper buttons if this post is already Matched or Accepted */}
                    {(post.status === 'Matched' || post.status === 'Accepted' || post.status === 'Collected') && (
                      <div className="mt-4 pt-3 border-t border-outline-variant flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[10px] text-secondary font-bold uppercase">
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

          {/* VIEW: MY REQUESTS */}
          {activeTab === 'my_requests' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Request Form */}
              <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-outline-variant shadow-sm">
                <h2 className="font-headline-md text-primary font-bold mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">campaign</span>
                  Create Food Request
                </h2>
                <form onSubmit={handleCreateRequest} className="space-y-4">
                  <div>
                    <label className="font-label-md text-xs text-on-surface-variant block mb-1">
                      Meals Required *
                    </label>
                    <input
                      type="number"
                      required
                      value={mealsRequired}
                      onChange={(e) => setMealsRequired(Number(e.target.value))}
                      className="w-full rounded-lg border-outline-variant focus:border-secondary text-sm p-3 bg-surface-bright"
                    />
                  </div>
                  <div>
                    <label className="font-label-md text-xs text-on-surface-variant block mb-1">
                      Dietary Requirements
                    </label>
                    <input
                      type="text"
                      value={dietaryNotes}
                      onChange={(e) => setDietaryNotes(e.target.value)}
                      placeholder="Vegan-Friendly, No Nuts, Dairy Free"
                      className="w-full rounded-lg border-outline-variant focus:border-secondary text-sm p-3 bg-surface-bright"
                    />
                  </div>
                  <div>
                    <label className="font-label-md text-xs text-on-surface-variant block mb-1">
                      Urgency Level
                    </label>
                    <select
                      value={urgency}
                      onChange={(e) =>
                        setUrgency(e.target.value as 'Normal' | 'High' | 'Immediate')
                      }
                      className="w-full rounded-lg border-outline-variant focus:border-secondary text-sm p-3 bg-surface-bright font-bold"
                    >
                      <option value="Normal">Normal Urgency</option>
                      <option value="High">High Urgency</option>
                      <option value="Immediate">Immediate / Emergency Need</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-label-md text-xs text-on-surface-variant block mb-1">
                      Delivery/Pickup Address
                    </label>
                    <input
                      type="text"
                      value={locationAddress}
                      onChange={(e) => setLocationAddress(e.target.value)}
                      className="w-full rounded-lg border-outline-variant focus:border-secondary text-sm p-3 bg-surface-bright"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-primary text-white font-label-md text-sm py-3 rounded-xl hover:opacity-90 shadow-md flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">send</span>
                    <span>Submit Request to Donors</span>
                  </button>
                </form>
              </div>

              {/* My Submitted Requests */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-outline-variant shadow-sm">
                <h2 className="font-headline-md text-primary font-bold mb-4">
                  My Submitted Need Requests ({myRequests.length})
                </h2>
                <div className="space-y-4">
                  {myRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 rounded-xl border border-outline-variant bg-surface-bright flex flex-wrap items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-primary text-base">
                            {req.mealsRequired} Meals Requested
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              req.urgency === 'Immediate'
                                ? 'bg-error-container text-on-error-container'
                                : 'bg-secondary-container text-on-secondary-container'
                            }`}
                          >
                            {req.urgency}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-1">
                          Dietary: {req.dietaryNotes.join(', ')} • {req.locationAddress}
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                        {req.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: PARTIAL ALLOCATIONS */}
          {activeTab === 'allocations' && (
            <div className="bg-white p-6 rounded-2xl border border-outline-variant shadow-sm">
              <h2 className="font-headline-md text-primary font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">splitscreen</span>
                Auto-Split Partial Allocation Breakdown
              </h2>
              <p className="text-xs text-on-surface-variant mb-6">
                When a large corporate donation is posted, the Auto-Allocate algorithm splits trays
                across multiple nearby shelters automatically.
              </p>
              <div className="space-y-4">
                {posts
                  .filter((p) => p.allocations && p.allocations.length > 0)
                  .map((p) => (
                    <div
                      key={p.id}
                      className="p-5 rounded-xl border border-outline-variant bg-surface-bright"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-primary">{p.title}</h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-xs font-bold">
                          {p.quantityMeals} Total Meals
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {p.allocations?.map((al, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-lg bg-white border border-outline-variant shadow-sm"
                          >
                            <span className="text-[10px] text-secondary font-bold uppercase block">
                              Recipient #{i + 1}
                            </span>
                            <h4 className="font-bold text-sm text-primary">{al.receiverName}</h4>
                            <p className="text-xs text-emerald-700 font-bold mt-1">
                              Allocated: +{al.allocated} Meals
                            </p>
                            <p className="text-[10px] text-on-surface-variant">
                              Match Score: {al.matchScore}%
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* VIEW: PROFILE */}
          {activeTab === 'profile' && (
            <div className="bg-white p-8 rounded-2xl border border-outline-variant shadow-sm max-w-3xl">
              <h2 className="font-headline-md text-primary font-bold mb-6">
                NGO Verification &amp; Profile Details
              </h2>
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-3 mb-6">
                <span
                  className="material-symbols-outlined text-blue-700 text-3xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  verified
                </span>
                <div>
                  <h3 className="font-bold text-blue-900">
                    Verified Community Non-Profit Partner
                  </h3>
                  <p className="text-xs text-blue-700">
                    Government tax-exempt certificate verified. Ready for immediate daily rescue
                    pickups.
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
                  <strong className="text-primary">{currentUser?.contactPerson || 'Community Coordinator'}</strong>
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
                  <span className="text-xs text-on-surface-variant block">Daily Meals Required</span>
                  <strong className="text-primary">{currentUser?.mealsRequired || 0}</strong>
                </div>
                <div className="p-4 rounded-xl bg-surface-bright border border-outline-variant">
                  <span className="text-xs text-on-surface-variant block">Reliability Score</span>
                  <strong className="text-emerald-700">{currentUser?.reliability || 100}%</strong>
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
