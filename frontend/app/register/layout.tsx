'use client';

import { useEffect } from 'react';

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Navbar ve Footer'ı gizle
    const navbar = document.querySelector('nav');
    const footer = document.querySelector('footer');
    const main = document.querySelector('main');
    
    if (navbar) navbar.style.display = 'none';
    if (footer) footer.style.display = 'none';
    if (main) main.style.padding = '0';
    
    return () => {
      // Cleanup - sayfa değiştiğinde geri getir
      if (navbar) navbar.style.display = '';
      if (footer) footer.style.display = '';
      if (main) main.style.padding = '';
    };
  }, []);

  return <div data-login-page>{children}</div>;
}

