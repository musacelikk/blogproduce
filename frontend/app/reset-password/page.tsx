'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Lock, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
    <div className="min-h-screen flex flex-col lg:flex-row relative pb-12 md:pb-8" style={{ background: 'var(--background)' }}>
      {/* Sol taraf - görsel */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12" style={{ background: 'linear-gradient(160deg, #f0f4ff 0%, #e8eeff 55%, #e0f7ff 100%)' }}>
        <div className="max-w-lg w-full">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <Link href="/" className="inline-flex items-center gap-3">
              <Image
                src="/images/logo.png"
                alt="BlogGenerator Logo"
                width={400}
                height={400}
                className="w-44 h-44 object-contain"
              />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white rounded-3xl flex justify-center items-center aspect-square overflow-hidden shadow-lg"
            style={{
              backgroundImage: 'url(/images/Gemini_Generated_Image_5oknoz5oknoz5okn.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />
        </div>
      </div>

      {/* Sağ taraf - Şifre Sıfırlama formu */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-8 md:px-8 lg:p-12">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm md:text-base text-[#666666] hover:text-[#202020] transition-colors mb-6 md:mb-8 group"
            >
              <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Giriş ekranına dön</span>
            </Link>

            <div className="mb-6 md:mb-8">
              <h1
                className="text-2xl md:text-3xl font-semibold tracking-tight text-[#202020] mb-2 md:mb-3"
              >
                Yeni Şifre Belirle
              </h1>
              <p
                className="text-sm md:text-base text-[#666666]"
              >
                Hesabınız için yeni bir şifre belirleyin.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {status === 'success' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-2xl">
                  <p
                    className="text-sm text-green-700"
                  >
                    Şifreniz başarıyla güncellendi. Giriş ekranına yönlendiriliyorsunuz...
                  </p>
                </div>
              )}

              {status === 'error' && error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
                  <p
                    className="text-sm text-red-600"
                  >
                    {error}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-xs md:text-sm font-medium text-[#202020]"
                >
                  Yeni Şifre
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-[#999999]" />
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="pl-10 md:pl-12 bg-background border-border focus-visible:ring-[#203eec] h-11 md:h-12 text-sm md:text-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="text-xs md:text-sm font-medium text-[#202020]"
                >
                  Yeni Şifre (Tekrar)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-[#999999]" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="pl-10 md:pl-12 bg-background border-border focus-visible:ring-[#203eec] h-11 md:h-12 text-sm md:text-base"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !token}
                className="w-full bg-[#203eec] hover:bg-[#1a32cc] text-white rounded-full py-3 md:py-[15px] hover:rounded-2xl transition-all duration-200 h-11 md:h-12 text-sm md:text-base font-semibold"
              >
                {isSubmitting ? (
                  'Şifre güncelleniyor...'
                ) : (
                  <>
                    Şifreyi Güncelle
                    <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#203eec] mx-auto mb-4"></div>
          <p className="text-[#666666]">Yükleniyor...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}


