'use client';

import { useLayoutEffect, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
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

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }} data-dashboard-page>
      <DashboardSidebar />
      <div 
        className={`transition-all duration-300 flex flex-col flex-1 ${
          isCollapsed ? 'lg:ml-[68px]' : 'lg:ml-60'
        }`}
      >
        <DashboardHeader />
        <main className="flex-1 p-4 sm:p-5 lg:p-6 mt-14">
          {children}
        </main>
        {/* Footer */}
        <footer className="px-5 lg:px-6 py-2 mt-auto" style={{ borderTop: '1px solid var(--border)', background: 'var(--card)' }}>
          <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3">
            <p
              className="text-[9px] text-[#999999]"
              style={{
                fontFamily: 'var(--font-sans), "Inter", sans-serif',
              }}
            >
              © 2026{' '}
              <a
                href="https://skytechbilisim.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#666666] transition-colors"
              >
                Skytech Veri Bilişim Hizmetleri A.Ş.
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

