'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSidebar } from '@/contexts/SidebarContext';
import { logout } from '@/lib/api';
import {
  LayoutDashboard, FileText, History, Settings, LogOut, Menu, X,
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
      { name: 'Fatura Geçmişi',  href: '/dashboard/billing',  icon: Receipt    },
      { name: 'API Docs',        href: '/dashboard/api-docs', icon: BookOpen   },
      { name: 'Geçmiş',          href: '/dashboard/history',  icon: History    },
      { name: 'Ayarlar',         href: '/dashboard/settings', icon: Settings   },
    ],
  },
];

export function DashboardSidebar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl shadow-sm transition-colors"
        style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-14 bottom-0 left-0 pt-3 z-40 flex flex-col transition-all duration-300 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-[68px]' : 'lg:w-60'} w-60`}
        style={{ background: 'var(--card)', borderRight: '1px solid var(--border)' }}
      >
        {/* Collapse Toggle - Desktop */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-6 w-6 h-6 rounded-full items-center justify-center shadow-sm z-50 transition-colors"
          style={{
            background: 'var(--card)',
            border: '1.5px solid var(--border)',
            color: 'var(--muted-foreground)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = '#203eec';
            (e.currentTarget as HTMLElement).style.color = 'white';
            (e.currentTarget as HTMLElement).style.borderColor = '#203eec';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'var(--card)';
            (e.currentTarget as HTMLElement).style.color = 'var(--muted-foreground)';
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
          }}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </button>

        {/* Nav Items */}
        <div className={`flex-1 overflow-y-auto space-y-5 px-3 py-2 ${isCollapsed ? 'lg:px-2' : ''}`}>
          {sidebarGroups.map((group) => (
            <div key={group.label ?? 'main'}>
              {!isCollapsed && group.label && (
                <p className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
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
                      title={isCollapsed ? item.name : undefined}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                        isCollapsed ? 'lg:justify-center lg:px-2' : ''
                      }`}
                      style={
                        isActive
                          ? {
                              background: 'linear-gradient(135deg,#203eec,#00b4d8)',
                              color: 'white',
                            }
                          : { color: 'var(--muted-foreground)' }
                      }
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          (e.currentTarget as HTMLElement).style.background = 'var(--secondary)';
                          (e.currentTarget as HTMLElement).style.color = 'var(--foreground)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          (e.currentTarget as HTMLElement).style.background = 'transparent';
                          (e.currentTarget as HTMLElement).style.color = 'var(--muted-foreground)';
                        }
                      }}
                    >
                      <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                      {!isCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Logout */}
        <div
          className={`px-3 py-3 ${isCollapsed ? 'lg:px-2' : ''}`}
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <button
            onClick={handleLogout}
            title={isCollapsed ? 'Çıkış Yap' : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-sm font-medium transition-all duration-150 text-muted-foreground ${
              isCollapsed ? 'lg:justify-center lg:px-2' : ''
            }`}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#fef2f2';
              (e.currentTarget as HTMLElement).style.color = '#ef4444';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
              (e.currentTarget as HTMLElement).style.color = 'var(--muted-foreground)';
            }}
          >
            <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
            {!isCollapsed && <span>Çıkış Yap</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}
