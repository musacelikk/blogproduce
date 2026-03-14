'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Mail } from 'lucide-react';

export function FAQContact() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55 }}
      className="max-w-[1280px] mx-auto px-6 md:px-12 py-16 md:py-20"
    >
      <div
        className="relative overflow-hidden rounded-2xl md:rounded-3xl p-8 md:p-16 text-center"
        style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}
      >
        {/* Glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[240px] rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: 'linear-gradient(135deg,#203eec,#00d4ff)' }}
        />
        <div className="relative">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-5 mx-auto"
            style={{ background: 'linear-gradient(135deg,#203eec,#00d4ff)' }}
          >
            <Mail className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-3">
            Hâlâ sorunuz var mı?
          </h2>
          <p className="text-sm md:text-base text-muted-foreground mb-8 max-w-md mx-auto">
            Aradığınız cevabı bulamadıysanız ekibimiz size yardımcı olmaktan mutluluk duyar.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg,#203eec,#00d4ff)' }}
          >
            İletişime Geç
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
