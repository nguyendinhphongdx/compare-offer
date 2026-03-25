'use client';

import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import Sidebar from '@/components/Sidebar';
import { Menu, Briefcase } from 'lucide-react';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed, isLoaded, loadFromDb, setMobileSidebarOpen } = useStore();

  useEffect(() => {
    loadFromDb();
  }, [loadFromDb]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Sidebar />

      {/* Mobile header */}
      <header className="fixed top-0 left-0 right-0 z-30 flex items-center gap-3 bg-background/95 backdrop-blur-sm border-b border-border px-4 h-14 md:hidden">
        <button
          className="p-2 -ml-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          onClick={() => setMobileSidebarOpen(true)}
        >
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <Briefcase size={14} className="text-primary-foreground" />
          </div>
          <span className="font-bold text-sm gradient-text">OfferLens</span>
        </div>
      </header>

      <main
        className={`transition-all duration-300 min-h-screen p-4 pt-18 md:p-6 md:pt-6 ${
          sidebarCollapsed ? 'md:ml-18' : 'md:ml-65'
        }`}
      >
        {children}
      </main>
    </div>
  );
}
