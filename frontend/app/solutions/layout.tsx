import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://blogproduce.com';

export const metadata: Metadata = {
  title: 'Çözümlerimiz',
  description: 'BlogGenerator ile içerik üretim sürecinizi kolaylaştıran kapsamlı çözümler. RESTful API, webhook entegrasyonları, SEO optimizasyonu ve çok dilli destek ile işletmenizin içerik ihtiyaçlarını karşılayın.',
  openGraph: {
    title: 'Çözümlerimiz - BlogGenerator',
    description: 'BlogGenerator ile içerik üretim sürecinizi kolaylaştıran kapsamlı çözümler.',
    url: `${siteUrl}/solutions`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Çözümlerimiz - BlogGenerator',
    description: 'BlogGenerator ile içerik üretim sürecinizi kolaylaştıran kapsamlı çözümler.',
  },
  alternates: {
    canonical: `${siteUrl}/solutions`,
  },
};

export default function SolutionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

