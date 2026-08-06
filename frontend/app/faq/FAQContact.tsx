'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function FAQContact() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55 }}
      className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
    >
      <Card variant="emphasis" className="p-10 text-center md:p-16">
        <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Mail className="h-5 w-5" />
        </span>
        <h2 className="mt-6 text-balance text-display-md text-foreground-strong">
          Hâlâ sorunuz var mı?
        </h2>
        <p className="mx-auto mt-4 max-w-md leading-relaxed text-muted-foreground">
          Aradığınız cevabı bulamadıysanız ekibimiz bir iş günü içinde size dönüş yapar.
        </p>
        <div className="mt-8">
          <Button asChild size="xl">
            <Link href="/contact">
              İletişime Geç
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
