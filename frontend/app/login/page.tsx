'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Mail, Lock, ArrowRight, ArrowLeft, AlertCircle,
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
    document.title = 'Giriş Yap - BlogProduce';
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
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">

      {/* ── Left panel ── */}
      <div className="hidden border-r border-border bg-accent lg:flex lg:w-[52%] lg:flex-col xl:w-[55%]">
        <div className="flex h-full flex-col p-10 xl:p-14">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55 }}
          >
            <Link href="/" className="inline-flex items-center gap-3">
              <Image src="/images/logo.png" alt="BlogProduce Logo" width={400} height={400} className="h-32 w-32 object-contain" />
            </Link>
          </motion.div>

          {/* Hero text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="mb-8 mt-12"
          >
            <p className="text-eyebrow mb-3">Yapay zekâ destekli içerik</p>
            <h2 className="text-display-md mb-3 text-foreground-strong">
              AI ile dakikalar içinde<br />profesyonel blog yazıları
            </h2>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground xl:text-base">
              Prompt yazın, SEO uyumlu özgün içerik üretin. API veya web arayüzüyle kolayca entegre edin.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-10 flex gap-8"
          >
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-semibold tracking-tight text-primary tabular-nums">
                  {s.value}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Feature list */}
          <motion.ul
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-auto grid grid-cols-2 gap-3"
          >
            {features.map(({ icon: Icon, label }, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.35 + i * 0.06 }}
                className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5 shadow-card"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary">
                  <Icon className="h-3.5 w-3.5 text-primary-foreground" />
                </span>
                <span className="text-xs font-medium text-foreground xl:text-sm">{label}</span>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-10 md:px-10 lg:p-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="w-full max-w-md"
        >
          {/* Back link */}
          <Link
            href="/"
            className="group mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
            Ana Sayfaya Dön
          </Link>

          {/* Brand mark — the only identity cue on small screens, where the left panel is hidden */}
          <Link href="/" className="mb-5 inline-flex items-center gap-2.5 lg:hidden">
            <Image
              src="/images/logo.png"
              alt="BlogProduce"
              width={200}
              height={200}
              className="h-10 w-10 object-contain"
            />
            <span className="text-base font-semibold tracking-tight text-foreground-strong">
              BlogProduce
            </span>
          </Link>

          <div className="rounded-xl border border-border bg-card p-6 shadow-card sm:p-8">
            <div className="mb-7">
              <p className="text-eyebrow mb-2">Hesap</p>
              <h1 className="mb-1.5 text-2xl font-semibold tracking-tight text-foreground-strong">
                Giriş Yap
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Hesabınıza giriş yaparak blog üretimine devam edin
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-[var(--destructive-muted)] px-3.5 py-3 text-sm text-destructive"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-medium text-foreground">E-posta</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email" type="email" name="email"
                    value={formData.email} onChange={handleChange}
                    placeholder="ornek@email.com" required
                    className="h-11 pl-10 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs font-medium text-foreground">Şifre</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password" type="password" name="password"
                    value={formData.password} onChange={handleChange}
                    placeholder="••••••••" required
                    className="h-11 pl-10 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" className="h-3.5 w-3.5 rounded border-border accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                  <span className="text-muted-foreground">Beni hatırla</span>
                </label>
                <Link href="/forgot-password" className="font-medium text-accent-foreground transition-colors hover:underline">
                  Şifremi unuttum
                </Link>
              </div>

              <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Giriş yapılıyor…' : (
                  <>Giriş Yap <ArrowRight className="h-4 w-4" /></>
                )}
              </Button>
            </form>

            <p className="mt-7 text-center text-xs text-muted-foreground">
              Hesabınız yok mu?{' '}
              <Link href="/register" className="font-semibold text-accent-foreground transition-colors hover:underline">
                Kayıt Ol
              </Link>
            </p>
          </div>

          {/* Trust badges */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            {['SSL Güvenli', 'KVKK Uyumlu', 'Veri Şifreli'].map((t) => (
              <span key={t} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <CheckCircle2 className="h-3 w-3 text-success" />
                {t}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Mini footer */}
        <footer className="mt-auto w-full pt-8 text-center">
          <p className="text-[11px] text-muted-foreground">
            © 2026 <a href="https://bilalorhanlar.com" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-foreground">Bilal ORHANLAR</a>
          </p>
        </footer>
      </div>
    </div>
  );
}
