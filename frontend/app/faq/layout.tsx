import type { Metadata } from 'next';
import { getPublicFAQs, FAQ } from '@/lib/api';

export async function generateMetadata(): Promise<Metadata> {
  let pageFAQs: FAQ[] = [];
  
  try {
    pageFAQs = await getPublicFAQs('page');
  } catch (error) {
    console.error('Failed to fetch FAQs for metadata:', error);
  }

  // FAQ'lardan ilk birkaç soruyu description'a ekle
  const faqTitles = pageFAQs.slice(0, 3).map(faq => faq.question).join(', ');
  const description = pageFAQs.length > 0
    ? `BlogGenerator hakkında sık sorulan sorular: ${faqTitles} ve daha fazlası.`
    : 'BlogGenerator hakkında sık sorulan sorular ve cevapları.';

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://blogproduce.com';
  
  return {
    title: 'Sık Sorulan Sorular',
    description,
    openGraph: {
      title: 'Sık Sorulan Sorular - BlogGenerator',
      description,
      url: `${siteUrl}/faq`,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: 'Sık Sorulan Sorular - BlogGenerator',
      description,
    },
    alternates: {
      canonical: `${siteUrl}/faq`,
    },
  };
}

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

