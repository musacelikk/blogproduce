import { FAQSection } from '@/components/sections/FAQSection';
import { FAQHeader } from './FAQHeader';
import { FAQContact } from './FAQContact';
import { getPublicFAQs, FAQ } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function FAQPage() {
  let pageFAQs: FAQ[] = [];
  
  try {
    pageFAQs = await getPublicFAQs('page');
  } catch (error) {
    console.error('Failed to fetch page FAQs:', error);
    // Fallback to empty array if fetch fails
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="w-full pb-12 md:pb-16">
        <FAQHeader />
        <FAQSection type="page" title="Sık Sorulan Sorular" faqs={pageFAQs} />
        <FAQContact />
      </main>
    </div>
  );
}
