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
      <body className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-2xl w-full text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h1
              className="text-4xl font-semibold text-[#202020] mb-4"
              style={{
                fontFamily: '"Space Grotesk", sans-serif',
              }}
            >
              Kritik Hata
            </h1>
            <p className="text-lg text-[#666666] mb-2">
              Uygulamada kritik bir hata oluştu.
            </p>
            {error.message && (
              <p className="text-sm text-[#999999] mb-8 font-mono bg-[#f5f5f5] p-3 rounded-lg inline-block">
                {error.message}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={reset}
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-6 py-3"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Tekrar Dene
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-[#e5e5e5] text-[#202020] hover:bg-[#f5f5f5] px-6 py-3"
            >
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Ana Sayfaya Dön
              </Link>
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}

