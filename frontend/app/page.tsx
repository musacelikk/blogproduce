import { BankingScaleHero } from '@/components/sections/BankingScaleHero';
import { NelerSunuyoruzSection } from '@/components/sections/NelerSunuyoruzSection';
import { FeatureHighlightsSection } from '@/components/sections/FeatureHighlightsSection';
import { PartnersCarousel } from '@/components/sections/PartnersCarousel';
import { TestimonialSection } from '@/components/sections/TestimonialSection';
import { HomepageBlogs } from '@/components/sections/HomepageBlogs';
import { PricingSection } from '@/components/sections/PricingSection';
import { GradientBar } from '@/components/ui/gradient-bar';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://blogenerate.com';

export const metadata: Metadata = {
  title: 'BlogGenerator - AI Destekli Blog İçerik Üretimi ve API',
  description: 'Prompt\'a göre size özel, SEO optimizasyonlu blog içerikleri üretin. BlogGenerator AI destekli blog üretim uygulaması ve RESTful API ile web sitenizde, uygulamanızda veya otomasyon sistemlerinizde kullanılabilir. Dakikalar içinde profesyonel blog yazıları oluşturun.',
  openGraph: {
    title: 'BlogGenerator - AI Destekli Blog İçerik Üretimi ve API',
    description: 'Prompt\'a göre size özel, SEO optimizasyonlu blog içerikleri üretin. Dakikalar içinde profesyonel blog yazıları oluşturun.',
    url: siteUrl,
    siteName: 'BlogGenerator',
    images: [
      {
        url: `${siteUrl}/images/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'BlogGenerator - AI Destekli Blog İçerik Üretimi',
      },
    ],
    locale: 'tr_TR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BlogGenerator - AI Destekli Blog İçerik Üretimi ve API',
    description: 'Prompt\'a göre size özel, SEO optimizasyonlu blog içerikleri üretin. Dakikalar içinde profesyonel blog yazıları oluşturun.',
    images: [`${siteUrl}/images/og-image.png`],
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default async function Page() {
  return (
    <>
      <BankingScaleHero />
      <NelerSunuyoruzSection />
      <PartnersCarousel />
      <TestimonialSection />
      <HomepageBlogs />
      <div className="hidden md:block">
        <PricingSection />
      </div>
      <FeatureHighlightsSection />
      <GradientBar />
    </>
  );
}
