'use client';

import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';

export function FAQHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-center px-6 md:px-12 pt-28 md:pt-36 pb-16 md:pb-20 max-w-[1280px] mx-auto"
    >
      <motion.span
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-5"
        style={{ background: 'linear-gradient(135deg,#203eec18,#00d4ff18)', color: '#203eec' }}
      >
        <MessageCircle className="w-3.5 h-3.5" />
        SSS
      </motion.span>

      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.15 }}
        className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground mb-5 leading-[1.1]"
      >
        Merak ettikleriniz{' '}
        <span style={{
          background: 'linear-gradient(135deg,#203eec,#00d4ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          burada
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto"
      >
        BlogProduce hakkında en çok sorulan sorulara hızlıca ulaşın.
      </motion.p>
    </motion.div>
  );
}
