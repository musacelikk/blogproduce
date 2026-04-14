import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://blogproduce.com';

export const metadata: Metadata = {
  title: 'Fiyatlandırma',
  description: 'BlogProduce fiyatlandırma planları. İhtiyacınıza uygun planı seçin. Başlangıç, Profesyonel ve Kurumsal planlarımızla SEO optimizasyonlu blog içerikleri üretin. 14 gün ücretsiz deneme.',
  openGraph: {
    title: 'Fiyatlandırma - BlogProduce',
    description: 'BlogProduce fiyatlandırma planları. İhtiyacınıza uygun planı seçin. 14 gün ücretsiz deneme.',
    url: `${siteUrl}/pricing`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Fiyatlandırma - BlogProduce',
    description: 'BlogProduce fiyatlandırma planları. İhtiyacınıza uygun planı seçin.',
  },
  alternates: {
    canonical: `${siteUrl}/pricing`,
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

