import type { Metadata } from 'next';
import { Inter_Tight } from 'next/font/google';
import './globals.css';
import { PortfolioNavbar } from '@/components/layout/PortfolioNavbar';
import { Footer } from '@/components/layout/Footer';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';

const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-inter-tight',
  weight: ['400', '500', '600', '700', '800'],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://blogproduce.com';
const siteName = 'BlogProduce';
const defaultTitle = 'BlogProduce - AI Destekli Blog İçerik Üretimi ve API | SEO Optimizasyonlu Blog Yazıları';
const defaultDescription = 'Prompt\'a göre size özel, SEO optimizasyonlu blog içerikleri üretin. BlogProduce AI destekli blog üretim uygulaması ve RESTful API ile web sitenizde, uygulamanızda veya otomasyon sistemlerinizde kullanılabilir. Dakikalar içinde profesyonel blog yazıları oluşturun.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: `%s | ${siteName}`,
  },
  description: defaultDescription,
  keywords: [
    'blog üretimi',
    'AI blog',
    'SEO blog',
    'blog API',
    'yapay zeka blog',
    'blog içerik üretimi',
    'RESTful API',
    'prompt blog',
    'özel blog içeriği',
    'otomatik blog yazma',
    'içerik üretim API',
    'blog yazılımı',
    'SEO optimizasyon',
    'AI içerik üretimi',
    'blog otomasyonu',
  ],
  authors: [{ name: 'BlogProduce Team' }],
  creator: 'BlogProduce',
  publisher: 'BlogProduce',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: siteUrl,
    siteName: siteName,
    title: defaultTitle,
    description: defaultDescription,
    images: [
      {
        url: `${siteUrl}/images/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'BlogProduce - AI Destekli Blog İçerik Üretimi',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: defaultTitle,
    description: defaultDescription,
    images: [`${siteUrl}/images/og-image.png`],
    creator: '@blogenerator',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  category: 'Technology',
  classification: 'Business Software',
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'mobile-web-app-capable': 'yes',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://blogproduce.com';
  const description = 'Prompt\'a göre size özel, SEO optimizasyonlu blog içerikleri üretin. BlogProduce AI destekli blog üretim uygulaması ve RESTful API ile web sitenizde, uygulamanızda veya otomasyon sistemlerinizde kullanılabilir. Dakikalar içinde profesyonel blog yazıları oluşturun.';
  
  // Structured Data (JSON-LD) for Organization
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'BlogProduce',
    url: siteUrl,
    logo: `${siteUrl}/images/logo.png`,
    description: description,
    sameAs: [
      // Add social media links here if available
      // 'https://twitter.com/blogenerator',
      // 'https://linkedin.com/company/blogenerator',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      availableLanguage: ['Turkish', 'English'],
    },
  };

  // Structured Data for SoftwareApplication
  const softwareApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'BlogProduce',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150',
    },
  };

  return (
    <html lang="tr">
      <head>
        <link rel="canonical" href={siteUrl} />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/images/logo.png" />
        <meta name="theme-color" content="#203eec" />
        <meta name="msapplication-TileColor" content="#203eec" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
        />
      </head>
      <body className={`${interTight.variable} antialiased`}>
        <GoogleAnalytics />
        <PortfolioNavbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

