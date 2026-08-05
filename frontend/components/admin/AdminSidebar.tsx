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
        aria-label={isMobileOpen ? 'Menüyü kapat' : 'Menüyü aç'}
        className="fixed left-4 top-4 z-50 rounded-lg border border-border bg-card p-2 text-foreground shadow-card transition-colors hover:bg-secondary lg:hidden"
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed bottom-0 left-0 top-16 z-40 flex flex-col border-r border-border bg-card transition-all duration-300 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'w-64 lg:w-20' : 'w-64 lg:w-64'}`}
      >
        {/* Logo */}
        <div className="relative flex-shrink-0 border-b border-border p-4">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <span className="block truncate text-sm font-semibold text-foreground">
                  Admin Panel
                </span>
                <span className="block truncate text-xs text-muted-foreground">BlogProduce</span>
              </div>
            )}
          </Link>
          {/* Toggle - Desktop */}
          <button
            onClick={toggleSidebar}
            className="absolute -right-3 top-1/2 z-10 hidden h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-card transition-colors hover:bg-accent hover:text-accent-foreground lg:flex"
            aria-label={isCollapsed ? 'Menüyü aç' : 'Menüyü daralt'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {/* Menu Items - gruplu */}
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-3">
          {sidebarGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              {!isCollapsed && (
                <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
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
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors ${
                        isActive
                          ? 'bg-accent font-medium text-accent-foreground'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      } ${isCollapsed ? 'lg:justify-center lg:px-2' : ''}`}
                      title={isCollapsed ? item.name : undefined}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {!isCollapsed && <span className="truncate text-sm font-medium">{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Logout */}
        <div className="flex-shrink-0 border-t border-border p-3">
          <button
            onClick={handleLogout}
            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground ${
              isCollapsed ? 'lg:justify-center lg:px-2' : ''
            }`}
            title={isCollapsed ? 'Çıkış Yap' : undefined}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!isCollapsed && <span className="text-sm font-medium">Çıkış Yap</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-foreground/20 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}
