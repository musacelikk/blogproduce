'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  Activity,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Building2,
  Mail,
  Bell,
  Receipt,
  Home,
  MousePointerClick,
  UserCog,
} from 'lucide-react';
import { logout } from '@/lib/api';
import { useSidebar } from '@/contexts/SidebarContext';

const sidebarGroups: { label: string; items: { name: string; href: string; icon: typeof LayoutDashboard }[] }[] = [
  {
    label: 'Ana',
    items: [{ name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Yönetim',
    items: [
      { name: 'Kullanıcılar', href: '/admin/users', icon: Users },
      { name: 'Bloglar', href: '/admin/blogs', icon: FileText },
      { name: 'Anasayfa Yönetimi', href: '/admin/homepage', icon: Home },
      { name: 'Workspace', href: '/admin/workspaces', icon: Building2 },
    ],
  },
  {
    label: 'Analitik',
    items: [
      { name: 'İstatistikler', href: '/admin/analytics', icon: BarChart3 },
      { name: 'Event Tracking', href: '/admin/events', icon: MousePointerClick },
      { name: 'User Behavior', href: '/admin/behaviors', icon: UserCog },
      { name: 'Aktiviteler', href: '/admin/activities', icon: Activity },
    ],
  },
  {
    label: 'Finans',
    items: [
      { name: 'Planlar', href: '/admin/plans', icon: CreditCard },
      { name: 'Satışlar', href: '/admin/sales', icon: Receipt },
    ],
  },
  {
    label: 'İletişim',
    items: [
      { name: 'Bildirimler', href: '/admin/notifications', icon: Bell },
      { name: 'Mesajlar', href: '/admin/contacts', icon: Mail },
    ],
  },
  {
    label: 'Sistem',
    items: [{ name: 'Ayarlar', href: '/admin/settings', icon: Settings }],
  },
];

export function AdminSidebar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isCollapsed, toggleSidebar } = useSidebar();

  const handleLogout = async () => {
    await logout();
    router.push('/admin/login');
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[#1a1a1a] rounded-lg shadow-md text-white"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 bg-[#1a1a1a] border-r border-[#333333] flex flex-col transition-all duration-300 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20 w-64' : 'lg:w-64 w-64'}`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-[#333333] relative flex-shrink-0">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#3B82F6] rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <span
                  className="text-sm font-bold text-white block truncate"
                  style={{ fontFamily: 'var(--font-display), "Space Grotesk", sans-serif' }}
                >
                  Admin Panel
                </span>
                <span className="text-xs text-[#666666] block truncate" style={{ fontFamily: 'var(--font-sans), "Inter", sans-serif' }}>
                  BlogGenerator
                </span>
              </div>
            )}
          </Link>
          {/* Toggle - Desktop */}
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#333333] hover:bg-[#3B82F6] rounded-full items-center justify-center border border-[#444444] transition-colors z-10"
            aria-label={isCollapsed ? 'Menüyü aç' : 'Menüyü daralt'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5 text-white" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5 text-white" />
            )}
          </button>
        </div>

        {/* Menu Items - gruplu */}
        <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-4">
          {sidebarGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              {!isCollapsed && (
                <p
                  className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#666666]"
                  style={{ fontFamily: 'var(--font-sans), "Inter", sans-serif' }}
                >
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 ${
                        isActive ? 'bg-[#3B82F6] text-white shadow-sm' : 'text-[#999999] hover:bg-[#252525] hover:text-white'
                      } ${isCollapsed ? 'lg:justify-center lg:px-2' : ''}`}
                      style={{ fontFamily: 'var(--font-sans), "Inter", sans-serif' }}
                      title={isCollapsed ? item.name : undefined}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {!isCollapsed && <span className="text-sm font-medium truncate">{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Logout */}
        <div className="p-3 border-t border-[#333333] flex-shrink-0">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg w-full text-[#999999] hover:bg-[#252525] hover:text-white transition-all duration-200 ${
              isCollapsed ? 'lg:justify-center lg:px-2' : ''
            }`}
            style={{ fontFamily: 'var(--font-sans), "Inter", sans-serif' }}
            title={isCollapsed ? 'Çıkış Yap' : undefined}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span className="text-sm font-medium">Çıkış Yap</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/70 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}

