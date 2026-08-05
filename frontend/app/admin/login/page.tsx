'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Lock, Mail, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { login } from '@/lib/api';
import { auth } from '@/lib/auth';

export default function AdminLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Admin Girişi - BlogProduce';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await login(formData.email, formData.password);
      const user = auth.getUser();

      // Check if user is admin
      if (user?.role !== 'admin') {
        auth.logout();
        setError('Bu sayfaya erişim yetkiniz yok. Sadece yöneticiler giriş yapabilir.');
        setIsSubmitting(false);
        return;
      }

      // Login successful - redirect to admin dashboard
      // Admin subdomain'de /admin/dashboard path'ini kullanıyoruz
      router.push('/admin/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Giriş yapılırken bir hata oluştu';

      // Daha açıklayıcı hata mesajları
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('Şifre veya e-posta')) {
        setError('E-posta veya şifre hatalı. Lütfen bilgilerinizi kontrol edin. Admin kullanıcı oluşturmak için backend\'de "npm run create-admin" komutunu çalıştırın.');
      } else {
        setError(errorMessage);
      }
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-border bg-card p-6 shadow-elevated sm:p-8">
          <div className="mb-8 text-center">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
              <Shield className="h-6 w-6 text-accent-foreground" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Admin Girişi</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Yönetici paneline erişim için giriş yapın
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-[var(--destructive-muted)] p-3">
                <div className="flex items-start gap-2 text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <p className="text-sm leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                E-posta
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@example.com"
                  required
                  className="h-11 bg-card pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Şifre
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="h-11 bg-card pl-9"
                />
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting} className="h-11 w-full rounded-lg">
              {isSubmitting ? (
                'Giriş yapılıyor...'
              ) : (
                <>
                  Admin Girişi
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
