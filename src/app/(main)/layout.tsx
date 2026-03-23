'use client';

import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import Sidebar from '@/components/Sidebar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed, isLoaded, loadFromDb } = useStore();

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
      <main
        className={`transition-all duration-300 min-h-screen p-6 ${
          sidebarCollapsed ? 'ml-18' : 'ml-65'
        }`}
      >
        {children}
      </main>
    </div>
  );
}
