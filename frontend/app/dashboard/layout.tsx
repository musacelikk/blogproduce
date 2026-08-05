'use client';

import { useLayoutEffect, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { auth } from '@/lib/auth';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if user is authenticated
    // Note: Subdomain redirect is handled by middleware (server-side)
    if (!auth.isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  useLayoutEffect(() => {
    // Root layout'taki navbar ve footer'ı hemen gizle (paint'ten önce)
    const navbar = document.querySelector('body > nav') as HTMLElement | null;
    const footer = document.querySelector('body > footer') as HTMLElement | null;
    const main = document.querySelector('body > main') as HTMLElement | null;
    
    // Hidden class ekle veya style uygula
    if (navbar) {
      navbar.style.cssText = 'display: none !important;';
    }
    if (footer) {
      footer.style.cssText = 'display: none !important;';
    }
    if (main) {
      main.style.cssText = 'padding: 0 !important;';
    }
    
    return () => {
      if (navbar) navbar.style.cssText = '';
      if (footer) footer.style.cssText = '';
      if (main) main.style.cssText = '';
    };
  }, []);

  const isDashboardHome = pathname === '/dashboard';

  return (
    <div className="dashboard-shell min-h-screen flex flex-col" data-dashboard-page>
      <DashboardSidebar />
      <div 
        className={`transition-all duration-300 flex flex-col flex-1 ${
          isCollapsed ? 'lg:ml-[68px]' : 'lg:ml-60'
        }`}
      >
        <DashboardHeader />
        <main className="dashboard-main mt-14 flex-1 p-6 lg:p-8">
          <div className="dashboard-main-inner mx-auto w-full max-w-7xl">
            {!isDashboardHome && (
              <div className="dashboard-hero mb-6 rounded-xl px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-foreground/20">
                    <Sparkles className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/70">
                      BlogProduce Studio
                    </p>
                    <p className="text-sm font-semibold text-primary-foreground">
                      İçerik operasyonlarını tek panelden yönetin
                    </p>
                  </div>
                </div>
              </div>
            )}
            {children}
          </div>
        </main>
        {/* Footer */}
        <footer className="dashboard-footer mt-auto px-6 py-4 lg:px-8">
          <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-center gap-2 text-xs text-muted-foreground md:flex-row md:gap-3">
            <p>
              © 2026{' '}
              <a
                href="https://bilalorhanlar.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-foreground"
              >
                Bilal ORHANLAR
              </a>
              {' '}Tüm hakları saklıdır.
            </p>
            <span className="hidden text-border md:inline">•</span>
            <div className="flex items-center gap-3">
              <Link href="/terms" className="transition-colors hover:text-foreground">
                Kullanım Şartları
              </Link>
              <span className="text-border">•</span>
              <Link href="/privacy" className="transition-colors hover:text-foreground">
                Gizlilik
              </Link>
              <span className="text-border">•</span>
              <Link href="/cookie" className="transition-colors hover:text-foreground">
                Çerezler
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardContent>{children}</DashboardContent>
    </SidebarProvider>
  );
}

