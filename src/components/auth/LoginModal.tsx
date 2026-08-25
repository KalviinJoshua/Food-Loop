import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { users, loginByEmail, loginUserByRole, setActiveView } = useApp();
  const [emailInput, setEmailInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!emailInput.trim()) {
      setErrorMsg('Please enter an email address.');
      return;
    }
    const success = loginByEmail(emailInput.trim());
    if (success) {
      onClose();
    } else {
      setErrorMsg('User email not found. You can use Quick Demo buttons below or register an account!');
    }
  };

  const handleDemoLogin = (role: UserRole) => {
    loginUserByRole(role);
    onClose();
  };

  const handleGoToRegister = () => {
    onClose();
    setActiveView('register');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-outline-variant w-full max-w-md p-8 relative mx-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-on-surface-variant hover:text-primary p-2 rounded-full hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary-fixed-dim/30 text-primary flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-3xl">login</span>
          </div>
          <h2 className="font-headline-lg text-headline-md text-primary">Login to FoodBridge</h2>
          <p className="font-body-md text-sm text-on-surface-variant mt-1">
            Access your Donor, Receiver, or Waste Processor dashboard
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-error-container text-on-error-container text-xs font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-error text-base">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1-Click Quick Demo Login Box for Hackathon Judges */}
        <div className="mb-6 p-4 rounded-xl bg-surface-bright border border-outline-variant">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-label-md uppercase tracking-wider text-primary font-bold">
              ⚡ Hackathon 1-Click Demo Login
            </span>
            <span className="text-[10px] bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full font-bold">
              Instant
            </span>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => handleDemoLogin('donor')}
              className="w-full px-3 py-2.5 rounded-lg bg-white border border-outline-variant hover:border-secondary hover:bg-secondary-container/10 flex items-center justify-between text-left transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                  <span className="material-symbols-outlined text-base">restaurant</span>
                </span>
                <div>
                  <p className="font-label-md text-sm text-primary font-bold">Donor Dashboard</p>
                  <p className="text-xs text-on-surface-variant">Green Bistro (Restaurant)</p>
                </div>
              </div>
              <span className="text-xs text-secondary font-bold group-hover:translate-x-1 transition-transform">
                Login →
              </span>
            </button>

            <button
              onClick={() => handleDemoLogin('receiver')}
              className="w-full px-3 py-2.5 rounded-lg bg-white border border-outline-variant hover:border-secondary hover:bg-secondary-container/10 flex items-center justify-between text-left transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm">
                  <span className="material-symbols-outlined text-base">volunteer_activism</span>
                </span>
                <div>
                  <p className="font-label-md text-sm text-primary font-bold">Receiver Dashboard</p>
                  <p className="text-xs text-on-surface-variant">Hope Foundation (NGO/Orphanage)</p>
                </div>
              </div>
              <span className="text-xs text-secondary font-bold group-hover:translate-x-1 transition-transform">
                Login →
              </span>
            </button>

            <button
              onClick={() => handleDemoLogin('waste_processor')}
              className="w-full px-3 py-2.5 rounded-lg bg-white border border-outline-variant hover:border-secondary hover:bg-secondary-container/10 flex items-center justify-between text-left transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-sm">
                  <span className="material-symbols-outlined text-base">recycling</span>
                </span>
                <div>
                  <p className="font-label-md text-sm text-primary font-bold">Waste Processor Dashboard</p>
                  <p className="text-xs text-on-surface-variant">EcoCompost Facility (Biogas/Compost)</p>
                </div>
              </div>
              <span className="text-xs text-secondary font-bold group-hover:translate-x-1 transition-transform">
                Login →
              </span>
            </button>
          </div>
        </div>

        {/* Standard Email Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="font-label-md text-xs text-on-surface-variant">
              Or Login by Registered Email
            </label>
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="e.g. contact@greenbistro.com"
              className="w-full rounded-lg border-outline-variant focus:border-secondary focus:ring-secondary text-sm p-3 bg-surface-bright"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-on-primary font-label-md text-sm py-3 rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-md"
          >
            Sign In with Email
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-outline-variant text-center">
          <p className="text-xs text-on-surface-variant">
            Don&apos;t have an account yet?{' '}
            <button
              onClick={handleGoToRegister}
              className="text-secondary font-bold hover:underline"
            >
              Register Account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
