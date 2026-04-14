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
        <main className="dashboard-main flex-1 mt-14 px-4 sm:px-5 lg:px-8 pb-6">
          <div className="dashboard-main-inner mx-auto w-full max-w-7xl">
            {!isDashboardHome && (
              <div className="dashboard-hero mb-5 rounded-3xl p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl flex items-center justify-center bg-white/20">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/75">BlogProduce Studio</p>
                    <p className="text-white font-semibold">İçerik operasyonlarını tek panelden yönetin</p>
                  </div>
                </div>
              </div>
            )}
            {children}
          </div>
        </main>
        {/* Footer */}
        <footer className="dashboard-footer px-5 lg:px-8 py-3 mt-auto">
          <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3">
            <p
              className="text-[9px] text-[#999999]"
              style={{
                fontFamily: 'var(--font-sans), "Inter", sans-serif',
              }}
            >
              © 2026{' '}
              <a
                href="https://ibbmtech.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#666666] transition-colors"
              >
                IBBM Tech.
              </a>
              {' '}Tüm hakları saklıdır.
            </p>
            <span className="hidden md:inline text-[#e5e5e5] text-[9px]">•</span>
            <div className="flex items-center gap-2.5">
              <Link
                href="/terms"
                className="text-[9px] text-[#999999] hover:text-[#666666] transition-colors"
                style={{
                  fontFamily: 'var(--font-sans), "Inter", sans-serif',
                }}
              >
                Kullanım Şartları
              </Link>
              <span className="text-[#e5e5e5] text-[9px]">•</span>
              <Link
                href="/privacy"
                className="text-[9px] text-[#999999] hover:text-[#666666] transition-colors"
                style={{
                  fontFamily: 'var(--font-sans), "Inter", sans-serif',
                }}
              >
                Gizlilik
              </Link>
              <span className="text-[#e5e5e5] text-[9px]">•</span>
              <Link
                href="/cookie"
                className="text-[9px] text-[#999999] hover:text-[#666666] transition-colors"
                style={{
                  fontFamily: 'var(--font-sans), "Inter", sans-serif',
                }}
              >
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

