'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Lightbulb, ShieldCheck, Users, Compass, Target } from 'lucide-react';

import { SectionHeading } from '@/components/sections/SectionHeading';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const values = [
  {
    icon: Lightbulb,
    title: 'İnovasyon',
    description:
      "En gelişmiş AI modellerini kullanarak, prompt'a göre özelleştirilebilir bir blog üretim API'si geliştiriyoruz.",
  },
  {
    icon: ShieldCheck,
    title: 'Kalite',
    description:
      'Ürettiğimiz her içerikte SEO optimizasyonu, okunabilirlik ve tutarlı kalite standardını garanti ediyoruz.',
  },
  {
    icon: Users,
    title: 'Kullanıcı Odaklılık',
    description:
      'Web arayüzü ve RESTful API tarafında deneyimi kullanıcı geri bildirimleriyle sürekli iyileştiriyoruz.',
  },
];

const stats = [
  { value: '2024', label: 'Kuruluş yılı' },
  { value: '50+', label: 'Desteklenen dil' },
  { value: '3B+', label: 'Günlük üretilen içerik' },
  { value: '%99', label: 'SEO uyumluluk oranı' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 1, 0.5, 1] as const } },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero ── */}
      <section className="border-b border-border pb-20 pt-32 sm:pb-28 sm:pt-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-3xl">
            <p className="text-eyebrow">Hakkımızda</p>
            <h1 className="mt-3 text-balance text-display-xl text-foreground-strong">
              İçerik üretimini geliştiricilerin hızına taşıyoruz
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              BlogProduce, AI destekli blog üretim uygulaması ve RESTful API&apos;si. Prompt&apos;a
              göre size özel, SEO optimizasyonlu içerikleri dakikalar içinde üretiyoruz.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="xl">
                <Link href="/register">
                  Ücretsiz Başla
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="xl">
                <Link href="/contact">Bize Ulaşın</Link>
              </Button>
            </div>
          </motion.div>
        </div>

        <div className="mx-auto mt-16 max-w-7xl px-4 sm:mt-20 sm:px-6 lg:px-8">
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border shadow-card md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-card px-6 py-7">
                <dt className="text-2xl font-semibold tracking-tight tabular-nums text-primary md:text-3xl">
                  {stat.value}
                </dt>
                <dd className="mt-1.5 text-sm text-muted-foreground">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Misyon & Vizyon ── */}
      <section className="border-b border-border bg-card py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Neden buradayız"
            title="Misyonumuz ve vizyonumuz"
            description="Her ekibin kendi sistemine gömebileceği, güvenilir bir içerik altyapısı kurmak istiyoruz."
          />

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeUp}
            className="mt-16 grid gap-12 md:grid-cols-2 md:gap-16"
          >
            <div className="md:border-r md:border-border md:pr-16">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Target className="h-5 w-5" />
              </span>
              <h3 className="mt-6 text-display-md text-foreground-strong">Misyonumuz</h3>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                İçerik üreticileri ve geliştiricilerin blog üretim süreçlerini hızlandırmak.
                Prompt&apos;a göre size özel, SEO optimizasyonlu içerikler üreterek zamandan tasarruf
                etmenizi ve daha fazla yayın yapmanızı sağlıyoruz.
              </p>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Üretilen içerik web arayüzünden yönetilebilir, RESTful API ile sitenize,
                uygulamanıza veya otomasyon sistemlerinize doğrudan entegre edilebilir.
              </p>
            </div>

            <div>
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Compass className="h-5 w-5" />
              </span>
              <h3 className="mt-6 text-display-md text-foreground-strong">Vizyonumuz</h3>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Blog üretim süreçlerinde AI destekli API&apos;lerin vazgeçilmez bir araç haline
                geleceğini öngörüyoruz. Her geliştirici, kendi sistemine entegre edebileceği güçlü
                bir üretim katmanına ihtiyaç duyacak.
              </p>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Bu doğrultuda, sürekli gelişen AI teknolojimiz ve kullanıcı odaklı yaklaşımımızla
                özelleştirilebilir, SEO optimizasyonlu ve entegre edilebilir çözümler sunmaya devam
                edeceğiz.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Değerler ── */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            align="center"
            eyebrow="Değerlerimiz"
            title="Her kararımızın arkasındaki üç ilke"
          />

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <Card key={value.title} className="p-8">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-6 text-lg font-semibold text-foreground-strong">
                    {value.title}
                  </h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{value.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="pb-20 sm:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Card variant="emphasis" className="p-10 text-center md:p-16">
            <p className="text-eyebrow">Hemen başlayın</p>
            <h2 className="mx-auto mt-3 max-w-2xl text-balance text-display-md text-foreground-strong">
              İlk blogunuzu bugün yayınlayın
            </h2>
            <p className="mx-auto mt-4 max-w-lg leading-relaxed text-muted-foreground">
              Ücretsiz hesap oluşturun, kredi kartı gerekmeden deneyin.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="xl">
                <Link href="/register">
                  Ücretsiz Başla
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="xl">
                <Link href="/docs">API Dokümantasyonu</Link>
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
