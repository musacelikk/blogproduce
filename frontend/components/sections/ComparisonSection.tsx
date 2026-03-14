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
    <section id="karsilastirma" className="py-20 md:py-32" style={{ borderTop: "1px solid var(--border)" }}>
      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        <div className="mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-balance mb-4">
            Neden BlogGenerator?
          </h2>
          <p className="text-lg leading-relaxed max-w-xl" style={{ color: "var(--muted-foreground)" }}>
            AI araç kullanmak ile geleneksel yazı yöntemi arasındaki farkı inceleyin.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          {aspects.map((row, index) => (
            <div
              key={index}
              className="group flex items-center justify-between p-5 md:p-6 rounded-2xl transition-all"
              style={{ border: "1px solid var(--border)", cursor: "default" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--secondary)"
                e.currentTarget.style.borderColor = "rgba(32,62,236,0.2)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent"
                e.currentTarget.style.borderColor = "var(--border)"
              }}
            >
              <div className="flex items-start gap-6 flex-1">
                <div className="w-32 flex-shrink-0">
                  <span className="text-sm font-semibold" style={{ color: "var(--muted-foreground)" }}>{row.aspect}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Check className="w-4 h-4 flex-shrink-0" style={{ color: "#203eec" }} />
                    <span className="text-sm md:text-base font-semibold">{row.tool}</span>
                  </div>
                  <div className="flex items-center gap-2" style={{ color: "var(--muted-foreground)" }}>
                    <X className="w-4 h-4 flex-shrink-0 opacity-40" />
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
