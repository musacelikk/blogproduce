import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://blogproduce.com';

export const metadata: Metadata = {
  title: 'Gizlilik Politikası',
  description: 'BlogGenerator gizlilik politikası. Kişisel verilerinizin nasıl toplandığı, kullanıldığı ve korunduğu hakkında bilgi edinin. KVKK uyumlu gizlilik politikamız.',
  openGraph: {
    title: 'Gizlilik Politikası - BlogGenerator',
    description: 'BlogGenerator gizlilik politikası. Kişisel verilerinizin nasıl toplandığı, kullanıldığı ve korunduğu hakkında bilgi edinin.',
    url: `${siteUrl}/privacy`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Gizlilik Politikası - BlogGenerator',
    description: 'BlogGenerator gizlilik politikası. Kişisel verilerinizin nasıl toplandığı, kullanıldığı ve korunduğu hakkında bilgi edinin.',
  },
  alternates: {
    canonical: `${siteUrl}/privacy`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
