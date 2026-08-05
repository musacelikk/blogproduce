'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Lock, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { resetPassword } from '@/lib/api';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('Geçersiz veya eksik şifre sıfırlama bağlantısı.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus('idle');
    setError('');

    if (password !== confirmPassword) {
      setIsSubmitting(false);
      setStatus('error');
      setError('Şifreler eşleşmiyor.');
      return;
    }

    try {
      await resetPassword(token, password);
      setStatus('success');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setError('Şifre sıfırlama işlemi başarısız oldu. Bağlantının süresi dolmuş olabilir.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-16 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="mb-6 flex flex-col items-center gap-4">
          <Link href="/" className="inline-flex items-center gap-3">
            <Image
              src="/images/logo.png"
              alt="BlogProduce Logo"
              width={400}
              height={400}
              className="h-20 w-20 object-contain"
            />
          </Link>
          <Link
            href="/login"
            className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
            <span>Giriş ekranına dön</span>
          </Link>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card sm:p-8">
          <div className="mb-6">
            <h1 className="mb-1.5 text-2xl font-semibold tracking-tight text-foreground">
              Yeni Şifre Belirle
            </h1>
            <p className="text-sm text-muted-foreground">
              Hesabınız için yeni bir şifre belirleyin.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {status === 'success' && (
              <div className="rounded-lg border border-success/30 bg-success-muted px-3.5 py-3 text-sm text-success">
                Şifreniz başarıyla güncellendi. Giriş ekranına yönlendiriliyorsunuz...
              </div>
            )}

            {status === 'error' && error && (
              <div className="rounded-lg border border-destructive/30 bg-[var(--destructive-muted)] px-3.5 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-medium text-foreground">
                Yeni Şifre
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-11 pl-10 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="text-xs font-medium text-foreground">
                Yeni Şifre (Tekrar)
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-11 pl-10 text-sm"
                />
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting || !token} className="h-11 w-full">
              {isSubmitting ? (
                'Şifre güncelleniyor...'
              ) : (
                <>
                  Şifreyi Güncelle
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background px-4 py-16 sm:px-6">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-card sm:p-8">
            <span className="sr-only">Yükleniyor...</span>
            <Skeleton className="mb-3 h-7 w-48" />
            <Skeleton className="mb-8 h-4 w-64" />
            <Skeleton className="mb-4 h-11 w-full" />
            <Skeleton className="mb-6 h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
