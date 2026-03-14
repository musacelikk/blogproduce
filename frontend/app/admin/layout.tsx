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
    
    // Force black background immediately (before paint)
    document.body.style.backgroundColor = '#0f0f0f';
    document.documentElement.style.backgroundColor = '#0f0f0f';
    
    // Hidden class ekle veya style uygula
    if (navbar) {
      navbar.style.cssText = 'display: none !important;';
    }
    if (footer) {
      footer.style.cssText = 'display: none !important;';
    }
    if (main) {
      main.style.cssText = 'padding: 0 !important; background-color: #0f0f0f !important;';
    }
    
    return () => {
      if (navbar) navbar.style.cssText = '';
      if (footer) footer.style.cssText = '';
      if (main) main.style.cssText = '';
      document.body.style.backgroundColor = '';
      document.documentElement.style.backgroundColor = '';
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

    // Force black background for admin pages
    document.body.style.backgroundColor = '#0f0f0f';
    document.documentElement.style.backgroundColor = '#0f0f0f';
    
    return () => {
      document.body.style.backgroundColor = '';
      document.documentElement.style.backgroundColor = '';
    };
  }, [router, isLoginPage, pathname]);

  // Login sayfasında sadece children render et
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Diğer admin sayfalarında sidebar ve header ile render et
  return (
    <div className="min-h-screen bg-[#0f0f0f]" data-admin-page>
      <AdminSidebar />
      <div
        className={`flex flex-col min-h-screen relative z-10 transition-all duration-300 ${
          isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        <AdminHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto mt-16 lg:mt-16 bg-[#0f0f0f]">
          {children}
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

