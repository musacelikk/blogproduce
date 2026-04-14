'use client';

import { Search, Mic, Code2, Hash, ImageIcon, Type } from 'lucide-react';

const features = [
  {
    icon: Search,
    title: 'SEO anahtar kelimeleri',
    description: 'Bloglarınızı arama motorları için optimize edin; doğru anahtar kelimeleri ekleyin.',
    color: 'blue',
  },
  {
    icon: Hash,
    title: 'Kelime sayısı',
    description: 'İdeal kelime limitini belirleyerek blog uzunluğunu kontrol edin.',
    color: 'emerald',
  },
  {
    icon: Mic,
    title: 'Ses ve ton',
    description: 'Markanıza veya kişiliğinize uygun ses ve tonu seçin.',
    color: 'violet',
  },
  {
    icon: ImageIcon,
    title: 'Görseller ve tablolar',
    description: 'Bölüm görselleri ve yapılandırılmış tablolarla zengin içerik üretin.',
    color: 'amber',
  },
  {
    icon: Type,
    title: 'Blog başlıkları',
    description: 'AI ile çekici ve yaratıcı blog başlıkları oluşturun.',
    color: 'rose',
  },
  {
    icon: Code2,
    title: 'API entegrasyonu',
    description: 'RESTful API ile içeriği sitenize veya uygulamanıza tek tıkla gömün.',
    color: 'indigo',
  },
];

export const FeatureHighlightsSection = () => {
  return (
    <section className="py-20 md:py-32" style={{ borderTop: "1px solid var(--border)" }}>
      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          <div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-balance">
              Özellikler
            </h2>
            <p className="mt-6 leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              BlogProduce, içerik üretimini tam olarak özelleştirmenizi sağlar. Anahtar kelimeden tona, kelime sayısından görsellere kadar her parametreyi siz belirleyin.
            </p>
            <p className="mt-4 leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              RESTful API ile üretilen içerikleri doğrudan sisteminize entegre edin. Gelişmiş SEO optimizasyonu ile içerikleriniz arama motorlarında öne çıksın.
            </p>
          </div>
          <div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--muted-foreground)" }}>Özellikler</h3>
              <div className="flex flex-wrap gap-2">
                {features.map((f) => {
                  const Icon = f.icon;
                  return (
                    <span
                      key={f.title}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-colors cursor-default"
                      style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--secondary)" }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color: "#203eec" }} />
                      {f.title}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-12">
              {[
                { value: "10K+", label: "Günlük İçerik" },
                { value: "50+", label: "Dil Desteği" },
                { value: "%100", label: "SEO Uyumlu" },
              ].map((stat) => (
                <div key={stat.label} className="text-center p-4 rounded-2xl" style={{ backgroundColor: "var(--secondary)" }}>
                  <div className="text-2xl md:text-3xl font-semibold" style={{ color: "#203eec" }}>{stat.value}</div>
                  <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
