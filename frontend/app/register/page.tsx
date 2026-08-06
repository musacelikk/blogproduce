'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Mail, Lock, User, ArrowRight, ArrowLeft, AlertCircle,
  CheckCircle2, Star, Users, TrendingUp,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { register } from '@/lib/api';
import { trackRegistration } from '@/lib/analytics';

const testimonials = [
  {
    text: 'Dakikalar içinde SEO uyumlu blog üretimi inanılmaz kolaylaştı.',
    author: 'Mehmet A.',
    role: 'İçerik Yöneticisi',
  },
  {
    text: 'API entegrasyonu sayesinde tüm blog sürecimizi otomatize ettik.',
    author: 'Selin K.',
    role: 'Yazılım Geliştirici',
  },
];

const highlights = [
  { icon: Star,      value: '4.9/5',  label: 'Kullanıcı puanı' },
  { icon: Users,     value: '2.000+', label: 'Aktif kullanıcı' },
  { icon: TrendingUp,value: '50K+',   label: 'Blog üretildi' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    document.title = 'Kayıt Ol - BlogProduce';
    const timer = setInterval(() => setActiveTestimonial((p) => (p + 1) % testimonials.length), 4000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) { setError('Şifreler eşleşmiyor'); return; }
    if (formData.password.length < 6) { setError('Şifre en az 6 karakter olmalıdır'); return; }
    setIsSubmitting(true);
    try {
      await register(formData.email, formData.password, formData.name);
      trackRegistration('email');
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt oluşturulurken bir hata oluştu');
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
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.55 }}>
            <Link href="/" className="inline-flex items-center gap-3">
              <Image src="/images/logo.png" alt="BlogProduce Logo" width={400} height={400} className="h-32 w-32 object-contain" />
            </Link>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="mb-8 mt-12"
          >
            <p className="text-eyebrow mb-3">Ücretsiz hesap</p>
            <h2 className="text-display-md mb-3 text-foreground-strong">
              Bugün başlayın,<br />yarın yayınlayın
            </h2>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground xl:text-base">
              Ücretsiz hesap oluşturun ve AI destekli blog üretimine hemen başlayın. Kredi kartı gerekmez.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-10 flex gap-6"
          >
            {highlights.map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-start gap-2">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
                  <Icon className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-lg font-semibold leading-none text-primary tabular-nums">
                    {value}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Testimonial card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-auto"
          >
            <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-card">
              <motion.div
                key={activeTestimonial}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.4 }}
              >
                <p className="mb-3 text-sm leading-relaxed text-foreground">
                  &ldquo;{testimonials[activeTestimonial].text}&rdquo;
                </p>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {testimonials[activeTestimonial].author[0]}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{testimonials[activeTestimonial].author}</p>
                    <p className="text-[11px] text-muted-foreground">{testimonials[activeTestimonial].role}</p>
                  </div>
                </div>
              </motion.div>
            </div>
            {/* Dots */}
            <div className="mt-3 flex gap-1.5">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Yorum ${i + 1}`}
                  onClick={() => setActiveTestimonial(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === activeTestimonial ? 'w-5 bg-primary' : 'w-1.5 bg-border'
                  }`}
                />
              ))}
            </div>
          </motion.div>
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
            <div className="mb-6">
              <p className="text-eyebrow mb-2">Hesap</p>
              <h1 className="mb-1.5 text-2xl font-semibold tracking-tight text-foreground-strong">
                Hesap Oluştur
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Ücretsiz başlayın, istediğiniz zaman yükseltin
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

              {/* Name */}
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-xs font-medium text-foreground">Ad Soyad</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="name" type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Adınız Soyadınız" required className="h-11 pl-10 text-sm" />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-medium text-foreground">E-posta</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="ornek@email.com" required className="h-11 pl-10 text-sm" />
                </div>
              </div>

              {/* Password row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-xs font-medium text-foreground">Şifre</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="password" type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" required minLength={6} className="h-11 pl-10 text-sm" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="confirmPassword" className="text-xs font-medium text-foreground">Tekrar</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="confirmPassword" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" required minLength={6} className="h-11 pl-10 text-sm" />
                  </div>
                </div>
              </div>

              {/* Agreements */}
              <div className="space-y-2.5">
                <label className="flex cursor-pointer items-start gap-2.5">
                  <input type="checkbox" required className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                  <span className="text-xs leading-relaxed text-muted-foreground">
                    <Link href="/terms" className="font-medium text-accent-foreground hover:underline">Hizmet Şartları</Link>
                    {' '}ve{' '}
                    <Link href="/kvkk" className="font-medium text-accent-foreground hover:underline">KVKK Aydınlatma Metni</Link>
                    {' '}ni okudum ve kabul ediyorum.
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-2.5">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                  <span className="text-xs leading-relaxed text-muted-foreground">
                    <Link href="/privacy" className="font-medium text-accent-foreground hover:underline">Gizlilik Politikası</Link>
                    {' '}nı okudum ve kabul ediyorum.
                  </span>
                </label>
              </div>

              <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Hesap oluşturuluyor…' : (
                  <>Kayıt Ol <ArrowRight className="h-4 w-4" /></>
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Zaten hesabınız var mı?{' '}
              <Link href="/login" className="font-semibold text-accent-foreground transition-colors hover:underline">
                Giriş Yap
              </Link>
            </p>
          </div>

          {/* Trust badges */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            {['SSL Güvenli', 'KVKK Uyumlu', 'Ücretsiz Başla'].map((t) => (
              <span key={t} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <CheckCircle2 className="h-3 w-3 text-success" />
                {t}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Mini footer */}
        <footer className="mt-auto w-full pt-8 text-center">
          <div className="mb-1.5 flex flex-wrap items-center justify-center gap-3">
            {[{ href: '/kvkk', label: 'KVKK' }, { href: '/privacy', label: 'Gizlilik' }, { href: '/terms', label: 'Şartlar' }, { href: '/cookie', label: 'Çerezler' }].map(({ href, label }) => (
              <Link key={href} href={href} className="text-[11px] text-muted-foreground transition-colors hover:text-foreground">{label}</Link>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            © 2026 <a href="https://bilalorhanlar.com" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-foreground">Bilal ORHANLAR</a>
          </p>
        </footer>
      </div>
    </div>
  );
}
