import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://blogenerate.com';

export const metadata: Metadata = {
  title: 'KVKK Aydınlatma Metni',
  description: 'BlogGenerator KVKK aydınlatma metni. Kişisel verilerinizin işlenmesi, saklanması ve korunması hakkında detaylı bilgi. KVKK uyumlu veri koruma politikası.',
  openGraph: {
    title: 'KVKK Aydınlatma Metni - BlogGenerator',
    description: 'BlogGenerator KVKK aydınlatma metni. Kişisel verilerinizin işlenmesi, saklanması ve korunması hakkında detaylı bilgi.',
    url: `${siteUrl}/kvkk`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'KVKK Aydınlatma Metni - BlogGenerator',
    description: 'BlogGenerator KVKK aydınlatma metni. Kişisel verilerinizin işlenmesi, saklanması ve korunması hakkında detaylı bilgi.',
  },
  alternates: {
    canonical: `${siteUrl}/kvkk`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function KVKKLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
