'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Home, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to error reporting service (e.g., Sentry)
    console.error('Global application error:', error);
  }, [error]);

  return (
    <html lang="tr">
      <body className="flex min-h-screen items-center justify-center bg-background px-4 font-sans text-foreground">
        <div className="w-full max-w-xl text-center">
          <div className="mb-8">
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--destructive-muted)]">
              <AlertCircle className="h-7 w-7 text-destructive" />
            </div>
            <h1 className="mb-3 text-2xl font-semibold tracking-tight text-foreground">
              Kritik Hata
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Uygulamada kritik bir hata oluştu.
            </p>
            {error.message && (
              <p className="mt-4 inline-block max-w-sm break-all rounded-lg border border-border bg-card px-4 py-3 font-mono text-xs text-muted-foreground shadow-card">
                {error.message}
              </p>
            )}
          </div>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
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
          </div>
        </div>
      </body>
    </html>
  );
}
