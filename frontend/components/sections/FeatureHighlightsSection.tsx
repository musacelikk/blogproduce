'use client';

import { Search, Mic, Code2, Hash, ImageIcon, Type } from 'lucide-react';

import { SectionHeading } from '@/components/sections/SectionHeading';

const features = [
  {
    icon: Search,
    title: 'SEO anahtar kelimeleri',
    description:
      'Hedeflediğiniz kelimeler başlıklara, meta etiketlerine ve gövde metnine doğal biçimde yerleşir.',
  },
  {
    icon: Hash,
    title: 'Kelime sayısı kontrolü',
    description: 'İdeal uzunluğu siz belirleyin; içerik o hedefe göre kurgulanır.',
  },
  {
    icon: Mic,
    title: 'Marka sesi ve ton',
    description: 'Kurumsaldan samimiye, her içerik aynı marka sesiyle çıkar.',
  },
  {
    icon: ImageIcon,
    title: 'Görseller ve tablolar',
    description: 'Bölüm görselleri ve yapılandırılmış tablolarla yayına hazır bir yazı teslim alın.',
  },
  {
    icon: Type,
    title: 'Başlık alternatifleri',
    description: 'Tıklanma oranı yüksek başlık seçenekleri arasından seçim yapın.',
  },
  {
    icon: Code2,
    title: 'API entegrasyonu',
    description: 'RESTful API ile içeriği sitenize veya uygulamanıza tek istekle gömün.',
  },
];

export const FeatureHighlightsSection = () => {
  return (
    <section className="border-y border-border bg-card py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          align="center"
          eyebrow="Özellikler"
          title="Her parametre sizde, sonuç yayına hazır"
          description="Anahtar kelimeden tona, uzunluktan görsele kadar üretimin tamamını siz yönetirsiniz. Çıktı, doğrudan yayınlanabilecek olgunlukta gelir."
        />

        <div className="mt-16 grid grid-cols-1 gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title}>
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-base font-semibold text-foreground-strong">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
