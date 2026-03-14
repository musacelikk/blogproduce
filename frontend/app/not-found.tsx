'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, ArrowRight } from 'lucide-react';
import { PortfolioNavbar } from '@/components/layout/PortfolioNavbar';
import { Footer } from '@/components/layout/Footer';

const quickLinks = [
  { href: '/', label: 'Ana Sayfa' },
  { href: '/solutions', label: 'Çözümler' },
  { href: '/pricing', label: 'Fiyatlandırma' },
  { href: '/docs', label: 'Docs' },
  { href: '/contact', label: 'İletişim' },
];

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PortfolioNavbar />

      <main className="flex-1 flex items-center justify-center px-6 py-24">
        <div className="max-w-xl w-full text-center">

          {/* Big 404 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative mb-8 select-none"
          >
            {/* Glow behind */}
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              aria-hidden
            >
              <div
                className="w-64 h-32 rounded-full blur-3xl opacity-20"
                style={{ background: 'linear-gradient(135deg,#203eec,#00d4ff)' }}
              />
            </div>
            <span
              className="relative text-[9rem] md:text-[11rem] font-bold leading-none tracking-tighter"
              style={{
                background: 'linear-gradient(135deg,#203eec,#00d4ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              404
            </span>
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.15 }}
          >
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-3">
              Sayfa bulunamadı
            </h1>
            <p className="text-base text-muted-foreground mb-10 max-w-sm mx-auto leading-relaxed">
              Aradığınız sayfa mevcut değil veya taşınmış olabilir. URL'yi kontrol edin ya da aşağıdaki bağlantıları kullanın.
            </p>
          </motion.div>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12"
          >
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg,#203eec,#00d4ff)' }}
            >
              <Home className="w-4 h-4" />
              Ana Sayfaya Dön
            </Link>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 hover:border-[#203eec] hover:text-[#203eec]"
              style={{ border: '1px solid var(--border)', color: 'var(--foreground)', background: 'var(--card)' }}
            >
              <ArrowLeft className="w-4 h-4" />
              Geri Git
            </button>
          </motion.div>

          {/* Quick links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="pt-8"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
              Hızlı Erişim
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 hover:border-[#203eec] hover:text-[#203eec]"
                  style={{ border: '1px solid var(--border)', color: 'var(--muted-foreground)', background: 'var(--card)' }}
                >
                  {link.label}
                  <ArrowRight className="w-3 h-3" />
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
