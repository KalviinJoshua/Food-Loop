import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { NotificationCenter } from '../notifications/NotificationCenter';

interface TopNavBarProps {
  onOpenLogin: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({ onOpenLogin }) => {
  const { currentUser, activeView, setActiveView, loginUserByRole, logout } = useApp();
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  const handleNavClick = (view: 'landing' | 'register' | 'login' | 'dashboard' | 'map') => {
    setActiveView(view);
  };

  const handleQuickSwitch = (role: UserRole) => {
    loginUserByRole(role);
    setShowDemoMenu(false);
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-surface/95 backdrop-blur-md border-b border-outline-variant shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-container-padding py-4 flex justify-between items-center">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleNavClick('landing')}
            className="flex items-center gap-2 text-left focus:outline-none group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-md group-hover:bg-secondary transition-colors">
              <span className="material-symbols-outlined text-2xl">recycling</span>
            </div>
            <div>
              <span className="font-headline-md text-headline-md font-bold text-primary block leading-none">
                FoodBridge
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-secondary block mt-0.5">
                Zero Waste Ecosystem
              </span>
            </div>
          </button>

          {/* Quick Demo Role Switcher Badge */}
          <div className="relative ml-4 hidden lg:block">
            <button
              onClick={() => setShowDemoMenu(!showDemoMenu)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-low border border-outline-variant text-xs font-label-md text-on-surface-variant hover:border-secondary hover:text-primary transition-all"
              title="Switch demo role instantly"
            >
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              <span>
                Role: <strong className="text-primary uppercase">{currentUser?.role || 'Guest'}</strong> ({currentUser?.name || 'Not logged in'})
              </span>
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </button>

            {showDemoMenu && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-stripe border border-outline-variant p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <p className="text-[11px] font-bold text-on-surface-variant px-3 py-1.5 uppercase tracking-wider">
                  Quick Demo Switcher
                </p>
                <button
                  onClick={() => handleQuickSwitch('donor')}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-secondary-container/30 flex items-center justify-between text-sm transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                    <span className="font-medium">Donor (Green Bistro)</span>
                  </div>
                  <span className="text-xs text-on-surface-variant">Restaurant</span>
                </button>
                <button
                  onClick={() => handleQuickSwitch('receiver')}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-secondary-container/30 flex items-center justify-between text-sm transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-receiver-accent"></span>
                    <span className="font-medium">Receiver (Hope Foundation)</span>
                  </div>
                  <span className="text-xs text-on-surface-variant">NGO / Shelter</span>
                </button>
                <button
                  onClick={() => handleQuickSwitch('waste_processor')}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-secondary-container/30 flex items-center justify-between text-sm transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-waste-accent"></span>
                    <span className="font-medium">Waste Processor (EcoCompost)</span>
                  </div>
                  <span className="text-xs text-on-surface-variant">Biogas / Compost</span>
                </button>
                <button
                  onClick={() => handleQuickSwitch('admin')}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-secondary-container/30 flex items-center justify-between text-sm transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                    <span className="font-medium">Admin (FoodBridge)</span>
                  </div>
                  <span className="text-xs text-on-surface-variant">Console</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-8">
          <button
            onClick={() => handleNavClick('landing')}
            className={`font-body-md text-body-md font-bold transition-all ${
              activeView === 'landing'
                ? 'text-secondary border-b-2 border-secondary pb-1'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Impact
          </button>
          <button
            onClick={() => handleNavClick('map')}
            className={`font-body-md text-body-md font-bold transition-all ${
              activeView === 'map'
                ? 'text-secondary border-b-2 border-secondary pb-1'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Interactive Map
          </button>
          <button
            onClick={() => handleNavClick('dashboard')}
            className={`font-body-md text-body-md font-bold transition-all ${
              activeView === 'dashboard'
                ? 'text-secondary border-b-2 border-secondary pb-1'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Dashboard
          </button>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <>
              <NotificationCenter />
              <button
                onClick={() => handleNavClick('dashboard')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 font-label-md text-label-md text-primary hover:text-secondary transition-all"
                title="Go to my dashboard"
              >
                <span className="material-symbols-outlined text-lg">dashboard</span>
              </button>
              <button
                onClick={() => logout()}
                className="px-4 py-2 font-label-md text-label-md text-secondary border border-outline-variant rounded-lg hover:border-secondary hover:bg-surface-container-low transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">logout</span>
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onOpenLogin}
                className="px-4 py-2 font-label-md text-label-md text-secondary hover:underline transition-all"
              >
                Login
              </button>
              <button
                onClick={() => handleNavClick('register')}
                className="px-6 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:opacity-90 active:scale-95 transition-all shadow-sm"
              >
                Register
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
