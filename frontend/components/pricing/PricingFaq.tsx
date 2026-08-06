'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionHeading } from '@/components/sections/SectionHeading';
import { PRICING_FAQ } from './plan-model';

interface PricingFaqProps {
  className?: string;
}

/** Compact pricing FAQ: ödeme (havale/EFT), token, limit, plan değişimi, iade. */
export function PricingFaq({ className }: PricingFaqProps) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  return (
    <section className={cn('scroll-mt-24', className)} id="sss">
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-16">
        <SectionHeading
          size="md"
          eyebrow="Sık sorulanlar"
          title="Fiyatlandırma hakkında"
          description="Ödeme, token ve plan değişikliği hakkında en çok sorulanlar. Aklınıza takılan başka bir şey olursa destek ekibimiz mesai saatleri içinde yanıtlıyor."
          className="lg:sticky lg:top-24 lg:col-span-4 lg:self-start"
        />

        <div className="lg:col-span-8">
          <div className="divide-y divide-border border-y border-border">
            {PRICING_FAQ.map((item, index) => {
              const open = openIndex === index;
              return (
                <div key={item.question}>
                  <button
                    type="button"
                    onClick={() => setOpenIndex(open ? null : index)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-6 py-5 text-left transition-colors duration-base ease-out-quart hover:text-accent-foreground"
                  >
                    <span className="text-base font-medium text-foreground-strong">
                      {item.question}
                    </span>
                    <Plus
                      className={cn(
                        'h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-base ease-out-quart',
                        open && 'rotate-45',
                      )}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="pb-5 pr-10 text-sm leading-relaxed text-muted-foreground">
                          {item.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
