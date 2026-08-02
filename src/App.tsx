import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { TopNavBar } from './components/navbar/TopNavBar';
import { Footer } from './components/footer/Footer';
import { LandingPage } from './components/landing/LandingPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { LoginModal } from './components/auth/LoginModal';
import { DonorDashboard } from './components/dashboard/DonorDashboard';
import { ReceiverDashboard } from './components/dashboard/ReceiverDashboard';
import { WasteProcessorDashboard } from './components/dashboard/WasteProcessorDashboard';
import { MapView } from './components/map/MapView';
import { AIAdvisorWidget } from './components/ai/AIAdvisorWidget';

function AppContent() {
  const { activeView, currentUser } = useApp();
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const renderDashboard = () => {
    if (!currentUser || currentUser.role === 'donor') {
      return <DonorDashboard />;
    }
    if (currentUser.role === 'receiver') {
      return <ReceiverDashboard />;
    }
    if (currentUser.role === 'waste_processor') {
      return <WasteProcessorDashboard />;
    }
    return <DonorDashboard />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      <TopNavBar onOpenLogin={() => setIsLoginOpen(true)} />

      <main className="flex-grow">
        {activeView === 'landing' && <LandingPage />}
        {activeView === 'register' && <RegisterPage />}
        {activeView === 'dashboard' && renderDashboard()}
        {activeView === 'map' && <MapView />}
      </main>

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />

      {activeView !== 'dashboard' && <Footer />}
      <AIAdvisorWidget />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
