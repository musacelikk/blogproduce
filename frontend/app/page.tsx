import { BankingScaleHero } from '@/components/sections/BankingScaleHero';
import { NelerSunuyoruzSection } from '@/components/sections/NelerSunuyoruzSection';
import { FeatureHighlightsSection } from '@/components/sections/FeatureHighlightsSection';
import { AutopilotSection } from '@/components/sections/AutopilotSection';
import { PartnersCarousel } from '@/components/sections/PartnersCarousel';
import { TestimonialSection } from '@/components/sections/TestimonialSection';
import { HomepageBlogs } from '@/components/sections/HomepageBlogs';
import { PricingSection } from '@/components/sections/PricingSection';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://blogproduce.com';

export const metadata: Metadata = {
  title: 'BlogProduce - AI Destekli Blog İçerik Üretimi ve API',
  description: 'Prompt\'a göre size özel, SEO optimizasyonlu blog içerikleri üretin. BlogProduce AI destekli blog üretim uygulaması ve RESTful API ile web sitenizde, uygulamanızda veya otomasyon sistemlerinizde kullanılabilir. Dakikalar içinde profesyonel blog yazıları oluşturun.',
  openGraph: {
    title: 'BlogProduce - AI Destekli Blog İçerik Üretimi ve API',
    description: 'Prompt\'a göre size özel, SEO optimizasyonlu blog içerikleri üretin. Dakikalar içinde profesyonel blog yazıları oluşturun.',
    url: siteUrl,
    siteName: 'BlogProduce',
    images: [
      {
        url: `${siteUrl}/images/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'BlogProduce - AI Destekli Blog İçerik Üretimi',
      },
    ],
    locale: 'tr_TR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BlogProduce - AI Destekli Blog İçerik Üretimi ve API',
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
      <AutopilotSection />
      <FeatureHighlightsSection />
      <PartnersCarousel />
      <TestimonialSection />
      <HomepageBlogs />
      <div className="hidden md:block">
        <PricingSection />
      </div>
    </>
  );
}
