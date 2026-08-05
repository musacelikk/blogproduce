'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { FAQ } from '@/lib/api';

type FAQSectionProps = {
  title?: string;
  type?: 'homepage' | 'page';
  faqs: FAQ[];
};

export const FAQSection = ({
  title = 'Sık sorulan sorular',
  faqs,
}: FAQSectionProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Debug: Log FAQs to see what we're receiving
  if (typeof window !== 'undefined') {
    console.log('FAQSection received FAQs:', faqs, 'Length:', faqs?.length);
  }

  // Show debug info in development
  if (!faqs || faqs.length === 0) {
    if (process.env.NODE_ENV === 'development') {
      return (
        <section id="faq" className="w-full py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-sm text-destructive">DEBUG: No FAQs found. Check console for details.</p>
          </div>
        </section>
      );
    }
    return null;
  }

  return (
    <section id="faq" className="w-full border-t border-border py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <h2 className="mb-6 text-3xl font-semibold tracking-tight text-foreground md:text-4xl lg:sticky lg:top-24 lg:mb-0 lg:text-5xl">
              {title}
            </h2>
          </div>
          <div className="lg:col-span-8">
            <div className="divide-y divide-border border-b border-border">
              {faqs.map((faq, index) => (
                <div key={faq.id}>
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="flex w-full items-center justify-between gap-8 py-6 text-left transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-expanded={openIndex === index}
                  >
                    <span className="text-lg font-medium leading-7">{faq.question}</span>
                    <motion.div
                      animate={{ rotate: openIndex === index ? 45 : 0 }}
                      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                      className="shrink-0"
                    >
                      <Plus className="h-6 w-6 text-primary" strokeWidth={1.5} />
                    </motion.div>
                  </button>
                  <AnimatePresence initial={false}>
                    {openIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="pb-6 pr-12">
                          <p className="text-base leading-relaxed text-muted-foreground">
                            {faq.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

