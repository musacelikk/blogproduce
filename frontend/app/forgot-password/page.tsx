'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Mail, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { requestPasswordReset } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus('idle');
    setError('');

    try {
      await requestPasswordReset(email);
      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setError('Bir hata oluştu. Lütfen e-posta adresinizi kontrol edin ve tekrar deneyin.');
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
              Şifremi Unuttum
            </h1>
            <p className="text-sm text-muted-foreground">
              E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {status === 'success' && (
              <div className="rounded-lg border border-success/30 bg-success-muted px-3.5 py-3 text-sm text-success">
                Eğer bu e-posta adresiyle kayıtlı bir hesabınız varsa, şifre sıfırlama bağlantısı gönderildi.
              </div>
            )}

            {status === 'error' && error && (
              <div className="rounded-lg border border-destructive/30 bg-[var(--destructive-muted)] px-3.5 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-medium text-foreground">
                E-posta
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@email.com"
                  required
                  className="h-11 pl-10 text-sm"
                />
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting} className="h-11 w-full">
              {isSubmitting ? (
                'Gönderiliyor...'
              ) : (
                <>
                  Şifre Sıfırlama Bağlantısı Gönder
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
