'use client';

import { useStore } from '@/store/useStore';
import { PageView } from '@/types';
import {
  LayoutDashboard,
  FileText,
  GitCompareArrows,
  BarChart3,
  MessageCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Briefcase,
} from 'lucide-react';

const NAV_ITEMS: { id: PageView; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Tổng quan', icon: <LayoutDashboard size={20} /> },
  { id: 'offers', label: 'Quản lý Offers', icon: <FileText size={20} /> },
  { id: 'compare', label: 'So sánh', icon: <GitCompareArrows size={20} /> },
  { id: 'charts', label: 'Biểu đồ', icon: <BarChart3 size={20} /> },
  { id: 'interview', label: 'Hướng dẫn PV', icon: <HelpCircle size={20} /> },
  { id: 'assistant', label: 'AI Tư vấn', icon: <MessageCircle size={20} /> },
];

export default function Sidebar() {
  const { currentPage, setCurrentPage, sidebarCollapsed, toggleSidebar, offers } = useStore();

  return (
    <aside
      className={`fixed left-0 top-0 h-full z-50 flex flex-col transition-all duration-300 ${
        sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'
      }`}
      style={{
        background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
        borderRight: '1px solid rgba(51, 65, 85, 0.5)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-[rgba(51,65,85,0.5)]">
        <div
          className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)' }}
        >
          <Briefcase size={18} color="white" />
        </div>
        {!sidebarCollapsed && (
          <div className="animate-fade-in">
            <h1 className="text-base font-bold gradient-text">OfferLens</h1>
            <p className="text-[10px] text-[var(--text-muted)]">So sánh thông minh</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-[rgba(99,102,241,0.15)] text-[#818cf8]'
                  : 'text-[var(--text-secondary)] hover:bg-[rgba(51,65,85,0.5)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span className={`flex-shrink-0 ${isActive ? 'text-[#818cf8]' : ''}`}>
                {item.icon}
              </span>
              {!sidebarCollapsed && (
                <span className="text-sm font-medium truncate">{item.label}</span>
              )}
              {!sidebarCollapsed && item.id === 'offers' && offers.length > 0 && (
                <span className="ml-auto text-xs bg-[rgba(99,102,241,0.2)] text-[#818cf8] px-2 py-0.5 rounded-full">
                  {offers.length}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={toggleSidebar}
        className="mx-3 mb-4 p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[rgba(51,65,85,0.5)] transition-all flex items-center justify-center"
      >
        {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </aside>
  );
}
