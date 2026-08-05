'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Shield } from 'lucide-react';
import { auth } from '@/lib/auth';
import { useSidebar } from '@/contexts/SidebarContext';

const pageTitles: Record<string, string> = {
  '/admin/dashboard': 'Admin Dashboard',
  '/admin/users': 'Kullanıcılar',
  '/admin/blogs': 'Bloglar',
  '/admin/homepage': 'Anasayfa Yönetimi',
  '/admin/workspaces': 'Workspace',
  '/admin/analytics': 'İstatistikler',
  '/admin/events': 'Event Tracking',
  '/admin/behaviors': 'User Behavior',
  '/admin/activities': 'Aktiviteler',
  '/admin/plans': 'Planlar',
  '/admin/sales': 'Satışlar',
  '/admin/notifications': 'Bildirimler',
  '/admin/contacts': 'Mesajlar',
  '/admin/settings': 'Ayarlar',
};

export function AdminHeader() {
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();

  useEffect(() => {
    const currentUser = auth.getUser();
    setUser(currentUser);
  }, []);

  const pageTitle = pageTitles[pathname] ?? 'Admin Panel';

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-b border-border bg-card px-4 py-3 transition-[left] duration-300 ${
        isCollapsed ? 'lg:left-20' : 'lg:left-64'
      }`}
    >
      {/* Sayfa başlığı */}
      <div className="hidden min-w-0 flex-1 lg:block">
        <h1 className="truncate text-sm font-semibold text-foreground">{pageTitle}</h1>
      </div>

      {/* Sağ: Bildirim + Admin */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button
          aria-label="Bildirimler"
          className="relative rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />
        </button>

        {/* Admin Badge */}
        <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-2 py-1.5 sm:gap-2.5 sm:px-3">
          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground sm:h-7 sm:w-7">
            {user?.name?.charAt(0)?.toUpperCase() || (
              <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            )}
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-xs font-medium text-foreground">{user?.name || 'Admin'}</p>
            <p className="text-xs text-muted-foreground">{user?.email || 'Yönetici'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
