'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import {
  Mail, Lock, ArrowRight, ArrowLeft,
  FileText, Zap, Globe, Code2, BarChart2, Sparkles, CheckCircle2,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { login } from '@/lib/api';
import { trackLogin } from '@/lib/analytics';

const features = [
  { icon: Sparkles, label: 'AI ile özgün blog metinleri' },
  { icon: FileText, label: 'SEO uyumlu başlık ve paragraflar' },
  { icon: Zap,      label: 'Dakikalar içinde içerik üretimi' },
  { icon: Globe,    label: 'Çok dilli içerik desteği' },
  { icon: Code2,    label: 'RESTful API entegrasyonu' },
  { icon: BarChart2,label: 'Kullanım ve raporlama paneli' },
];

const stats = [
  { value: '50K+', label: 'Blog üretildi' },
  { value: '98%',  label: 'Müşteri memnuniyeti' },
  { value: '<2dk', label: 'Ortalama üretim süresi' },
];

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Giriş Yap - BlogGenerator';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(formData.email, formData.password);
      trackLogin('email');
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş yapılırken bir hata oluştu');
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex lg:w-[52%] xl:w-[55%] flex-col relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #f0f4ff 0%, #e8eeff 55%, #e0f7ff 100%)' }}
      >
        {/* Decorative orbs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-40 blur-3xl" style={{ background: 'rgba(32,62,236,0.15)' }} />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-30 blur-3xl" style={{ background: 'rgba(0,212,255,0.12)' }} />

        <div className="relative z-10 flex flex-col h-full p-10 xl:p-14">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55 }}
          >
            <Link href="/" className="inline-flex items-center gap-3">
              <Image src="/images/logo.png" alt="BlogGenerator Logo" width={400} height={400} className="w-44 h-44 object-contain" />
            </Link>
          </motion.div>

          {/* Hero text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="mt-12 mb-8"
          >
            <h2 className="text-3xl xl:text-4xl font-bold leading-tight tracking-tight mb-3" style={{ color: '#0f172a' }}>
              AI ile dakikalar içinde<br />profesyonel blog yazıları
            </h2>
            <p className="text-sm xl:text-base leading-relaxed max-w-sm" style={{ color: '#64748b' }}>
              Prompt yazın, SEO uyumlu özgün içerik üretin. API veya web arayüzüyle kolayca entegre edin.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex gap-6 mb-10"
          >
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-bold" style={{ color: '#203eec' }}>{s.value}</p>
                <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{s.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Feature list */}
          <motion.ul
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid grid-cols-2 gap-2 mt-auto"
          >
            {features.map(({ icon: Icon, label }, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.35 + i * 0.06 }}
                className="flex items-center gap-2.5 py-2.5 px-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(32,62,236,0.12)' }}
              >
                <span className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#203eec,#00d4ff)' }}>
                  <Icon className="w-3.5 h-3.5 text-white" />
                </span>
                <span className="text-xs xl:text-sm font-medium" style={{ color: '#0f172a' }}>{label}</span>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 md:px-10 lg:p-14 bg-background">
        <div className="w-full max-w-[400px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            {/* Back link */}
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
              Ana Sayfaya Dön
            </Link>

            <div className="mb-7">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-1.5">
                Giriş Yap
              </h1>
              <p className="text-sm text-muted-foreground">
                Hesabınıza giriş yaparak blog üretimine devam edin
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-xl text-sm text-red-600" style={{ background: '#fee2e2', border: '1px solid #fecaca' }}>
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-medium text-foreground">E-posta</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email" type="email" name="email"
                    value={formData.email} onChange={handleChange}
                    placeholder="ornek@email.com" required
                    className="pl-10 h-11 text-sm focus-visible:ring-[#203eec]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs font-medium text-foreground">Şifre</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password" type="password" name="password"
                    value={formData.password} onChange={handleChange}
                    placeholder="••••••••" required
                    className="pl-10 h-11 text-sm focus-visible:ring-[#203eec]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-3.5 h-3.5 rounded border-border text-[#203eec] focus:ring-[#203eec]" />
                  <span className="text-muted-foreground">Beni hatırla</span>
                </label>
                <Link href="/forgot-password" className="font-medium transition-colors hover:opacity-80" style={{ color: '#203eec' }}>
                  Şifremi unuttum
                </Link>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 rounded-full text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-90 hover:shadow-lg disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#203eec,#00d4ff)' }}
              >
                {isSubmitting ? 'Giriş yapılıyor…' : (
                  <>Giriş Yap <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <p className="mt-7 text-center text-xs text-muted-foreground">
              Hesabınız yok mu?{' '}
              <Link href="/register" className="font-semibold transition-colors hover:opacity-80" style={{ color: '#203eec' }}>
                Kayıt Ol
              </Link>
            </p>

            {/* Trust badges */}
            <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
              {['SSL Güvenli', 'KVKK Uyumlu', 'Veri Şifreli'].map((t) => (
                <span key={t} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <CheckCircle2 className="w-3 h-3" style={{ color: '#203eec' }} />
                  {t}
                </span>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Mini footer */}
        <footer className="mt-auto pt-8 w-full text-center">
          <p className="text-[10px] text-muted-foreground">
            © 2026{' '}
            <a href="https://skytechbilisim.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              Skytech Veri Bilişim Hizmetleri A.Ş.
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
