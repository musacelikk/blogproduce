'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Sparkles, Zap, Code2, Settings, Globe, Layers,
  ArrowRight, Shield, BarChart2, Check,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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

function Section({ showcase }: { showcase: typeof showcases[0] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={stagger}
      className={`grid items-center gap-8 md:grid-cols-2 md:gap-16 ${
        showcase.reverse ? 'md:[&>*:first-child]:order-2' : ''
      }`}
    >
      {/* Text */}
      <motion.div variants={fadeUp} className="flex flex-col gap-5">
        <Badge className="w-fit uppercase tracking-wide">{showcase.tag}</Badge>
        <h2 className="text-2xl font-semibold leading-tight tracking-tight text-foreground md:text-3xl lg:text-4xl">
          {showcase.title}
        </h2>
        <p className="text-base leading-relaxed text-muted-foreground">
          {showcase.description}
        </p>
        <ul className="mt-1 flex flex-col gap-2.5">
          {showcase.bullets.map((b) => (
            <li key={b} className="flex items-center gap-2.5 text-sm">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary">
                <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
              </span>
              <span className="font-medium text-foreground">{b}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Mockup */}
      <motion.div variants={fadeUp}>
        <div className="overflow-hidden rounded-xl border border-border bg-secondary shadow-card">
          <Image
            src={showcase.image}
            alt={showcase.title}
            width={800}
            height={500}
            className="h-auto w-full object-contain"
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
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {extras.map((item) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={item.title}
            variants={fadeUp}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-card transition-shadow hover:shadow-card-hover"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent">
              <Icon className="h-5 w-5 text-accent-foreground" />
            </div>
            <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
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
      <main className="w-full pb-16 pt-32 sm:pb-24 sm:pt-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* ── Hero ── */}
          <motion.div
            ref={heroRef}
            initial="hidden"
            animate={heroInView ? 'visible' : 'hidden'}
            variants={stagger}
            className="mb-16 text-center sm:mb-24"
          >
            <motion.div variants={fadeUp}>
              <Badge className="mb-6 uppercase tracking-wide">
                <Sparkles className="h-3.5 w-3.5" />
                Çözümlerimiz
              </Badge>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              className="mx-auto mb-6 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl"
            >
              İçerik üretiminin <span className="text-primary">her adımı</span> burada
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="mx-auto mb-10 max-w-2xl text-base text-muted-foreground sm:text-lg"
            >
              AI ile üret, panelinizden yönet, API ile yayınla. Baştan sona entegre bir içerik altyapısı.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/register">
                  Ücretsiz Başla
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/pricing">Fiyatları Gör</Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* ── Stats strip ── */}
          <motion.dl
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-16 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border shadow-card sm:mb-24 md:grid-cols-4"
          >
            {[
              { val: '50+', label: 'Dil Desteği' },
              { val: 'GPT-4o', label: 'AI Modeli' },
              { val: 'REST', label: 'API Entegrasyonu' },
              { val: '%100', label: 'SEO Uyumlu' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center justify-center bg-card px-4 py-6 text-center"
              >
                <dt className="text-2xl font-semibold tracking-tight text-primary md:text-3xl">
                  {stat.val}
                </dt>
                <dd className="mt-1 text-xs font-medium text-muted-foreground">{stat.label}</dd>
              </div>
            ))}
          </motion.dl>

          {/* ── Showcase sections ── */}
          <div className="mb-16 flex flex-col gap-20 sm:mb-24 md:gap-28">
            {showcases.map((s) => (
              <Section key={s.tag} showcase={s} />
            ))}
          </div>

          {/* ── Section title ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10 text-center"
          >
            <h2 className="mb-3 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Ve daha fazlası
            </h2>
            <p className="mx-auto max-w-xl text-sm text-muted-foreground md:text-base">
              Her iş akışına uyum sağlayan esnek özellik seti.
            </p>
          </motion.div>

          {/* ── Extras grid ── */}
          <div className="mb-16 sm:mb-24">
            <ExtrasGrid />
          </div>

          {/* ── CTA ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="rounded-xl border border-border bg-accent p-8 text-center shadow-card md:p-16"
          >
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-accent-foreground">
              Hemen başlayın
            </p>
            <h2 className="mx-auto mb-4 max-w-xl text-2xl font-semibold leading-tight tracking-tight text-foreground md:text-4xl">
              AI ile içerik üretiminde yeni bir çağ
            </h2>
            <p className="mx-auto mb-8 max-w-lg text-sm text-muted-foreground md:text-base">
              Ücretsiz hesap oluştur, ilk blogunu dakikalar içinde yayınla.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/register">
                  Ücretsiz Dene
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/docs">API Dökümanı</Link>
              </Button>
            </div>
          </motion.div>

        </div>
      </main>
    </div>
  );
}
