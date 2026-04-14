'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import {
  Mail, Lock, User, ArrowRight, ArrowLeft,
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
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex lg:w-[52%] xl:w-[55%] flex-col relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #f0f4ff 0%, #e8eeff 55%, #e0f7ff 100%)' }}
      >
        {/* Decorative orbs */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-40 blur-3xl" style={{ background: 'rgba(32,62,236,0.15)' }} />
        <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full opacity-30 blur-3xl" style={{ background: 'rgba(0,212,255,0.12)' }} />

        <div className="relative z-10 flex flex-col h-full p-10 xl:p-14">
          {/* Logo */}
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.55 }}>
            <Link href="/" className="inline-flex items-center gap-3">
              <Image src="/images/logo.png" alt="BlogProduce Logo" width={400} height={400} className="w-44 h-44 object-contain" />
            </Link>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="mt-12 mb-8"
          >
            <h2 className="text-3xl xl:text-4xl font-bold leading-tight tracking-tight mb-3" style={{ color: '#0f172a' }}>
              Bugün başlayın,<br />yarın yayınlayın
            </h2>
            <p className="text-sm xl:text-base leading-relaxed max-w-sm" style={{ color: '#64748b' }}>
              Ücretsiz hesap oluşturun ve AI destekli blog üretimine hemen başlayın. Kredi kartı gerekmez.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex gap-6 mb-10"
          >
            {highlights.map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 flex-shrink-0" style={{ background: 'linear-gradient(135deg,#203eec,#00d4ff)' }}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold leading-none" style={{ color: '#203eec' }}>{value}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{label}</p>
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
            <div
              className="rounded-2xl p-5 relative overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(32,62,236,0.12)' }}
            >
              <motion.div
                key={activeTestimonial}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.4 }}
              >
                <p className="text-sm leading-relaxed mb-3 italic" style={{ color: '#334155' }}>
                  &ldquo;{testimonials[activeTestimonial].text}&rdquo;
                </p>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: 'linear-gradient(135deg,#203eec,#00d4ff)' }}>
                    {testimonials[activeTestimonial].author[0]}
                  </div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: '#0f172a' }}>{testimonials[activeTestimonial].author}</p>
                    <p className="text-[10px]" style={{ color: '#64748b' }}>{testimonials[activeTestimonial].role}</p>
                  </div>
                </div>
              </motion.div>
            </div>
            {/* Dots */}
            <div className="flex gap-1.5 mt-3">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTestimonial(i)}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{ width: i === activeTestimonial ? 20 : 6, background: i === activeTestimonial ? '#203eec' : 'rgba(32,62,236,0.2)' }}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 md:px-10 lg:p-14 bg-background">
        <div className="w-full max-w-[420px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            {/* Back link */}
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-7 group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
              Ana Sayfaya Dön
            </Link>

            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-1.5">
                Hesap Oluştur
              </h1>
              <p className="text-sm text-muted-foreground">
                Ücretsiz başlayın, istediğiniz zaman yükseltin
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {error && (
                <div className="p-3.5 rounded-xl text-sm text-red-600" style={{ background: '#fee2e2', border: '1px solid #fecaca' }}>
                  {error}
                </div>
              )}

              {/* Name */}
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-xs font-medium text-foreground">Ad Soyad</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="name" type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Adınız Soyadınız" required className="pl-10 h-11 text-sm focus-visible:ring-[#203eec]" />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-medium text-foreground">E-posta</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="email" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="ornek@email.com" required className="pl-10 h-11 text-sm focus-visible:ring-[#203eec]" />
                </div>
              </div>

              {/* Password row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-xs font-medium text-foreground">Şifre</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="password" type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" required minLength={6} className="pl-10 h-11 text-sm focus-visible:ring-[#203eec]" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="confirmPassword" className="text-xs font-medium text-foreground">Tekrar</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="confirmPassword" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" required minLength={6} className="pl-10 h-11 text-sm focus-visible:ring-[#203eec]" />
                  </div>
                </div>
              </div>

              {/* Agreements */}
              <div className="space-y-2.5">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input type="checkbox" required className="mt-0.5 w-4 h-4 text-[#203eec] border-border rounded focus:ring-[#203eec] flex-shrink-0" />
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    <Link href="/terms" className="font-medium hover:underline" style={{ color: '#203eec' }}>Hizmet Şartları</Link>
                    {' '}ve{' '}
                    <Link href="/kvkk" className="font-medium hover:underline" style={{ color: '#203eec' }}>KVKK Aydınlatma Metni</Link>
                    {' '}ni okudum ve kabul ediyorum.
                  </span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input type="checkbox" className="mt-0.5 w-4 h-4 text-[#203eec] border-border rounded focus:ring-[#203eec] flex-shrink-0" />
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    <Link href="/privacy" className="font-medium hover:underline" style={{ color: '#203eec' }}>Gizlilik Politikası</Link>
                    {' '}nı okudum ve kabul ediyorum.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 rounded-full text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-90 hover:shadow-lg disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#203eec,#00d4ff)' }}
              >
                {isSubmitting ? 'Hesap oluşturuluyor…' : (
                  <>Kayıt Ol <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Zaten hesabınız var mı?{' '}
              <Link href="/login" className="font-semibold transition-colors hover:opacity-80" style={{ color: '#203eec' }}>
                Giriş Yap
              </Link>
            </p>

            {/* Trust badges */}
            <div className="mt-7 flex items-center justify-center gap-4 flex-wrap">
              {['SSL Güvenli', 'KVKK Uyumlu', 'Ücretsiz Başla'].map((t) => (
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
          <div className="flex flex-wrap items-center justify-center gap-3 mb-1.5">
            {[{ href: '/kvkk', label: 'KVKK' }, { href: '/privacy', label: 'Gizlilik' }, { href: '/terms', label: 'Şartlar' }, { href: '/cookie', label: 'Çerezler' }].map(({ href, label }) => (
              <Link key={href} href={href} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">{label}</Link>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground">
            © 2026{' '}
            <a href="https://ibbmtech.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              IBBM Tech.
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
