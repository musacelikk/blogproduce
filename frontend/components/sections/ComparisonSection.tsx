'use client';

import { Check, X } from 'lucide-react';

import { SectionHeading } from '@/components/sections/SectionHeading';
import { Card } from '@/components/ui/card';

const aspects = [
  {
    aspect: 'Zaman',
    tool: 'Dakikalar içinde içerik',
    human: 'Saatler veya günler',
  },
  {
    aspect: 'Dil desteği',
    tool: '50+ dil',
    human: 'Yazara bağlı',
  },
  {
    aspect: 'SEO',
    tool: 'Meta, schema, canonical dahil',
    human: 'Manuel çaba gerekir',
  },
  {
    aspect: 'Özelleştirme',
    tool: 'Uzunluk, ton, görsel hızlı ayar',
    human: 'Zaman alıcı ve manuel',
  },
  {
    aspect: 'Tutarlılık',
    tool: 'Sabit kalite ve stil',
    human: 'Yazara göre değişir',
  },
  {
    aspect: 'Maliyet',
    tool: 'Düşük maliyet',
    human: 'Yazar maliyeti yüksek',
  },
  {
    aspect: 'Araştırma',
    tool: 'AI ile anında araştırma',
    human: 'Manuel araştırma',
  },
  {
    aspect: 'Ölçeklenebilirlik',
    tool: 'İçerik üretimi kolayca ölçeklenir',
    human: 'İnsan kapasitesiyle sınırlı',
  },
  {
    aspect: 'Yayınlama',
    tool: 'API ile tek tıkla entegrasyon',
    human: 'Manuel kopyala-yapıştır',
  },
];

export const ComparisonSection = () => {
  return (
    <section id="karsilastirma" className="border-t border-border py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Karşılaştırma"
          title="Neden BlogProduce?"
          description="AI destekli üretim ile geleneksel yazı süreci arasındaki farkı yan yana görün."
        />
        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2">
          {aspects.map((row) => (
            <Card key={row.aspect} className="p-6">
              <span className="text-eyebrow">{row.aspect}</span>
              <div className="mt-4 flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <span className="text-sm font-semibold text-foreground-strong">{row.tool}</span>
              </div>
              <div className="mt-2 flex items-start gap-2.5 text-muted-foreground">
                <X className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="text-sm">{row.human}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
