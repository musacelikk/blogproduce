'use client';

import { Search, Mic, Code2, Hash, ImageIcon, Type } from 'lucide-react';

const features = [
  {
    icon: Search,
    title: 'SEO anahtar kelimeleri',
    description: 'Bloglarınızı arama motorları için optimize edin; doğru anahtar kelimeleri ekleyin.',
  },
  {
    icon: Hash,
    title: 'Kelime sayısı',
    description: 'İdeal kelime limitini belirleyerek blog uzunluğunu kontrol edin.',
  },
  {
    icon: Mic,
    title: 'Ses ve ton',
    description: 'Markanıza veya kişiliğinize uygun ses ve tonu seçin.',
  },
  {
    icon: ImageIcon,
    title: 'Görseller ve tablolar',
    description: 'Bölüm görselleri ve yapılandırılmış tablolarla zengin içerik üretin.',
  },
  {
    icon: Type,
    title: 'Blog başlıkları',
    description: 'AI ile çekici ve yaratıcı blog başlıkları oluşturun.',
  },
  {
    icon: Code2,
    title: 'API entegrasyonu',
    description: 'RESTful API ile içeriği sitenize veya uygulamanıza tek tıkla gömün.',
  },
];

const stats = [
  { value: '10K+', label: 'Günlük İçerik' },
  { value: '50+', label: 'Dil Desteği' },
  { value: '%100', label: 'SEO Uyumlu' },
];

export const FeatureHighlightsSection = () => {
  return (
    <section className="border-t border-border py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl lg:text-5xl">
              Özellikler
            </h2>
            <p className="mt-6 leading-relaxed text-muted-foreground">
              BlogProduce, içerik üretimini tam olarak özelleştirmenizi sağlar. Anahtar kelimeden
              tona, kelime sayısından görsellere kadar her parametreyi siz belirleyin.
            </p>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              RESTful API ile üretilen içerikleri doğrudan sisteminize entegre edin. Gelişmiş SEO
              optimizasyonu ile içerikleriniz arama motorlarında öne çıksın.
            </p>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Özellikler
            </h3>
            <div className="flex flex-wrap gap-2">
              {features.map((f) => {
                const Icon = f.icon;
                return (
                  <span
                    key={f.title}
                    title={f.description}
                    className="inline-flex cursor-default items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                  >
                    <Icon className="h-3.5 w-3.5 text-primary" />
                    {f.title}
                  </span>
                );
              })}
            </div>

            <dl className="mt-12 grid grid-cols-3 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-xl bg-secondary p-4 text-center">
                  <dt className="text-2xl font-semibold tracking-tight text-primary md:text-3xl">
                    {stat.value}
                  </dt>
                  <dd className="mt-1 text-xs text-muted-foreground">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
};
