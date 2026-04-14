import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://blogproduce.com';

export const metadata: Metadata = {
  title: 'Hakkımızda',
  description: 'BlogGenerator hakkında bilgi edinin. AI destekli blog içerik üretimi konusundaki misyonumuz, vizyonumuz ve değerlerimiz. Profesyonel içerik üretimi için güvenilir çözüm.',
  openGraph: {
    title: 'Hakkımızda - BlogGenerator',
    description: 'BlogGenerator hakkında bilgi edinin. AI destekli blog içerik üretimi konusundaki misyonumuz, vizyonumuz ve değerlerimiz.',
    url: `${siteUrl}/about`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Hakkımızda - BlogGenerator',
    description: 'BlogGenerator hakkında bilgi edinin. AI destekli blog içerik üretimi konusundaki misyonumuz, vizyonumuz ve değerlerimiz.',
  },
  alternates: {
    canonical: `${siteUrl}/about`,
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
