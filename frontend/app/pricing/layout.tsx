import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://blogproduce.com';

export const metadata: Metadata = {
  title: 'Fiyatlandırma',
  description: 'BlogProduce fiyatlandırma planları. Başlangıç, Profesyonel ve Kurumsal planlarla SEO optimizasyonlu blog içerikleri üretin, ek token paketleriyle tamamlayın. 7 gün ücretsiz deneme, kredi kartı gerekmez.',
  openGraph: {
    title: 'Fiyatlandırma - BlogProduce',
    description: 'BlogProduce fiyatlandırma planları. İhtiyacınıza uygun planı seçin. 7 gün ücretsiz deneme, kredi kartı gerekmez.',
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

