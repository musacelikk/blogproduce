'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Sparkles, Zap, Code2, Settings, Globe, Layers,
  ArrowRight, Shield, BarChart2, Check,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

/* ─── Showcase: mockup ile büyük bölümler ─── */
const showcases = [
  {
    tag: 'AI İçerik Üretimi',
    title: 'Bir prompt yaz, profesyonel blog hazır',
    description:
      'Konu, ton, hedef kitle ve uzunluğu belirle; AI dakikalar içinde SEO dostu, özgün blog içeriğini üretsin. Markdown, HTML veya JSON formatında teslim alabilirsin.',
    image: '/home.png',
    bullets: ['GPT-4o & Claude desteği', 'Otomatik SEO optimizasyonu', 'Resimli içerik üretimi', '50+ dil desteği'],
    reverse: false,
  },
  {
    tag: 'İçerik Yönetimi',
    title: 'Tüm bloglarını tek panelden yönet',
    description:
      'Taslak, incelemede ve yayınlandı durumlarıyla filtrele. Anlık önizleme, hızlı düzenleme ve tek tıkla yayın. Yüzlerce içeriği kolayca takip et.',
    image: '/blogs.png',
    bullets: ['Durum bazlı filtreleme', 'Önizleme & tek tıkla yayın', 'Arama ve sıralama', 'Toplu işlem desteği'],
    reverse: true,
  },
  {
    tag: 'Şeffaf Analitik',
    title: 'Token kullanımını gerçek zamanlı izle',
    description:
      'Workspace bazlı tüketim verilerini anlık takip et. Input/output token, istek sayısı ve aylık geçmiş ile bütçeni tam kontrol altında tut.',
    image: '/kullanım.png',
    bullets: ['Gerçek zamanlı izleme', 'Workspace bazlı raporlar', 'Aylık geçmiş grafiği', 'Bütçe uyarıları'],
    reverse: false,
  },
  {
    tag: 'Proje Organizasyonu',
    title: "Projelerini workspace'lerle ayır",
    description:
      'Her müşteri veya proje için bağımsız workspace: ayrı API anahtarı, ayrı blog listesi, ayrı kullanım takibi. Profesyonelce ölçeklen.',
    image: '/workspaces.png',
    bullets: ['Sınırsız workspace', 'Proje başına API anahtarı', 'Ekip erişim yönetimi', 'White-label hazır yapı'],
    reverse: true,
  },
];

/* ─── Küçük özellik kartları ─── */
const extras = [
  {
    icon: Code2,
    title: 'RESTful API',
    desc: 'Basit HTTP istekleri ile blog üretimini kendi sistemine entegre et. Webhook desteğiyle otomatik içerik akışı kur.',
  },
  {
    icon: Zap,
    title: 'Hızlı Üretim',
    desc: 'Dakikalar içinde profesyonel içerik. Zamanını tasarruf et, daha fazla yayın yap.',
  },
  {
    icon: Globe,
    title: 'Çok Dilli',
    desc: "50'den fazla dil desteği. Global kitleye aynı kalitede içerik üret.",
  },
  {
    icon: Shield,
    title: 'Güvenli Altyapı',
    desc: 'SSL/TLS şifreleme, bcrypt hashing, kurumsal güvenlik standartları.',
  },
  {
    icon: Settings,
    title: 'Tam Özelleştirme',
    desc: 'Ton, stil, uzunluk, format. Her parametreyi kontrol altında tut.',
  },
  {
    icon: Layers,
    title: 'Toplu İşlem',
    desc: "Birden fazla blogu aynı anda üret. Otomasyon pipeline'larına entegre et.",
  },
  {
    icon: BarChart2,
    title: 'Detaylı Raporlama',
    desc: 'İçerik performansı, kullanım eğilimleri ve aylık raporlar.',
  },
  {
    icon: Sparkles,
    title: 'Multi-Model',
    desc: 'GPT-4o, Claude ve daha fazlası. En iyi model seçeneğiyle içerik üret.',
  },
];

/* ─── Animasyon yardımcıları ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

function Section({ showcase, index }: { showcase: typeof showcases[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={stagger}
      className={`grid md:grid-cols-2 gap-8 md:gap-16 items-center ${showcase.reverse ? 'md:[&>*:first-child]:order-2' : ''}`}
    >
      {/* Text */}
      <motion.div variants={fadeUp} className="flex flex-col gap-5">
        <span className="inline-flex w-fit items-center px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase"
          style={{ background: 'linear-gradient(135deg,#203eec18,#00d4ff18)', color: '#203eec' }}>
          {showcase.tag}
        </span>
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight leading-tight text-foreground">
          {showcase.title}
        </h2>
        <p className="text-base leading-relaxed text-muted-foreground">
          {showcase.description}
        </p>
        <ul className="flex flex-col gap-2.5 mt-1">
          {showcase.bullets.map((b) => (
            <li key={b} className="flex items-center gap-2.5 text-sm">
              <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#203eec,#00d4ff)' }}>
                <Check className="w-3 h-3 text-white" strokeWidth={3} />
              </span>
              <span className="text-foreground font-medium">{b}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Mockup */}
      <motion.div variants={fadeUp} className="relative">
        <div className="absolute -inset-4 rounded-3xl opacity-30 blur-2xl"
          style={{ background: index % 2 === 0 ? 'linear-gradient(135deg,#203eec40,#00d4ff20)' : 'linear-gradient(135deg,#00d4ff20,#203eec40)' }} />
        <div className="relative rounded-2xl md:rounded-3xl overflow-hidden border"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--secondary)' }}>
          <Image
            src={showcase.image}
            alt={showcase.title}
            width={800}
            height={500}
            className="w-full h-auto object-contain"
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

function ExtrasGrid() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={stagger}
      className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {extras.map((item) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={item.title}
            variants={fadeUp}
            className="group flex flex-col gap-3 p-5 rounded-2xl border transition-all duration-300 hover:border-[#203eec]/40 hover:shadow-sm"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#203eec,#00d4ff)' }}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-base text-foreground">{item.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

export default function SolutionsPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const heroInView = useInView(heroRef, { once: true });

  return (
    <div className="min-h-screen bg-background">
      <main className="w-full pt-24 md:pt-32 pb-20">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12">

          {/* ── Hero ── */}
          <motion.div
            ref={heroRef}
            initial="hidden"
            animate={heroInView ? 'visible' : 'hidden'}
            variants={stagger}
            className="text-center mb-20 md:mb-28"
          >
            <motion.span
              variants={fadeUp}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-6"
              style={{ background: 'linear-gradient(135deg,#203eec18,#00d4ff18)', color: '#203eec' }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Çözümlerimiz
            </motion.span>
            <motion.h1
              variants={fadeUp}
              className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground mb-6 max-w-3xl mx-auto leading-[1.1]"
            >
              İçerik üretiminin{' '}
              <span style={{
                background: 'linear-gradient(135deg,#203eec,#00d4ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                her adımı
              </span>{' '}
              burada
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-10"
            >
              AI ile üret, panelinizden yönet, API ile yayınla. Baştan sona entegre bir içerik altyapısı.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg,#203eec,#00d4ff)' }}
              >
                Ücretsiz Başla
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all duration-200 hover:border-[#203eec] hover:text-[#203eec]"
                style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
              >
                Fiyatları Gör
              </Link>
            </motion.div>
          </motion.div>

          {/* ── Stats strip ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-px rounded-2xl overflow-hidden mb-20 md:mb-28"
            style={{ border: '1px solid var(--border)' }}
          >
            {[
              { val: '50+', label: 'Dil Desteği' },
              { val: 'GPT-4o', label: 'AI Modeli' },
              { val: 'REST', label: 'API Entegrasyonu' },
              { val: '%100', label: 'SEO Uyumlu' },
            ].map((stat) => (
              <div key={stat.label}
                className="flex flex-col items-center justify-center py-6 px-4 text-center"
                style={{ backgroundColor: 'var(--card)' }}>
                <span className="text-2xl md:text-3xl font-bold tracking-tight"
                  style={{ background: 'linear-gradient(135deg,#203eec,#00d4ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {stat.val}
                </span>
                <span className="text-xs text-muted-foreground mt-1 font-medium">{stat.label}</span>
              </div>
            ))}
          </motion.div>

          {/* ── Showcase sections ── */}
          <div className="flex flex-col gap-24 md:gap-32 mb-24 md:mb-32">
            {showcases.map((s, i) => (
              <Section key={s.tag} showcase={s} index={i} />
            ))}
          </div>

          {/* ── Section title ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-3">
              Ve daha fazlası
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-base">
              Her iş akışına uyum sağlayan esnek özellik seti.
            </p>
          </motion.div>

          {/* ── Extras grid ── */}
          <div className="mb-20 md:mb-28">
            <ExtrasGrid />
          </div>

          {/* ── CTA ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="relative overflow-hidden rounded-2xl md:rounded-3xl p-8 md:p-16 text-center"
            style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}
          >
            {/* background orb */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full opacity-10 blur-3xl pointer-events-none"
              style={{ background: 'linear-gradient(135deg,#203eec,#00d4ff)' }} />
            <div className="relative">
              <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: '#203eec' }}>
                Hemen başlayın
              </p>
              <h2 className="text-2xl md:text-4xl font-semibold tracking-tight text-foreground mb-4 max-w-xl mx-auto leading-tight">
                AI ile içerik üretiminde yeni bir çağ
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto text-sm md:text-base">
                Ücretsiz hesap oluştur, ilk blogunu dakikalar içinde yayınla.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-lg"
                  style={{ background: 'linear-gradient(135deg,#203eec,#00d4ff)' }}
                >
                  Ücretsiz Dene
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/docs"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all duration-200 hover:border-[#203eec] hover:text-[#203eec]"
                  style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
                >
                  API Dökümanı
                </Link>
              </div>
            </div>
          </motion.div>

        </div>
      </main>
    </div>
  );
}
