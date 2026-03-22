'use client';

import { useStore } from '@/store/useStore';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import OfferManager from '@/components/OfferManager';
import CompareView from '@/components/CompareView';
import ChartsView from '@/components/ChartsView';
import InterviewGuide from '@/components/InterviewGuide';
import AIAssistant from '@/components/AIAssistant';

export default function Home() {
  const { currentPage, sidebarCollapsed } = useStore();

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'offers':
        return <OfferManager />;
      case 'compare':
        return <CompareView />;
      case 'charts':
        return <ChartsView />;
      case 'interview':
        return <InterviewGuide />;
      case 'assistant':
        return <AIAssistant />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main
        className={`transition-all duration-300 min-h-screen p-6 ${
          sidebarCollapsed ? 'ml-[72px]' : 'ml-[260px]'
        }`}
      >
        {renderPage()}
      </main>
    </div>
  );
}
