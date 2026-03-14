'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Lock, ArrowRight } from 'lucide-react';
import Image from 'next/image';
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
    document.title = 'Admin Girişi - BlogGenerator';
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
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] via-[#0f0f0f] to-[#1a1a1a] flex items-center justify-center px-4 sm:px-8 py-8 sm:py-16">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-[#1a1a1a] rounded-2xl sm:rounded-[40px] p-6 sm:p-8 md:p-12 shadow-2xl border border-[#333333]"
        >
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-[#3B82F6]/20 rounded-xl sm:rounded-2xl mb-4 sm:mb-6">
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-[#3B82F6]" />
            </div>
            <h1
              className="text-2xl sm:text-[32px] font-normal leading-tight text-white mb-2 sm:mb-3"
              style={{
                fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
              }}
            >
              Admin Girişi
            </h1>
            <p
              className="text-sm sm:text-base text-[#ebebeb]"
              style={{
                fontFamily: 'var(--font-sans), "Inter", sans-serif',
              }}
            >
              Yönetici paneline erişim için giriş yapın
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-2xl">
                <p
                  className="text-sm text-red-400"
                  style={{
                    fontFamily: 'var(--font-sans), "Inter", sans-serif',
                  }}
                >
                  {error}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-white"
                style={{
                  fontFamily: 'var(--font-sans), "Inter", sans-serif',
                }}
              >
                E-posta
              </label>
              <div className="relative">
                <Shield className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[#ebebeb]" />
                <Input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@example.com"
                  required
                  className="pl-10 sm:pl-12 bg-[#0f0f0f] border-[#333333] text-white placeholder:text-[#ebebeb] focus-visible:ring-[#3B82F6] h-11 sm:h-12 text-sm sm:text-base"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-white"
                style={{
                  fontFamily: 'var(--font-sans), "Inter", sans-serif',
                }}
              >
                Şifre
              </label>
              <div className="relative">
                <Lock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[#ebebeb]" />
                <Input
                  id="password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="pl-10 sm:pl-12 bg-[#0f0f0f] border-[#333333] text-white placeholder:text-[#ebebeb] focus-visible:ring-[#3B82F6] h-11 sm:h-12 text-sm sm:text-base"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-full py-3 sm:py-[15px] hover:rounded-2xl transition-all duration-200 h-11 sm:h-12 text-sm sm:text-base font-semibold"
              style={{
                fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
              }}
            >
              {isSubmitting ? (
                'Giriş yapılıyor...'
              ) : (
                <>
                  Admin Girişi
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <Link
              href="/"
              className="text-sm text-[#ebebeb] hover:text-white transition-colors inline-flex items-center gap-2"
              style={{
                fontFamily: 'var(--font-sans), "Inter", sans-serif',
              }}
            >
              ← Ana Sayfaya Dön
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

