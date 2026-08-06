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

  if (!faqs || faqs.length === 0) {
    return null;
  }

  return (
    <section id="faq" className="w-full border-y border-border bg-card py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <p className="text-eyebrow">Sorular</p>
              <h2 className="mt-3 text-balance text-display-lg text-foreground-strong">{title}</h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Aradığınızı bulamazsanız ekibimiz bir iş günü içinde yanıt veriyor.
              </p>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="divide-y divide-border border-y border-border">
              {faqs.map((faq, index) => {
                const isOpen = openIndex === index;
                return (
                  <div key={faq.id}>
                    <button
                      onClick={() => toggleFAQ(index)}
                      className="flex w-full items-start justify-between gap-8 py-6 text-left transition-colors duration-base ease-out-quart hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-expanded={isOpen}
                    >
                      <span className="text-lg font-medium leading-7 text-foreground-strong">
                        {faq.question}
                      </span>
                      <motion.span
                        animate={{ rotate: isOpen ? 45 : 0 }}
                        transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
                        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground"
                      >
                        <Plus className="h-4 w-4" />
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
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
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
