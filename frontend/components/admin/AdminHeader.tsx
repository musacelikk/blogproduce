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
      className={`fixed top-0 right-0 left-0 z-50 bg-[#1a1a1a] border-b border-[#333333] px-4 py-3 flex items-center justify-between transition-[left] duration-300 ${isCollapsed ? 'lg:left-20' : 'lg:left-64'}`}
    >
      {/* Sayfa başlığı */}
      <div className="flex-1 min-w-0 hidden lg:block">
        <h1
          className="text-sm font-semibold text-white truncate"
          style={{ fontFamily: 'var(--font-display), "Space Grotesk", sans-serif' }}
        >
          {pageTitle}
        </h1>
      </div>

      {/* Sağ: Bildirim + Admin */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative p-1.5 text-[#999999] hover:text-white transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#3B82F6] rounded-full"></span>
        </button>

        {/* Admin Badge */}
        <div className="flex items-center gap-2 sm:gap-2.5 px-2 sm:px-3 py-1.5 bg-[#0f0f0f] rounded-lg border border-[#333333]">
          <div className="w-6 h-6 sm:w-7 sm:h-7 bg-[#3B82F6] rounded-full flex items-center justify-center flex-shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />}
          </div>
          <div className="hidden sm:block text-left">
            <p
              className="text-xs font-medium text-white"
              style={{
                fontFamily: 'var(--font-sans), "Inter", sans-serif',
              }}
            >
              {user?.name || 'Admin'}
            </p>
            <p
              className="text-xs text-[#666666]"
              style={{
                fontFamily: 'var(--font-sans), "Inter", sans-serif',
              }}
            >
              {user?.email || 'Yönetici'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

