'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, RefreshCw, ArrowLeft, AlertTriangle } from 'lucide-react';
import { PortfolioNavbar } from '@/components/layout/PortfolioNavbar';
import { Footer } from '@/components/layout/Footer';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PortfolioNavbar />

      <main className="flex-1 flex items-center justify-center px-6 py-24">
        <div className="max-w-xl w-full text-center">

          {/* Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative flex items-center justify-center mb-8"
          >
            {/* Glow */}
            <div
              className="absolute w-32 h-32 rounded-full blur-2xl opacity-20 pointer-events-none"
              style={{ background: 'linear-gradient(135deg,#ff6b6b,#ff9500)' }}
              aria-hidden
            />
            <div
              className="relative w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#ff6b6b20,#ff950020)', border: '1px solid #ff6b6b30' }}
            >
              <AlertTriangle
                className="w-9 h-9"
                style={{ color: '#ff6b6b' }}
              />
            </div>
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
          >
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-3">
              Bir hata oluştu
            </h1>
            <p className="text-base text-muted-foreground mb-6 max-w-sm mx-auto leading-relaxed">
              Beklenmeyen bir sorun meydana geldi. Sayfayı yenilemeyi deneyin veya ana sayfaya dönün.
            </p>

            {/* Error details */}
            {(error.message || error.digest) && (
              <div
                className="inline-block text-left rounded-xl px-4 py-3 mb-8 max-w-sm w-full"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                {error.message && (
                  <p className="text-xs font-mono text-muted-foreground break-all">
                    {error.message}
                  </p>
                )}
                {error.digest && (
                  <p className="text-xs text-muted-foreground mt-1 opacity-60">
                    ID: {error.digest}
                  </p>
                )}
              </div>
            )}
          </motion.div>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12"
          >
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg,#203eec,#00d4ff)' }}
            >
              <RefreshCw className="w-4 h-4" />
              Tekrar Dene
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 hover:border-[#203eec] hover:text-[#203eec]"
              style={{ border: '1px solid var(--border)', color: 'var(--foreground)', background: 'var(--card)' }}
            >
              <Home className="w-4 h-4" />
              Ana Sayfaya Dön
            </Link>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 hover:border-[#203eec] hover:text-[#203eec]"
              style={{ border: '1px solid var(--border)', color: 'var(--muted-foreground)', background: 'var(--card)' }}
            >
              <ArrowLeft className="w-4 h-4" />
              Geri Git
            </button>
          </motion.div>

          {/* Contact hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="pt-8"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <p className="text-sm text-muted-foreground">
              Sorun devam ederse{' '}
              <Link
                href="/contact"
                className="font-medium transition-colors hover:opacity-80"
                style={{ color: '#203eec' }}
              >
                bizimle iletişime geçin
              </Link>
              .
            </p>
          </motion.div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
