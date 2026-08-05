'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, ArrowRight, Compass } from 'lucide-react';
import { PortfolioNavbar } from '@/components/layout/PortfolioNavbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';

const quickLinks = [
  { href: '/', label: 'Ana Sayfa' },
  { href: '/solutions', label: 'Çözümler' },
  { href: '/pricing', label: 'Fiyatlandırma' },
  { href: '/docs', label: 'Docs' },
  { href: '/contact', label: 'İletişim' },
];

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PortfolioNavbar />

      <main className="flex flex-1 items-center justify-center px-4 py-24 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl text-center">

          {/* Big 404 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mb-8 select-none"
          >
            <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Compass className="h-5 w-5" />
            </div>
            <span className="text-7xl font-semibold leading-none tracking-tighter text-primary sm:text-8xl">
              404
            </span>
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.15 }}
          >
            <h1 className="mb-3 text-2xl font-semibold tracking-tight text-foreground">
              Sayfa bulunamadı
            </h1>
            <p className="mx-auto mb-10 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Aradığınız sayfa mevcut değil veya taşınmış olabilir. URL&apos;yi kontrol edin ya da aşağıdaki bağlantıları kullanın.
            </p>
          </motion.div>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mb-12 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button asChild>
              <Link href="/">
                <Home className="h-4 w-4" />
                Ana Sayfaya Dön
              </Link>
            </Button>
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4" />
              Geri Git
            </Button>
          </motion.div>

          {/* Quick links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="border-t border-border pt-8"
          >
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Hızlı Erişim
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-card transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {link.label}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              ))}
            </div>
          </motion.div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
