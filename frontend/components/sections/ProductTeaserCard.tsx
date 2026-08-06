'use client';

import { ArrowUpRight, Code2, Search, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type ProductTeaserCardProps = {
  dailyVolume?: string;
  dailyVolumeLabel?: string;
  headline?: string;
  subheadline?: string;
  primaryButtonText?: string;
  primaryButtonHref?: string;
  secondaryButtonText?: string;
  secondaryButtonHref?: string;
};

const valuePills = [
  { icon: Code2, label: 'API ile sitene direkt göm' },
  { icon: Search, label: 'SEO için çok etkili' },
  { icon: Zap, label: 'Kurulumu çok basit' },
];

export const ProductTeaserCard = (props: ProductTeaserCardProps) => {
  const router = useRouter();
  const {
    dailyVolumeLabel = 'GÜNLÜK ÜRETİLEN BLOG',
    headline = "SEO'ya uygun blog içeriği. API ile sitenize direkt gömün.",
    subheadline =
      "Prompt yazın, AI ile özgün blog üretin. RESTful API ile içeriği sitenize, uygulamanıza veya otomasyona tek satırla entegre edin. Çok basit — dakikalar içinde hazır.",
    primaryButtonText = 'Ücretsiz Dene',
    primaryButtonHref = '#pricing',
    secondaryButtonText = 'API Dokümantasyonu',
    secondaryButtonHref = '/docs',
  } = props;

  return (
    <section id="home" className="relative w-full overflow-hidden bg-background pb-20 pt-32 sm:pb-28 sm:pt-40">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-32 h-[520px] w-[520px] rounded-full bg-accent blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="max-w-2xl lg:max-w-none">
            <p className="mb-6 inline-flex items-center gap-1.5 text-eyebrow">
              {dailyVolumeLabel}
              <ArrowUpRight className="h-4 w-4" />
            </p>
            <h1 className="mb-6 text-balance text-display-lg text-foreground-strong">
              {headline}
            </h1>
            <p className="mb-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
              {subheadline}
            </p>

            <div className="mb-10 flex flex-wrap gap-2">
              {valuePills.map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-card"
                >
                  <Icon className="h-4 w-4 text-accent-foreground" />
                  {label}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button size="xl" onClick={() => router.push('/login')}>
                {primaryButtonText}
              </Button>
              <Button asChild variant="outline" size="xl">
                <Link href={secondaryButtonHref}>{secondaryButtonText}</Link>
              </Button>
            </div>
          </div>

          <div className="relative order-first mx-auto max-w-2xl lg:order-none lg:mx-0 lg:max-w-none lg:pl-8">
            <div className="relative aspect-[4/3] max-h-[280px] overflow-hidden rounded-xl border border-border bg-card shadow-elevated md:max-h-[360px] lg:max-h-[420px]">
              <Image
                src="/images/Gemini_Generated_Image_5oknoz5oknoz5okn.png"
                alt="BlogProduce — AI destekli blog üretimi"
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
