'use client';

import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function FAQHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mx-auto max-w-7xl px-4 pb-16 pt-32 text-center sm:px-6 sm:pb-20 sm:pt-40 lg:px-8"
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Badge className="mb-5 uppercase tracking-wide">
          <MessageCircle className="h-3.5 w-3.5" />
          SSS
        </Badge>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.15 }}
        className="mb-5 text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl"
      >
        Merak ettikleriniz <span className="text-primary">burada</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="mx-auto max-w-xl text-lg text-muted-foreground"
      >
        BlogProduce hakkında en çok sorulan sorulara hızlıca ulaşın.
      </motion.p>
    </motion.div>
  );
}
