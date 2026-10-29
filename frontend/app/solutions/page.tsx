'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Sparkles, Zap, Code2, Settings, Globe, Layers,
  ArrowRight, Shield, BarChart2, Check,
} from 'lucide-react';
import Link from 'next/link';
import {
  ContentListMockup,
  GeneratorMockup,
  UsageMockup,
  WorkspacesMockup,
} from '@/components/sections/mockups';
import { SectionHeading } from '@/components/sections/SectionHeading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

/* ─── Showcase: mockup ile büyük bölümler ─── */
const showcases = [
  {
    tag: 'AI İçerik Üretimi',
    title: 'Bir prompt yaz, profesyonel blog hazır',
    description:
      'Konu, ton, hedef kitle ve uzunluğu belirle; AI dakikalar içinde SEO dostu, özgün blog içeriğini üretsin. Markdown, HTML veya JSON formatında teslim alabilirsin.',
    Mockup: GeneratorMockup,
    bullets: ['GPT-4o & Claude desteği', 'Otomatik SEO optimizasyonu', 'Resimli içerik üretimi', '50+ dil desteği'],
    reverse: false,
  },
  {
    tag: 'İçerik Yönetimi',
    title: 'Tüm bloglarını tek panelden yönet',
    description:
      'Taslak, incelemede ve yayınlandı durumlarıyla filtrele. Anlık önizleme, hızlı düzenleme ve tek tıkla yayın. Yüzlerce içeriği kolayca takip et.',
    Mockup: ContentListMockup,
    bullets: ['Durum bazlı filtreleme', 'Önizleme & tek tıkla yayın', 'Arama ve sıralama', 'Toplu işlem desteği'],
    reverse: true,
  },
  {
    tag: 'Şeffaf Analitik',
    title: 'Token kullanımını gerçek zamanlı izle',
    description:
      'Workspace bazlı tüketim verilerini anlık takip et. Input/output token, istek sayısı ve aylık geçmiş ile bütçeni tam kontrol altında tut.',
    Mockup: UsageMockup,
    bullets: ['Gerçek zamanlı izleme', 'Workspace bazlı raporlar', 'Aylık geçmiş grafiği', 'Bütçe uyarıları'],
    reverse: false,
  },
  {
    tag: 'Proje Organizasyonu',
    title: "Projelerini workspace'lerle ayır",
    description:
      'Her müşteri veya proje için bağımsız workspace: ayrı API anahtarı, ayrı blog listesi, ayrı kullanım takibi. Profesyonelce ölçeklen.',
    Mockup: WorkspacesMockup,
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
      <motion.div variants={fadeUp} className="flex flex-col">
        <p className="text-eyebrow">{showcase.tag}</p>
        <h2 className="mt-3 text-balance text-display-md text-foreground-strong">
          {showcase.title}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          {showcase.description}
        </p>
        <ul className="mt-6 flex flex-col gap-3">
          {showcase.bullets.map((b) => (
            <li key={b} className="flex items-center gap-3 text-sm">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
              <span className="font-medium text-foreground">{b}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Mockup — token'lardan kurulu, ekran görüntüsü değil. */}
      <motion.div variants={fadeUp}>
        <showcase.Mockup />
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
          <motion.div key={item.title} variants={fadeUp}>
            <Card className="h-full p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-base font-semibold text-foreground-strong">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
            </Card>
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
      <main className="w-full">

        {/* ── Hero ── */}
        <section className="border-b border-border pb-20 pt-32 sm:pb-28 sm:pt-40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              ref={heroRef}
              initial="hidden"
              animate={heroInView ? 'visible' : 'hidden'}
              variants={stagger}
              className="mx-auto max-w-3xl text-center"
            >
              <motion.div variants={fadeUp}>
                <Badge className="mb-6 uppercase tracking-[0.08em]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Çözümlerimiz
                </Badge>
              </motion.div>
              <motion.h1
                variants={fadeUp}
                className="text-balance text-display-xl text-foreground-strong"
              >
                İçerik üretiminin <span className="text-primary">her adımı</span> burada
              </motion.h1>
              <motion.p
                variants={fadeUp}
                className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground"
              >
                AI ile üretin, panelden yönetin, API ile yayınlayın — baştan sona entegre bir içerik
                altyapısı.
              </motion.p>
              <motion.div
                variants={fadeUp}
                className="mt-10 flex flex-col justify-center gap-3 sm:flex-row"
              >
                <Button asChild size="xl">
                  <Link href="/register">
                    Ücretsiz Başla
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="xl">
                  <Link href="/pricing">Fiyatları Gör</Link>
                </Button>
              </motion.div>
            </motion.div>

            {/* ── Güven şeridi ── */}
            <motion.dl
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border shadow-card sm:mt-20 md:grid-cols-4"
            >
              {[
                { val: '50+', label: 'Dil desteği' },
                { val: 'GPT-4o', label: 'AI modeli' },
                { val: 'REST', label: 'API entegrasyonu' },
                { val: '%100', label: 'SEO uyumlu' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col items-center justify-center bg-card px-4 py-7 text-center"
                >
                  <dt className="text-2xl font-semibold tracking-tight tabular-nums text-primary md:text-3xl">
                    {stat.val}
                  </dt>
                  <dd className="mt-1.5 text-sm text-muted-foreground">{stat.label}</dd>
                </div>
              ))}
            </motion.dl>
          </div>
        </section>

        {/* ── Showcase bölümleri ── */}
        <section className="border-b border-border bg-card py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-20 md:gap-28">
              {showcases.map((s) => (
                <Section key={s.tag} showcase={s} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Ek özellikler ── */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              align="center"
              eyebrow="Ve daha fazlası"
              title="Her iş akışına uyum sağlayan esnek özellik seti"
            />
            <div className="mt-14">
              <ExtrasGrid />
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="pb-20 sm:pb-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
            >
              <Card variant="emphasis" className="p-10 text-center md:p-16">
                <p className="text-eyebrow">Hemen başlayın</p>
                <h2 className="mx-auto mt-3 max-w-xl text-balance text-display-md text-foreground-strong">
                  AI ile içerik üretiminde yeni bir çağ
                </h2>
                <p className="mx-auto mt-4 max-w-lg leading-relaxed text-muted-foreground">
                  Ücretsiz hesap oluşturun, ilk blogunuzu dakikalar içinde yayınlayın.
                </p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <Button asChild size="xl">
                    <Link href="/register">
                      Ücretsiz Dene
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="xl">
                    <Link href="/docs">API Dokümantasyonu</Link>
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        </section>

      </main>
    </div>
  );
}
