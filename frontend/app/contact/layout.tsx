import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://blogproduce.com';

export const metadata: Metadata = {
  title: 'İletişim',
  description: 'BlogGenerator ile iletişime geçin. Sorularınız, önerileriniz veya destek talepleriniz için bizimle iletişime geçin. Müşteri desteği ve teknik yardım için 7/24 destek.',
  openGraph: {
    title: 'İletişim - BlogGenerator',
    description: 'BlogGenerator ile iletişime geçin. Sorularınız, önerileriniz veya destek talepleriniz için bizimle iletişime geçin.',
    url: `${siteUrl}/contact`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'İletişim - BlogGenerator',
    description: 'BlogGenerator ile iletişime geçin. Sorularınız, önerileriniz veya destek talepleriniz için bizimle iletişime geçin.',
  },
  alternates: {
    canonical: `${siteUrl}/contact`,
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

