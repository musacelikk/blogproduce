'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, RefreshCw, ArrowLeft, AlertTriangle } from 'lucide-react';
import { PortfolioNavbar } from '@/components/layout/PortfolioNavbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';

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
    <div className="flex min-h-screen flex-col bg-background">
      <PortfolioNavbar />

      <main className="flex flex-1 items-center justify-center px-4 py-24 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl text-center">

          {/* Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mb-8 flex items-center justify-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warning-muted">
              <AlertTriangle className="h-7 w-7 text-warning" />
            </div>
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
          >
            <h1 className="mb-3 text-2xl font-semibold tracking-tight text-foreground">
              Bir hata oluştu
            </h1>
            <p className="mx-auto mb-6 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Beklenmeyen bir sorun meydana geldi. Sayfayı yenilemeyi deneyin veya ana sayfaya dönün.
            </p>

            {/* Error details */}
            {(error.message || error.digest) && (
              <div className="mb-8 inline-block w-full max-w-sm rounded-xl border border-border bg-card px-4 py-3 text-left shadow-card">
                {error.message && (
                  <p className="break-all font-mono text-xs text-muted-foreground">
                    {error.message}
                  </p>
                )}
                {error.digest && (
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
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
            className="mb-12 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button onClick={reset}>
              <RefreshCw className="h-4 w-4" />
              Tekrar Dene
            </Button>
            <Button asChild variant="outline">
              <Link href="/">
                <Home className="h-4 w-4" />
                Ana Sayfaya Dön
              </Link>
            </Button>
            <Button variant="ghost" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4" />
              Geri Git
            </Button>
          </motion.div>

          {/* Contact hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="border-t border-border pt-8"
          >
            <p className="text-sm text-muted-foreground">
              Sorun devam ederse{' '}
              <Link
                href="/contact"
                className="font-medium text-accent-foreground transition-colors hover:underline"
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
