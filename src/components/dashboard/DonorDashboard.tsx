import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DonationPost, DonationStatus, MatchResult } from '../../types';
import { RatingModal } from '../ratings/RatingModal';

export const DonorDashboard: React.FC = () => {
  const {
    currentUser,
    posts,
    requests,
    createDonationPost,
    updatePostStatus,
    autoAllocatePost,
    setActiveView,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'posts' | 'requests' | 'profile'>('dashboard');
  const [postType, setPostType] = useState<'food' | 'organic_waste'>('food');

  // Form states for creating a new post
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [quantityMeals, setQuantityMeals] = useState<number>(300);
  const [prepTime, setPrepTime] = useState('18:30');
  const [allergens, setAllergens] = useState('Nuts, Dairy, Vegan-Friendly');
  const [safeUntil, setSafeUntil] = useState('2026-08-02T22:30');
  const [deliveryRadiusMiles, setDeliveryRadiusMiles] = useState<number>(10);
  const [locationAddress, setLocationAddress] = useState(
    currentUser?.address || '142 Green St, Downtown, NY'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active highlighted post for Smart Matching / Partial Allocation display
  const [selectedPostId, setSelectedPostId] = useState<string>('');

  // Rating Modal state
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [ratingTarget, setRatingTarget] = useState<{
    toUserId: string;
    toUserName: string;
    donationId: string;
    donationTitle: string;
  } | null>(null);

  // Filter to show only current donor's posts
  const myPosts = posts.filter((p) => p.donorId === currentUser?.id);
  
  // Set initial selected post when myPosts changes
  React.useEffect(() => {
    if (myPosts.length > 0 && !selectedPostId) {
      setSelectedPostId(myPosts[0].id);
    } else if (myPosts.length === 0) {
      setSelectedPostId('');
    }
  }, [myPosts, selectedPostId]);

  const selectedPost: DonationPost | undefined = posts.find((p) => p.id === selectedPostId) || posts[0];

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    try {
      if (!title.trim() || !quantityMeals) return;

      setIsSubmitting(true);
      const created = createDonationPost({
        type: postType,
        title,
        description,
        quantityMeals: Number(quantityMeals),
        prepTime,
        allergens: allergens.split(',').map((s) => s.trim()),
        safeUntil,
        deliveryRadiusMiles: Number(deliveryRadiusMiles),
        locationAddress,
      });

      setTitle('');
      setDescription('');
      setSelectedPostId(created.id);
      setActiveTab('dashboard');
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusStep = (post: DonationPost, nextStatus: DonationStatus) => {
    updatePostStatus(post.id, nextStatus);
    if (nextStatus === 'Completed' && post.assignedReceiverId) {
      setRatingTarget({
        toUserId: post.assignedReceiverId,
        toUserName: post.assignedReceiverName || 'Partner Organization',
        donationId: post.id,
        donationTitle: post.title,
      });
      setRatingModalOpen(true);
    }
  };

  const activeDonationsCount = myPosts.filter((p) => p.status !== 'Completed').length;
  const completedDonationsCount = myPosts.filter((p) => p.status === 'Completed').length;
  const totalMealsShared = myPosts.reduce((acc, p) => acc + p.quantityMeals, 0);

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
              <span className="text-[10px] uppercase tracking-wider text-secondary font-bold block mt-0.5">
                Donor Portal
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              setActiveTab('dashboard');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="w-full bg-primary text-on-primary font-label-md text-sm py-3 px-4 rounded-xl shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-2 mb-6"
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            <span>Create Post</span>
          </button>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-secondary-container/50 text-primary'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              <span className="material-symbols-outlined">dashboard</span>
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('posts')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'posts'
                  ? 'bg-secondary-container/50 text-primary'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined">inventory_2</span>
                <span>My Posts</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-surface-container text-xs font-bold">
                {myPosts.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('requests')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'requests'
                  ? 'bg-secondary-container/50 text-primary'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined">concierge</span>
                <span>NGO Requests</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-secondary-container text-xs font-bold text-on-secondary-container">
                {requests.length}
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
              <span>Profile &amp; Ratings</span>
            </button>
          </nav>
        </div>

        <div className="p-6 border-t border-outline-variant">
          <div className="bg-surface p-4 rounded-xl border border-outline-variant">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-primary">Zero Waste Partner</span>
            </div>
            <p className="text-[11px] text-on-surface-variant">
              FSSAI: {currentUser?.fssai || '11523004000188'}
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 pt-20 md:pt-0">
        {/* Top Header */}
        <header className="bg-white border-b border-outline-variant px-8 py-5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-headline-md text-primary font-bold">
                  Welcome back, {currentUser?.name || 'Green Bistro'}!
                </h1>
                {/* Verified Badge Requirement 1 */}
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary/10 text-primary border border-outline-variant text-xs font-bold">
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
                Food Recovery &amp; Waste Diversion Portal • Location: {currentUser?.address}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick stats badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container text-xs font-bold text-primary">
              <span className="material-symbols-outlined text-sm text-secondary">star</span>
              <span>{currentUser?.rating || 4.9} ★</span>
              <span className="text-on-surface-variant">•</span>
              <span className="text-secondary">{currentUser?.reliability || 98}% Reliability</span>
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
                  Active Donations
                </span>
                <span className="w-8 h-8 rounded-lg bg-secondary/15 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">local_dining</span>
                </span>
              </div>
              <h3 className="font-display-lg text-2xl text-primary font-bold">
                {activeDonationsCount}
              </h3>
              <p className="text-xs text-secondary font-medium mt-1">↑ 3 posted today</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm hover-lift">
              <div className="flex justify-between items-center mb-2">
                <span className="font-label-md text-xs uppercase text-on-surface-variant">
                  Completed Rescues
                </span>
                <span className="w-8 h-8 rounded-lg bg-receiver-accent/15 text-receiver-accent flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                </span>
              </div>
              <h3 className="font-display-lg text-2xl text-primary font-bold">
                {completedDonationsCount || 154}
              </h3>
              <p className="text-xs text-on-surface-variant mt-1">100% matched within 12m</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm hover-lift">
              <div className="flex justify-between items-center mb-2">
                <span className="font-label-md text-xs uppercase text-on-surface-variant">
                  Meals Shared
                </span>
                <span className="w-8 h-8 rounded-lg bg-waste-accent/15 text-waste-accent flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">restaurant_menu</span>
                </span>
              </div>
              <h3 className="font-display-lg text-2xl text-primary font-bold">
                {totalMealsShared.toLocaleString()}
              </h3>
              <p className="text-xs text-waste-accent font-medium mt-1">Saved from landfill</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm hover-lift">
              <div className="flex justify-between items-center mb-2">
                <span className="font-label-md text-xs uppercase text-on-surface-variant">
                  Waste Diverted
                </span>
                <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">recycling</span>
                </span>
              </div>
              <h3 className="font-display-lg text-2xl text-primary font-bold">3.8 Tons</h3>
              <p className="text-xs text-on-surface-variant mt-1">4.2 Tons CO2 reduction</p>
            </div>
          </div>

          {/* VIEW TAB SWITCHING */}
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* LEFT COLUMN: CREATE POST FORM */}
              <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-outline-variant shadow-sm">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-outline-variant">
                  <h2 className="font-headline-md text-primary font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary">add_circle</span>
                    Create Donation Post
                  </h2>
                </div>

                {/* Toggle: Food vs Organic Waste */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-surface-bright rounded-xl mb-6">
                  <button
                    type="button"
                    onClick={() => setPostType('food')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      postType === 'food'
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">restaurant</span>
                    Food Donation
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostType('organic_waste')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      postType === 'organic_waste'
                        ? 'bg-amber-800 text-white shadow-sm'
                        : 'text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">recycling</span>
                    Organic Waste
                  </button>
                </div>

                <form onSubmit={handleCreatePost} className="space-y-4">
                  <div>
                    <label className="font-label-md text-xs text-on-surface-variant block mb-1">
                      Post Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={
                        postType === 'food'
                          ? 'e.g. 150 Hot Meals - Corporate Event Buffet'
                          : 'e.g. 80 kg Organic Vegetable Peels & Trimmings'
                      }
                      className="w-full rounded-lg border-outline-variant focus:border-secondary text-sm p-3 bg-surface-bright"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-label-md text-xs text-on-surface-variant block mb-1">
                        {postType === 'food' ? 'Quantity (Meals) *' : 'Quantity (kg) *'}
                      </label>
                      <input
                        type="number"
                        required
                        value={quantityMeals}
                        onChange={(e) => setQuantityMeals(Number(e.target.value))}
                        className="w-full rounded-lg border-outline-variant focus:border-secondary text-sm p-3 bg-surface-bright"
                      />
                    </div>
                    <div>
                      <label className="font-label-md text-xs text-on-surface-variant block mb-1">
                        Radius (Miles)
                      </label>
                      <input
                        type="number"
                        value={deliveryRadiusMiles}
                        onChange={(e) => setDeliveryRadiusMiles(Number(e.target.value))}
                        className="w-full rounded-lg border-outline-variant focus:border-secondary text-sm p-3 bg-surface-bright"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-label-md text-xs text-on-surface-variant block mb-1">
                      Description &amp; Packaging
                    </label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g. Kept in thermal containers, ready for immediate transport"
                      className="w-full rounded-lg border-outline-variant focus:border-secondary text-sm p-3 bg-surface-bright"
                    />
                  </div>

                  {postType === 'food' && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-label-md text-xs text-on-surface-variant block mb-1">
                            Prep Time
                          </label>
                          <input
                            type="time"
                            value={prepTime}
                            onChange={(e) => setPrepTime(e.target.value)}
                            className="w-full rounded-lg border-outline-variant focus:border-secondary text-sm p-3 bg-surface-bright"
                          />
                        </div>
                        <div>
                          <label className="font-label-md text-xs text-on-surface-variant block mb-1">
                            Safe Until
                          </label>
                          <input
                            type="datetime-local"
                            value={safeUntil}
                            onChange={(e) => setSafeUntil(e.target.value)}
                            className="w-full rounded-lg border-outline-variant focus:border-secondary text-[11px] p-3 bg-surface-bright"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="font-label-md text-xs text-on-surface-variant block mb-1">
                          Allergens &amp; Dietary
                        </label>
                        <input
                          type="text"
                          value={allergens}
                          onChange={(e) => setAllergens(e.target.value)}
                          placeholder="Nuts, Dairy, Gluten Free, Vegan-Friendly"
                          className="w-full rounded-lg border-outline-variant focus:border-secondary text-sm p-3 bg-surface-bright"
                        />
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-primary text-on-primary font-label-md text-sm py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">rocket_launch</span>
                    <span>Post &amp; Match Instantly</span>
                  </button>
                </form>
              </div>

              {/* RIGHT 2 COLUMNS: SMART MATCHING ENGINE & PARTIAL ALLOCATION */}
              <div className="lg:col-span-2 space-y-8">
                {/* SMART MATCHING ENGINE PANEL */}
                <div className="bg-white p-6 rounded-2xl border border-outline-variant shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-outline-variant">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                        <h2 className="font-headline-md text-primary font-bold">
                          Smart Matching Engine — Top 3 Matches
                        </h2>
                      </div>
                      <p className="font-body-md text-xs text-on-surface-variant mt-0.5">
                        Formula: Distance (40%) • Quantity (25%) • Transport (15%) • Food Type (10%) • Reliability (10%)
                      </p>
                    </div>

                    {/* Post selector dropdown */}
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-on-surface-variant font-bold">Post:</label>
                      <select
                        value={selectedPost?.id}
                        onChange={(e) => setSelectedPostId(e.target.value)}
                        className="text-xs rounded-lg border-outline-variant p-2 bg-surface-bright font-bold text-primary"
                      >
                        {myPosts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title.substring(0, 38)}... ({p.quantityMeals}{' '}
                            {p.type === 'food' ? 'Meals' : 'kg'})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* ACTIVE HIGHLIGHTED POST INFO */}
                  {selectedPost ? (
                    <div>
                      <div className="p-4 rounded-xl bg-secondary-container/20 border border-secondary/30 mb-6 flex flex-wrap justify-between items-center gap-4">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-secondary tracking-widest block">
                            Active Post Under Evaluation
                          </span>
                          <h3 className="font-bold text-primary text-base">{selectedPost.title}</h3>
                          <p className="text-xs text-on-surface-variant">
                            {selectedPost.quantityMeals} {selectedPost.type === 'food' ? 'Meals' : 'kg'} • Radius:{' '}
                            {selectedPost.deliveryRadiusMiles} miles • Status: {selectedPost.status}
                          </p>
                        </div>
                        <button
                          onClick={() => autoAllocatePost(selectedPost.id)}
                          className="px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-sm">splitscreen</span>
                          <span>Auto Allocate Meals</span>
                        </button>
                      </div>

                      {/* TOP 3 MATCHES CARDS */}
                      <div className="space-y-4">
                        {selectedPost.matches?.map((m: MatchResult, index: number) => (
                          <div
                            key={m.receiverId}
                            className="p-4 rounded-xl border border-outline-variant hover:border-secondary bg-surface-bright transition-all flex flex-wrap items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white ${
                                  index === 0
                                    ? 'bg-emerald-600'
                                    : index === 1
                                    ? 'bg-blue-600'
                                    : 'bg-amber-600'
                                }`}
                              >
                                #{index + 1}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-primary text-sm">{m.receiverName}</h4>
                                  <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase">
                                    {m.receiverRole.replace('_', ' ')}
                                  </span>
                                </div>
                                <p className="text-xs text-on-surface-variant mt-0.5">
                                  Distance: {m.distanceMiles} miles • Needs: {m.quantityRequired} • Transport:{' '}
                                  {m.canCollect} • Reliability: {m.reliability}%
                                </p>
                                {m.reasoning && (
                                  <p className="text-xs text-primary-light font-semibold mt-2.5 bg-secondary-container/30 px-3 py-2 rounded-xl border border-secondary/15 flex items-start gap-2 max-w-lg leading-relaxed shadow-sm">
                                    <span className="material-symbols-outlined text-[16px] text-primary mt-0.5">smart_toy</span>
                                    <span>{m.reasoning}</span>
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              {/* Formula breakdown tooltip / badges */}
                              <div className="hidden xl:flex items-center gap-2 text-[10px] bg-white px-3 py-1 rounded-lg border border-outline-variant">
                                <span>Dist: <strong>{m.breakdown.distanceScore}</strong>/40</span>
                                <span>Qty: <strong>{m.breakdown.quantityMatch}</strong>/25</span>
                                <span>Trans: <strong>{m.breakdown.transportCompatibility}</strong>/15</span>
                                <span>Food: <strong>{m.breakdown.foodTypeMatch}</strong>/10</span>
                                <span>Rel: <strong>{m.breakdown.reliabilityScore}</strong>/10</span>
                              </div>

                              <div className="text-right">
                                <span className="text-xs text-on-surface-variant block">Match Score</span>
                                <span className="font-display-lg text-lg text-emerald-700 font-bold">
                                  {m.matchPercentage}%
                                </span>
                              </div>

                              <button
                                onClick={() => {
                                  updatePostStatus(selectedPost.id, 'Matched');
                                }}
                                className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:opacity-90 transition-all"
                              >
                                Select Partner
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* PARTIAL ALLOCATION VISUAL FLOWCHART */}
                      {selectedPost.allocations && selectedPost.allocations.length > 0 && (
                        <div className="mt-8 pt-6 border-t border-outline-variant">
                          <h3 className="font-headline-md text-sm text-primary font-bold mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-secondary">alt_route</span>
                            Partial Allocation Distribution Plan (Auto-Split)
                          </h3>
                          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant">
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="p-3 rounded-lg bg-primary text-white text-center">
                                <span className="text-[10px] uppercase block opacity-80">Total Post</span>
                                <span className="font-bold text-sm">
                                  {selectedPost.quantityMeals} Meals
                                </span>
                              </div>

                              {selectedPost.allocations.map((step, idx) => (
                                <React.Fragment key={step.receiverId}>
                                  <span className="material-symbols-outlined text-on-surface-variant">
                                    arrow_forward
                                  </span>
                                  <div className="p-3 rounded-lg bg-white border border-outline-variant text-center shadow-sm">
                                    <span className="text-[10px] text-secondary font-bold uppercase block">
                                      {step.receiverName} ({step.matchScore}%)
                                    </span>
                                    <span className="font-bold text-sm text-primary">
                                      +{step.allocated} Meals
                                    </span>
                                    <span className="text-[10px] text-on-surface-variant block">
                                      Remaining: {step.remainingAfter}
                                    </span>
                                  </div>
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-on-surface-variant">No active post selected.</p>
                  )}
                </div>

                {/* POST STATUS TRACKING WORKFLOW */}
                <div className="bg-white p-6 rounded-2xl border border-outline-variant shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-headline-md text-primary font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary">local_shipping</span>
                      Donation Lifecycle Workflow &amp; Status Tracker
                    </h2>
                  </div>
                  <p className="text-xs text-on-surface-variant mb-6">
                    Real-time status progression from posting to verified collection.
                  </p>

                  <div className="space-y-4">
                    {myPosts.slice(0, 3).map((post) => (
                      <div
                        key={post.id}
                        className="p-4 rounded-xl border border-outline-variant bg-surface-bright flex flex-wrap items-center justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-primary text-sm">{post.title}</h4>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                post.status === 'Completed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : post.status === 'Collected'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {post.status}
                            </span>
                          </div>
                          <p className="text-xs text-on-surface-variant mt-1">
                            {post.quantityMeals} {post.type === 'food' ? 'Meals' : 'kg'} • Created:{' '}
                            {new Date(post.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        {/* STEPPER BUTTONS */}
                        <div className="flex flex-wrap items-center gap-2">
                          {(['Posted', 'Matched', 'Accepted', 'Collected', 'Completed'] as DonationStatus[]).map(
                            (st) => (
                              <button
                                key={st}
                                onClick={() => handleStatusStep(post, st)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                  post.status === st
                                    ? 'bg-primary text-white shadow-sm ring-2 ring-secondary'
                                    : 'bg-white border border-outline-variant text-on-surface-variant hover:border-primary'
                                }`}
                              >
                                {st}
                              </button>
                            )
                          )}

                          {/* Rate partner button when completed */}
                          {post.status === 'Completed' && (
                            <button
                              onClick={() => {
                                setRatingTarget({
                                  toUserId: post.assignedReceiverId || 'receiver-1',
                                  toUserName: post.assignedReceiverName || 'Hope Foundation',
                                  donationId: post.id,
                                  donationTitle: post.title,
                                });
                                setRatingModalOpen(true);
                              }}
                              className="px-3 py-1 rounded-lg bg-secondary-container text-on-secondary-container text-xs font-bold hover:scale-105 transition-all flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-sm">star</span>
                              <span>Rate Partner</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: ALL POSTS TAB */}
          {activeTab === 'posts' && (
            <div className="bg-white p-6 rounded-2xl border border-outline-variant shadow-sm">
              <h2 className="font-headline-md text-primary font-bold mb-6">
                All My Donations &amp; Waste Posts ({myPosts.length})
              </h2>
              <div className="space-y-4">
                {myPosts.map((post) => (
                  <div
                    key={post.id}
                    className="p-5 rounded-xl border border-outline-variant bg-surface-bright flex flex-wrap items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-3 h-3 rounded-full ${
                            post.status === 'Completed'
                              ? 'bg-emerald-500'
                              : post.status === 'Accepted'
                              ? 'bg-blue-500'
                              : 'bg-amber-500'
                          }`}
                        ></span>
                        <h4 className="font-bold text-primary text-base">{post.title}</h4>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-surface-container">
                          {post.status}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1">{post.description}</p>
                      <p className="text-[11px] text-outline mt-1">
                        Quantity: {post.quantityMeals} {post.type === 'food' ? 'Meals' : 'kg'} • Safe until:{' '}
                        {new Date(post.safeUntil).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setSelectedPostId(post.id);
                          setActiveTab('dashboard');
                        }}
                        className="px-4 py-2 rounded-lg border border-outline-variant text-xs font-bold hover:bg-surface-container-low"
                      >
                        View Matches ({post.matches?.length || 3})
                      </button>
                      <button
                        onClick={() => autoAllocatePost(post.id)}
                        className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:opacity-90"
                      >
                        Auto Allocate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW: REQUESTS TAB */}
          {activeTab === 'requests' && (
            <div className="bg-white p-6 rounded-2xl border border-outline-variant shadow-sm">
              <h2 className="font-headline-md text-primary font-bold mb-6">
                Active NGO Receiver Requests ({requests.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="p-5 rounded-xl border border-outline-variant bg-surface-bright hover-lift"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-primary text-base">{req.receiverName}</h4>
                        <p className="text-xs text-on-surface-variant">{req.locationAddress}</p>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                          req.urgency === 'Immediate'
                            ? 'bg-error-container text-on-error-container animate-pulse'
                            : 'bg-secondary-container text-on-secondary-container'
                        }`}
                      >
                        {req.urgency} Urgency
                      </span>
                    </div>

                    <div className="py-2 border-y border-outline-variant/50 my-3 text-xs space-y-1">
                      <p>
                        <strong>Meals Required:</strong> {req.mealsRequired} meals
                      </p>
                      <p>
                        <strong>Dietary Notes:</strong> {req.dietaryNotes.join(', ')}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setActiveTab('dashboard');
                      }}
                      className="w-full py-2 rounded-lg bg-primary text-white text-xs font-bold hover:opacity-90 transition-all"
                    >
                      Match with My Active Post
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW: PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="bg-white p-8 rounded-2xl border border-outline-variant shadow-sm max-w-3xl">
              <h2 className="font-headline-md text-primary font-bold mb-6">
                Organization Profile &amp; Verification Details
              </h2>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                  <span
                    className="material-symbols-outlined text-emerald-700 text-3xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    verified
                  </span>
                  <div>
                    <h3 className="font-bold text-emerald-900">
                      Zero Waste Verified Partner (Verified = True)
                    </h3>
                    <p className="text-xs text-emerald-700">
                      Automated verification badge active per requirement #1. Government certificate
                      uploaded &amp; approved.
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
                    <strong className="text-primary">{currentUser?.contactPerson || 'Marcus Vance'}</strong>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-bright border border-outline-variant">
                    <span className="text-xs text-on-surface-variant block">FSSAI License</span>
                    <strong className="text-primary">{currentUser?.fssai || '11523004000188'}</strong>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-bright border border-outline-variant">
                    <span className="text-xs text-on-surface-variant block">GSTIN</span>
                    <strong className="text-primary">{currentUser?.gstin || '07AABCU9603R1Z2'}</strong>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-bright border border-outline-variant">
                    <span className="text-xs text-on-surface-variant block">Average Rating</span>
                    <strong className="text-amber-600">{currentUser?.rating || 4.9} / 5.0 ★</strong>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-bright border border-outline-variant">
                    <span className="text-xs text-on-surface-variant block">Reliability Score</span>
                    <strong className="text-emerald-700">{currentUser?.reliability || 98}%</strong>
                  </div>
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
