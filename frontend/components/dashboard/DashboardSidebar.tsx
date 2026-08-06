'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSidebar } from '@/contexts/SidebarContext';
import { logout } from '@/lib/api';
import {
  LayoutDashboard, FileText, History, Settings, LogOut,
  Sparkles, ChevronLeft, ChevronRight, CreditCard, BarChart3,
  BookOpen, Folder, Receipt,
} from 'lucide-react';

const sidebarGroups: { label?: string; items: { name: string; href: string; icon: typeof LayoutDashboard }[] }[] = [
  {
    label: 'Ana',
    items: [
      { name: 'Dashboard',  href: '/dashboard',          icon: LayoutDashboard },
      { name: 'Blog Üret',  href: '/dashboard/generate', icon: Sparkles },
    ],
  },
  {
    label: 'İçerik',
    items: [
      { name: 'Bloglarım',      href: '/dashboard/blogs',      icon: FileText   },
      { name: "Workspace'ler",  href: '/dashboard/workspaces', icon: Folder     },
      { name: 'Kullanım',       href: '/dashboard/usage',      icon: BarChart3  },
    ],
  },
  {
    label: 'Hesap',
    items: [
      { name: 'Planlar',         href: '/dashboard/plans',    icon: CreditCard },
      { name: 'Faturalandırma',  href: '/dashboard/billing',  icon: Receipt    },
      { name: 'API Docs',        href: '/dashboard/api-docs', icon: BookOpen   },
      { name: 'Geçmiş',          href: '/dashboard/history',  icon: History    },
      { name: 'Ayarlar',         href: '/dashboard/settings', icon: Settings   },
    ],
  },
];

export function DashboardSidebar() {
  const { isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed bottom-0 left-0 top-14 z-40 flex w-60 flex-col border-r border-border bg-card pt-3 transition-[width,transform] duration-slow ease-out-quart ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-[68px]' : 'lg:w-60'}`}
      >
        {/* Collapse Toggle - Desktop only */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3.5 top-6 z-50 hidden h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-card transition-colors duration-fast ease-out-quart hover:border-primary hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:flex"
          aria-label={isCollapsed ? 'Sidebar\'ı genişlet' : 'Sidebar\'ı daralt'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>

        {/* Nav Items */}
        <div className={`flex-1 space-y-6 overflow-y-auto px-3 py-2 ${isCollapsed ? 'lg:px-2' : ''}`}>
          {sidebarGroups.map((group) => (
            <div key={group.label ?? 'main'}>
              {group.label &&
                (isCollapsed ? (
                  <div className="mx-auto mb-2 hidden h-px w-6 bg-border lg:block" aria-hidden />
                ) : (
                  <p className="text-eyebrow mb-2 px-3 text-muted-foreground">{group.label}</p>
                ))}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      title={isCollapsed ? item.name : undefined}
                      aria-current={isActive ? 'page' : undefined}
                      className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-fast ease-out-quart ${
                        isCollapsed ? 'lg:justify-center lg:px-2' : ''
                      } ${
                        isActive
                          ? 'bg-accent text-accent-foreground before:absolute before:left-0 before:top-1/2 before:h-5 before:w-[3px] before:-translate-y-1/2 before:rounded-r-full before:bg-primary before:content-[""]'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      {!isCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Logout */}
        <div className={`border-t border-border px-3 py-3 ${isCollapsed ? 'lg:px-2' : ''}`}>
          <button
            onClick={handleLogout}
            title={isCollapsed ? 'Çıkış Yap' : undefined}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors duration-fast ease-out-quart hover:bg-[var(--destructive-muted)] hover:text-destructive ${
              isCollapsed ? 'lg:justify-center lg:px-2' : ''
            }`}
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            {!isCollapsed && <span>Çıkış Yap</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-foreground/40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}
