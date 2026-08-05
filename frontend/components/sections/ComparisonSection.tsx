'use client';

import { Check, X } from 'lucide-react';

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
    <section id="karsilastirma" className="border-t border-border py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 sm:mb-16">
          <h2 className="mb-4 text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl lg:text-5xl">
            Neden BlogProduce?
          </h2>
          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
            AI araç kullanmak ile geleneksel yazı yöntemi arasındaki farkı inceleyin.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          {aspects.map((row) => (
            <div
              key={row.aspect}
              className="flex cursor-default items-center justify-between rounded-xl border border-border bg-card p-5 shadow-card transition-all hover:bg-secondary hover:shadow-card-hover md:p-6"
            >
              <div className="flex flex-1 items-start gap-6">
                <div className="w-32 shrink-0">
                  <span className="text-sm font-semibold text-muted-foreground">{row.aspect}</span>
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                    <span className="text-sm font-semibold text-foreground md:text-base">
                      {row.tool}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <X className="h-4 w-4 shrink-0" />
                    <span className="text-sm">{row.human}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
