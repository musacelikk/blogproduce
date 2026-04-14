import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://blogproduce.com';

export const metadata: Metadata = {
  title: 'Çerez Politikası',
  description: 'BlogGenerator çerez politikası. Web sitemizde kullanılan çerezler, amaçları ve nasıl yönetileceği hakkında bilgi.',
  openGraph: {
    title: 'Çerez Politikası - BlogGenerator',
    description: 'BlogGenerator çerez politikası. Web sitemizde kullanılan çerezler, amaçları ve nasıl yönetileceği hakkında bilgi.',
    url: `${siteUrl}/cookie`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Çerez Politikası - BlogGenerator',
    description: 'BlogGenerator çerez politikası. Web sitemizde kullanılan çerezler, amaçları ve nasıl yönetileceği hakkında bilgi.',
  },
  alternates: {
    canonical: `${siteUrl}/cookie`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function CookieLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
