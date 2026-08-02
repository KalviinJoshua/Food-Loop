import React from 'react';
import { useApp } from '../../context/AppContext';

export const LandingPage: React.FC = () => {
  const { setActiveView } = useApp();

  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-section-gap px-container-padding hero-gradient">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="z-10">
            <span className="inline-block px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container font-label-md text-label-md mb-6">
              Sustainability Focused
            </span>
            <h1 className="font-display-lg text-display-lg text-primary mb-6 leading-tight">
              Recovering Food,<br />Restoring Hope.
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-10 max-w-lg">
              Connecting surplus food sources with community organizations in real-time. Together, we can eliminate waste and feed millions.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setActiveView('register')}
                className="px-8 py-4 bg-primary text-on-primary rounded-xl font-label-md text-label-md shadow-lg hover:bg-opacity-90 transition-all flex items-center gap-2"
              >
                Get Started
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
              <button
                onClick={() => setActiveView('map')}
                className="px-8 py-4 bg-surface border border-outline-variant text-primary rounded-xl font-label-md text-label-md hover:bg-surface-container-low transition-all"
              >
                View Impact Map
              </button>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-3xl overflow-hidden shadow-2xl border border-white/20 aspect-[4/3] relative">
              <img
                className="w-full h-full object-cover"
                alt="A clean, high-quality digital illustration of a lush, green urban ecosystem where local markets, community centers, and delivery vans are connected by glowing green lines."
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA5B_wl01NlCnsqZk1cOVX77-N-faPczUPUFXCBybH_0_P-0jMR6yUYrGnGJrzE2Rdzqm0DVs9zuRtqmTq1jJ7mhm8PDsDBkj_Di1y_hdfLKkU_U9LNdD5HMrl9lyChsVIXablcXCyY2m8R_XUI55hCWFPaI6kR6Vt91qDnlJblZOr2u0qSTchqOa6U0OAxEfjxWMIa93CRSKwJHkSA3BFWsIuEOr6MR7WIIc_plj1Vgs13rI3-TqOn"
              />
              <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-outline-variant flex items-center gap-4">
                <div className="w-12 h-12 bg-secondary-container rounded-full flex items-center justify-center text-on-secondary-container">
                  <span className="material-symbols-outlined">volunteer_activism</span>
                </div>
                <div>
                  <p className="font-label-md text-label-md text-primary">Live Match Found</p>
                  <p className="text-xs text-on-surface-variant">Central Kitchen -&gt; Unity Shelter</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-container-padding bg-surface-bright">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant shadow-sm hover-lift text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-primary text-3xl">restaurant</span>
              </div>
              <h3 className="font-display-lg text-display-lg text-primary mb-2">1.2M</h3>
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Meals Saved</p>
            </div>
            <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant shadow-sm hover-lift text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-primary text-3xl">recycling</span>
              </div>
              <h3 className="font-display-lg text-display-lg text-primary mb-2">450</h3>
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Tons Waste Reduced</p>
            </div>
            <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant shadow-sm hover-lift text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-primary text-3xl">hub</span>
              </div>
              <h3 className="font-display-lg text-display-lg text-primary mb-2">850+</h3>
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Organizations Connected</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-section-gap px-container-padding bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-headline-lg text-headline-lg text-primary mb-4">How FoodLoop Works</h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mx-auto">
              A seamless orchestration of technology and community action to ensure no edible food goes to waste.
            </p>
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Connector line for desktop */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-outline-variant -translate-y-1/2 z-0"></div>
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-secondary-container rounded-full flex items-center justify-center mb-8 border-4 border-surface shadow-lg">
                <span className="material-symbols-outlined text-on-secondary-container text-3xl">add_business</span>
              </div>
              <h4 className="font-headline-md text-headline-md text-primary mb-4">Donate</h4>
              <p className="font-body-md text-body-md text-on-surface-variant px-4">
                Businesses list surplus food in seconds via our intuitive mobile app or portal.
              </p>
            </div>
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mb-8 border-4 border-surface shadow-lg">
                <span className="material-symbols-outlined text-on-primary text-3xl">bolt</span>
              </div>
              <h4 className="font-headline-md text-headline-md text-primary mb-4">Match</h4>
              <p className="font-body-md text-body-md text-on-surface-variant px-4">
                Our AI instantly identifies nearby non-profits based on need, capacity, and urgency.
              </p>
            </div>
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-secondary-container rounded-full flex items-center justify-center mb-8 border-4 border-surface shadow-lg">
                <span className="material-symbols-outlined text-on-secondary-container text-3xl">route</span>
              </div>
              <h4 className="font-headline-md text-headline-md text-primary mb-4">Track</h4>
              <p className="font-body-md text-body-md text-on-surface-variant px-4">
                Real-time GPS tracking and impact reports ensure transparency from pickup to delivery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="py-section-gap px-container-padding bg-surface-bright">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h2 className="font-headline-lg text-headline-lg text-primary mb-2">Designed for Efficiency</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Advanced features tailored for large-scale recovery logistics.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 grid-rows-2 gap-gutter h-auto md:h-[600px]">
            <div className="md:col-span-2 md:row-span-1 bg-primary-container p-8 rounded-3xl flex flex-col justify-between relative overflow-hidden group">
              <div className="z-10">
                <div className="w-12 h-12 bg-on-primary-container/20 rounded-xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-on-primary-container">psychology</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-white mb-4">Smart Matching Engine</h3>
                <p className="font-body-md text-body-md text-on-primary-container max-w-md">
                  Our proprietary algorithm factors in traffic, food shelf-life, and recipient dietary needs to optimize every rescue mission.
                </p>
              </div>
              <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <span className="material-symbols-outlined text-[200px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  hub
                </span>
              </div>
            </div>
            <div className="md:col-span-1 md:row-span-2 bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant flex flex-col justify-between hover-lift">
              <div>
                <div className="w-12 h-12 bg-secondary-container rounded-xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-on-secondary-container">splitscreen</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-primary mb-4">Partial Allocation</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Don&apos;t have enough for one big drop? Our system automatically splits large donations across multiple small centers for maximum impact.
                </p>
              </div>
              <div className="mt-8 rounded-xl overflow-hidden border border-outline-variant">
                <img
                  className="w-full"
                  alt="Partial allocation illustration UI dashboard"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC4_G8WR4kTwxUyue9HlXLYC9SGQ97IaVDs-nMwfV-67sgWagNATpnmPFp5uYFAiYFSVLcW6NjU38gjlY558RwyJsnpJniGbPkXixPcFdHQG2ww4ponCeUNIRNRUjF6NHlu-PGgLmXXMAyU40ZYopGkAkGEm1lnxHEmdCHdQe_hi3ij2-jpuVoP5JrtDwKORO7P3rcEwQVAk00aNHkot_PaK7Rh138sJfZ63X_ZKWKE3qWkDgt3_B90"
                />
              </div>
            </div>
            <div className="md:col-span-2 md:row-span-1 bg-secondary-container p-8 rounded-3xl flex flex-col justify-between relative overflow-hidden group">
              <div className="z-10">
                <div className="w-12 h-12 bg-white/40 rounded-xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-primary">eco</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-primary mb-4">Waste Diversion</h3>
                <p className="font-body-md text-body-md text-on-secondary-fixed-variant max-w-md">
                  Comprehensive tracking of CO2 emission savings and water recovery, giving your ESG reports the hard data they need.
                </p>
              </div>
              <div className="absolute top-8 right-8">
                <div className="px-4 py-2 bg-white rounded-full text-secondary font-bold text-lg shadow-sm">
                  98% Efficiency
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-section-gap px-container-padding">
        <div className="max-w-5xl mx-auto bg-primary rounded-[40px] p-12 md:p-20 text-center text-on-primary relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-secondary rounded-full blur-[100px]"></div>
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-secondary rounded-full blur-[100px]"></div>
          </div>
          <div className="relative z-10">
            <h2 className="font-display-lg text-display-lg mb-6">Join the Loop Today</h2>
            <p className="font-body-lg text-body-lg text-on-primary-container mb-12 max-w-2xl mx-auto opacity-90">
              Whether you&apos;re a grocery chain, a local cafe, or a community volunteer, there&apos;s a place for you in the food recovery revolution.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setActiveView('register')}
                className="px-10 py-5 bg-secondary-container text-on-secondary-container rounded-2xl font-headline-md text-label-md hover:scale-105 transition-all shadow-xl"
              >
                Partner With Us
              </button>
              <button
                onClick={() => setActiveView('dashboard')}
                className="px-10 py-5 bg-transparent border-2 border-on-primary-container text-white rounded-2xl font-headline-md text-label-md hover:bg-white/10 transition-all"
              >
                Open Demo Dashboard
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
