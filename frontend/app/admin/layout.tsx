'use client';

import { useLayoutEffect, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import { auth } from '@/lib/auth';
import { isAdminSubdomain, redirectToAdminSubdomain } from '@/lib/subdomain';

function AdminContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();

  // Login sayfasında sidebar ve header gösterme
  // Admin subdomain'de path'ler /admin olmadan gelir (middleware rewrite)
  const isLoginPage = pathname === '/login' || pathname === '/admin/login';

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

  useEffect(() => {
    // Subdomain kontrolü - Admin sayfaları sadece admin subdomain'de olmalı
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      if (!isAdminSubdomain() && !isLoginPage) {
        // Admin subdomain'de değilse, admin subdomain'ine yönlendir
        redirectToAdminSubdomain(pathname);
        return;
      }
    }

    // Login sayfasında auth kontrolü yapma
    if (isLoginPage) {
      return;
    }

    // Admin authentication guard
    if (!auth.isAuthenticated()) {
      router.push('/login');
      return;
    }

    const user = auth.getUser();
    if (user?.role !== 'admin') {
      auth.logout();
      router.push('/login');
    }
  }, [router, isLoginPage, pathname]);

  // Login sayfasında sadece children render et
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Diğer admin sayfalarında sidebar ve header ile render et
  return (
    <div className="min-h-screen bg-background" data-admin-page>
      <AdminSidebar />
      <div
        className={`relative z-10 flex min-h-screen flex-col transition-all duration-300 ${
          isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        <AdminHeader />
        <main className="mt-16 flex-1 overflow-auto bg-background p-6 lg:p-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AdminContent>{children}</AdminContent>
    </SidebarProvider>
  );
}
