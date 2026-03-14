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
        <section id="faq" className="w-full py-20 md:py-32 px-6 md:px-12">
          <div className="max-w-[1280px] mx-auto">
            <p className="text-red-500 text-sm">DEBUG: No FAQs found. Check console for details.</p>
          </div>
        </section>
      );
    }
    return null;
  }

  return (
    <section id="faq" className="w-full py-20 md:py-32 px-6 md:px-12" style={{ borderTop: "1px solid var(--border)" }}>
      <div className="max-w-[1280px] mx-auto">
        <div className="grid lg:grid-cols-12 gap-8 md:gap-16">
          <div className="lg:col-span-4">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight lg:sticky lg:top-24 mb-6 lg:mb-0" style={{ color: "var(--foreground)" }}>
              {title}
            </h2>
          </div>
          <div className="lg:col-span-8">
            <div className="space-y-0">
              {faqs.map((faq, index) => (
                <div key={faq.id} style={{ borderBottom: "1px solid var(--border)" }} className="last:border-b-0">
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full flex items-center justify-between py-6 text-left hover:opacity-70 transition-opacity duration-150"
                    aria-expanded={openIndex === index}
                  >
                    <span className="text-lg leading-7 pr-8 font-medium" style={{ color: "var(--foreground)" }}>{faq.question}</span>
                    <motion.div animate={{ rotate: openIndex === index ? 45 : 0 }} transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }} className="flex-shrink-0">
                      <Plus className="w-6 h-6" style={{ color: "#203eec" }} strokeWidth={1.5} />
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
                          <p className="text-base leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{faq.answer}</p>
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

