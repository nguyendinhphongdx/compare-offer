'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
  Sun,
  Moon,
  LogOut,
  Settings,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { signOut } from '@/lib/actions/auth';

const NAV_ITEMS = [
  { href: '/', label: 'Tổng quan', icon: <LayoutDashboard size={20} /> },
  { href: '/offers', label: 'Quản lý Offers', icon: <FileText size={20} />, badge: true },
  { href: '/compare', label: 'So sánh', icon: <GitCompareArrows size={20} /> },
  { href: '/charts', label: 'Biểu đồ', icon: <BarChart3 size={20} /> },
  { href: '/interview', label: 'Hướng dẫn PV', icon: <HelpCircle size={20} /> },
  { href: '/assistant', label: 'AI Tư vấn', icon: <MessageCircle size={20} /> },
  { href: '/settings', label: 'Cài đặt', icon: <Settings size={20} /> },
];

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, offers, user, mobileSidebarOpen, setMobileSidebarOpen } = useStore();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  const handleNavClick = () => {
    // Close mobile sidebar on navigation
    if (mobileSidebarOpen) {
      setMobileSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full z-50 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          ${sidebarCollapsed ? 'md:w-18' : 'md:w-65'}
          w-65
        `}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 px-5 py-5" onClick={handleNavClick}>
          <div className="shrink-0 w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Briefcase size={18} className="text-primary-foreground" />
          </div>
          {(!sidebarCollapsed || mobileSidebarOpen) && (
            <div className="animate-fade-in">
              <h1 className="text-base font-bold gradient-text">OfferLens</h1>
              <p className="text-[10px] text-muted-foreground">So sánh thông minh</p>
            </div>
          )}
        </Link>

        <Separator className="bg-sidebar-border" />

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;

            // On desktop with collapsed sidebar, show tooltip version
            if (sidebarCollapsed && !mobileSidebarOpen) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger
                    render={
                      <Link
                        href={item.href}
                        onClick={handleNavClick}
                        className={`w-full justify-center px-0 hidden md:inline-flex items-center gap-3 h-9 rounded-md transition-colors ${
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-primary font-semibold'
                            : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                        }`}
                      />
                    }
                  >
                    {item.icon}
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className={`w-full justify-start gap-3 inline-flex items-center h-9 px-3 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-primary font-semibold'
                    : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                }`}
              >
                <span className="shrink-0">{item.icon}</span>
                <span className="truncate">{item.label}</span>
                {item.badge && offers.length > 0 && (
                  <Badge variant="secondary" className="ml-auto text-xs bg-primary/20 text-primary">
                    {offers.length}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-3 space-y-1">
          <Separator className="bg-sidebar-border mb-2" />

          {/* Theme & Collapse row */}
          <div className={`flex items-center ${sidebarCollapsed && !mobileSidebarOpen ? 'flex-col gap-1' : 'justify-between'}`}>
            <button
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            {/* Hide collapse toggle on mobile */}
            <button
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors hidden md:block"
              onClick={toggleSidebar}
              title={sidebarCollapsed ? 'Mở rộng' : 'Thu gọn'}
            >
              {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          {/* User Profile */}
          {user && (
            <div
              className={`group flex items-center gap-3 rounded-lg p-2 cursor-pointer transition-colors hover:bg-sidebar-accent/50 ${
                sidebarCollapsed && !mobileSidebarOpen ? 'justify-center' : ''
              }`}
              onClick={() => signOut()}
              title="Đăng xuất"
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || 'Avatar'}
                  className="shrink-0 w-8 h-8 rounded-full object-cover ring-2 ring-sidebar-border"
                />
              ) : (
                <div className="shrink-0 w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-sm font-semibold ring-2 ring-primary/20">
                  {(user.name || user.email)[0].toUpperCase()}
                </div>
              )}
              {(!sidebarCollapsed || mobileSidebarOpen) && (
                <div className="min-w-0 flex-1 animate-fade-in">
                  <p className="text-sm font-medium truncate">{user.name || 'User'}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                </div>
              )}
              {(!sidebarCollapsed || mobileSidebarOpen) && (
                <LogOut size={15} className="shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
