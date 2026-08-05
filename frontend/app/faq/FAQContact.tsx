'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FAQContact() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55 }}
      className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
    >
      <div className="rounded-xl border border-border bg-accent p-8 text-center md:p-16">
        <div className="mx-auto mb-5 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
          <Mail className="h-6 w-6 text-primary-foreground" />
        </div>
        <h2 className="mb-3 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Hâlâ sorunuz var mı?
        </h2>
        <p className="mx-auto mb-8 max-w-md text-base text-muted-foreground">
          Aradığınız cevabı bulamadıysanız ekibimiz size yardımcı olmaktan mutluluk duyar.
        </p>
        <Button asChild size="lg">
          <Link href="/contact">
            İletişime Geç
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}
