import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { getAllocationSummary } from '../../utils/foodSafety';

// --- Admin dashboard ---------------------------------------------------------
// Role-gated control panel: system stats, user verification, and live
// monitoring. All figures are computed from the existing frontend state
// (users / posts) — nothing is faked and no DB is touched. A hard role guard
// prevents any non-admin user from ever seeing this view.

const ROLE_LABEL: Record<UserRole, string> = {
  donor: 'Donor',
  receiver: 'Receiver',
  waste_processor: 'Waste Processor',
  admin: 'Admin',
};

const ROLE_CHIP: Record<UserRole, string> = {
  donor: 'bg-emerald-100 text-emerald-800',
  receiver: 'bg-blue-100 text-blue-800',
  waste_processor: 'bg-amber-100 text-amber-900',
  admin: 'bg-purple-100 text-purple-800',
};

export const AdminDashboard: React.FC = () => {
  const { currentUser, users, posts, setActiveView, setUserVerification, resetDemoData } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'users'>('overview');
  const [roleFilter, setRoleFilter] = useState<'all' | 'pending'>('all');

  // --- Hard role guard -------------------------------------------------------
  // Anything other than an admin is refused access, even if it somehow routes
  // here. Normal users can never reach the admin surface.
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-surface-bright flex items-center justify-center p-6 pt-24">
        <div className="max-w-md w-full bg-white rounded-2xl border border-outline-variant shadow-sm p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-error-container text-error flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl">lock</span>
          </div>
          <h1 className="font-headline-md text-primary font-bold mb-2">Admin access only</h1>
          <p className="text-sm text-on-surface-variant mb-6">
            You need an administrator account to view this page. Your current role
            {currentUser ? ` (${ROLE_LABEL[currentUser.role]})` : ''} isn&apos;t authorized.
          </p>
          <button
            onClick={() => setActiveView('dashboard')}
            className="px-5 py-2.5 rounded-lg bg-primary text-on-primary text-sm font-label-md font-bold hover:opacity-90 active:scale-95 transition-all shadow-sm"
          >
            Back to my dashboard
          </button>
        </div>
      </div>
    );
  }

  // --- Live system stats (derived from state) --------------------------------
  const ACTIVE_STATUSES = ['Posted', 'Matched', 'Accepted', 'Collected'];
  const foodPosts = posts.filter((p) => p.type === 'food');
  const wastePosts = posts.filter((p) => p.type === 'organic_waste');

  const totalUsers = users.length;
  const activeDonations = posts.filter((p) => ACTIVE_STATUSES.includes(p.status)).length;
  const mealsRescued = foodPosts.reduce((sum, p) => sum + getAllocationSummary(p).allocated, 0);
  const expiredDonations = posts.filter((p) => p.status === 'Expired').length;
  // Waste tonnage uses the same kg→US-ton conversion as the processor dashboard.
  const wasteRecoveredTons = wastePosts.reduce((sum, p) => sum + (p.quantityMeals * 2.2) / 2000, 0);

  const verifiedCount = users.filter((u) => u.verified).length;
  const pendingCount = users.filter((u) => !u.verified).length;

  const roleCounts: Record<UserRole, number> = {
    donor: users.filter((u) => u.role === 'donor').length,
    receiver: users.filter((u) => u.role === 'receiver').length,
    waste_processor: users.filter((u) => u.role === 'waste_processor').length,
    admin: users.filter((u) => u.role === 'admin').length,
  };

  // Manageable users (never list the admins themselves for verification).
  const manageableUsers = users
    .filter((u) => u.role !== 'admin')
    .filter((u) => (roleFilter === 'pending' ? !u.verified : true));

  const recentPosts = [...posts]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 8);

  const statusChip = (status: string): string => {
    switch (status) {
      case 'Expired':
        return 'bg-gray-200 text-gray-700';
      case 'Completed':
        return 'bg-emerald-100 text-emerald-800';
      case 'Collected':
      case 'Accepted':
        return 'bg-blue-100 text-blue-800';
      case 'Matched':
        return 'bg-secondary-container text-on-secondary-container';
      default:
        return 'bg-amber-100 text-amber-900';
    }
  };

  const stats = [
    { label: 'Total Users', value: totalUsers.toLocaleString(), icon: 'group', tint: 'bg-secondary/15 text-primary', note: `${verifiedCount} verified • ${pendingCount} pending` },
    { label: 'Active Donations', value: activeDonations.toLocaleString(), icon: 'volunteer_activism', tint: 'bg-emerald-100 text-emerald-700', note: `${posts.length} total posts` },
    { label: 'Meals Rescued', value: mealsRescued.toLocaleString(), icon: 'restaurant', tint: 'bg-receiver-accent/15 text-receiver-accent', note: 'Allocated to receivers' },
    { label: 'Expired Donations', value: expiredDonations.toLocaleString(), icon: 'timer_off', tint: 'bg-gray-200 text-gray-600', note: 'Routed to waste mgmt' },
    { label: 'Waste Recovered', value: `${wasteRecoveredTons.toFixed(1)} t`, icon: 'recycling', tint: 'bg-waste-accent/15 text-waste-accent', note: 'Compost / biogas' },
  ];

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
              <span className="text-[10px] uppercase tracking-wider text-purple-700 font-bold block mt-0.5">
                Administrator
              </span>
            </div>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'overview'
                  ? 'bg-secondary-container/50 text-primary'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              <span className="material-symbols-outlined">monitoring</span>
              <span>Overview &amp; Monitoring</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'users'
                  ? 'bg-secondary-container/50 text-primary'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined">verified_user</span>
                <span>User Verification</span>
              </div>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveView('map')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-on-surface-variant hover:bg-surface-container-low transition-all"
            >
              <span className="material-symbols-outlined text-secondary">map</span>
              <span>Interactive Map</span>
            </button>
          </nav>
        </div>

        <div className="p-6 border-t border-outline-variant">
          <button
            onClick={resetDemoData}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-surface text-on-surface-variant border border-outline-variant text-xs font-bold hover:text-error hover:border-error/40 transition-all"
          >
            <span className="material-symbols-outlined text-sm">restart_alt</span>
            Reset demo data
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 pt-20 md:pt-0">
        {/* Header */}
        <header className="bg-white border-b border-outline-variant px-8 py-5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-headline-md text-primary font-bold">
                Admin Console
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 text-xs font-bold">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                  shield_person
                </span>
                {currentUser.name}
              </span>
            </div>
            <p className="font-body-md text-sm text-on-surface-variant">
              Platform monitoring, verification &amp; system stats • figures computed live from session data
            </p>
          </div>
        </header>

        {/* Body */}
        <div className="p-8 max-w-7xl mx-auto space-y-8">
          {/* STATS GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-white p-5 rounded-xl border border-outline-variant shadow-sm hover-lift">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-label-md text-[11px] uppercase text-on-surface-variant leading-tight">
                    {s.label}
                  </span>
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.tint}`}>
                    <span className="material-symbols-outlined text-lg">{s.icon}</span>
                  </span>
                </div>
                <h3 className="font-display-lg text-2xl text-primary font-bold">{s.value}</h3>
                <p className="text-[11px] text-on-surface-variant mt-1">{s.note}</p>
              </div>
            ))}
          </div>

          {activeTab === 'overview' && (
            <>
              {/* ROLE BREAKDOWN */}
              <div className="bg-white p-6 rounded-2xl border border-outline-variant shadow-sm">
                <h2 className="font-headline-md text-primary font-bold mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">diversity_3</span>
                  User Base by Role
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {(Object.keys(roleCounts) as UserRole[]).map((role) => (
                    <div key={role} className="p-4 rounded-xl bg-surface-bright border border-outline-variant">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase mb-2 ${ROLE_CHIP[role]}`}>
                        {ROLE_LABEL[role]}
                      </span>
                      <p className="font-display-lg text-xl text-primary font-bold">{roleCounts[role]}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* SYSTEM MONITORING: recent donations */}
              <div className="bg-white p-6 rounded-2xl border border-outline-variant shadow-sm">
                <h2 className="font-headline-md text-primary font-bold mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">monitor_heart</span>
                  Recent Donation Activity
                </h2>
                {recentPosts.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">No donations posted yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-[11px] uppercase tracking-wider text-on-surface-variant border-b border-outline-variant">
                          <th className="py-2 pr-4 font-bold">Donation</th>
                          <th className="py-2 pr-4 font-bold">Donor</th>
                          <th className="py-2 pr-4 font-bold">Type</th>
                          <th className="py-2 pr-4 font-bold">Qty</th>
                          <th className="py-2 pr-4 font-bold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentPosts.map((p) => (
                          <tr key={p.id} className="border-b border-outline-variant/50 last:border-b-0">
                            <td className="py-2.5 pr-4 font-medium text-primary">{p.title}</td>
                            <td className="py-2.5 pr-4 text-on-surface-variant">{p.donorName}</td>
                            <td className="py-2.5 pr-4 text-on-surface-variant capitalize">
                              {p.type === 'organic_waste' ? 'Organic waste' : 'Food'}
                            </td>
                            <td className="py-2.5 pr-4 text-on-surface-variant">
                              {p.quantityMeals}
                              {p.type === 'organic_waste' ? ' kg' : ' meals'}
                            </td>
                            <td className="py-2.5 pr-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusChip(p.status)}`}>
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'users' && (
            <div className="bg-white p-6 rounded-2xl border border-outline-variant shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-outline-variant">
                <div>
                  <h2 className="font-headline-md text-primary font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary">verified_user</span>
                    User Verification
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Approve or revoke platform verification. Changes persist in session state (no DB write).
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-surface-container-low rounded-lg p-1">
                  <button
                    onClick={() => setRoleFilter('all')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                      roleFilter === 'all' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant'
                    }`}
                  >
                    All ({users.filter((u) => u.role !== 'admin').length})
                  </button>
                  <button
                    onClick={() => setRoleFilter('pending')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                      roleFilter === 'pending' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant'
                    }`}
                  >
                    Pending ({pendingCount})
                  </button>
                </div>
              </div>

              {manageableUsers.length === 0 ? (
                <p className="text-sm text-on-surface-variant py-6 text-center">
                  {roleFilter === 'pending' ? 'No users awaiting verification. 🎉' : 'No users found.'}
                </p>
              ) : (
                <div className="space-y-2">
                  {manageableUsers.map((u) => (
                    <div
                      key={u.id}
                      className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-outline-variant bg-surface-bright"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="shrink-0 w-9 h-9 rounded-lg bg-surface-container-high text-on-surface-variant flex items-center justify-center font-bold text-sm">
                          {u.name.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-primary text-sm truncate">{u.name}</p>
                            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${ROLE_CHIP[u.role]}`}>
                              {ROLE_LABEL[u.role]}
                            </span>
                          </div>
                          <p className="text-xs text-on-surface-variant truncate">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {u.verified ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                              verified
                            </span>
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold">
                            <span className="material-symbols-outlined text-sm">pending</span>
                            Pending
                          </span>
                        )}
                        <button
                          onClick={() => setUserVerification(u.id, !u.verified)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                            u.verified
                              ? 'bg-surface text-error border border-error/30 hover:bg-error-container/40'
                              : 'bg-primary text-on-primary hover:opacity-90'
                          }`}
                        >
                          {u.verified ? 'Revoke' : 'Verify'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
