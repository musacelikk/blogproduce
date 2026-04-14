import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://blogproduce.com';

export const metadata: Metadata = {
  title: 'Hizmet Şartları',
  description: 'BlogProduce hizmet şartları ve kullanım koşulları. Platformu kullanırken uymanız gereken kurallar ve yasal yükümlülükler.',
  openGraph: {
    title: 'Hizmet Şartları - BlogProduce',
    description: 'BlogProduce hizmet şartları ve kullanım koşulları. Platformu kullanırken uymanız gereken kurallar ve yasal yükümlülükler.',
    url: `${siteUrl}/terms`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Hizmet Şartları - BlogProduce',
    description: 'BlogProduce hizmet şartları ve kullanım koşulları. Platformu kullanırken uymanız gereken kurallar ve yasal yükümlülükler.',
  },
  alternates: {
    canonical: `${siteUrl}/terms`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
