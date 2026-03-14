'use client';

import { useLayoutEffect } from 'react';

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useLayoutEffect(() => {
    // Root layout'taki navbar ve footer'ı hemen gizle (paint'ten önce)
    const navbar = document.querySelector('body > nav') as HTMLElement | null;
    const footer = document.querySelector('body > footer') as HTMLElement | null;
    const main = document.querySelector('body > main') as HTMLElement | null;
    
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

  return <div data-admin-page>{children}</div>;
}

