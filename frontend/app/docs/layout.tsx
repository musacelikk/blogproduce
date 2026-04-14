import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://blogproduce.com';

export const metadata: Metadata = {
  title: 'API Dokümantasyonu',
  description: 'BlogGenerator API dokümantasyonu. RESTful API ile blog içeriklerini listeleyin, yönetin ve entegre edin. Kimlik doğrulama, endpoint referansı ve kod örnekleri.',
  openGraph: {
    title: 'API Dokümantasyonu - BlogGenerator',
    description: 'BlogGenerator API ile blog içeriklerini listeleyin, yönetin ve entegre edin. Kimlik doğrulama, endpoint referansı ve kod örnekleri.',
    url: `${siteUrl}/docs`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'API Dokümantasyonu - BlogGenerator',
    description: 'BlogGenerator API dokümantasyonu. RESTful API ile blog içeriklerini listeleyin ve entegre edin.',
  },
  alternates: {
    canonical: `${siteUrl}/docs`,
  },
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
