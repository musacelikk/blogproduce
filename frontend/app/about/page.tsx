'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const values = [
  {
    title: 'İnovasyon',
    description:
      "En gelişmiş AI teknolojilerini kullanarak, prompt'a göre özelleştirilebilir blog üretim API'si geliştiriyoruz.",
  },
  {
    title: 'Kalite',
    description:
      'Ürettiğimiz her blog içeriğinde SEO optimizasyonu, okunabilirlik ve kalite standartlarını garanti ediyoruz.',
  },
  {
    title: 'Kullanıcı Odaklılık',
    description:
      'Web arayüzü ve RESTful API ile kullanıcı deneyimini sürekli iyileştirmek için çalışıyoruz.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="w-full px-4 pb-16 pt-32 sm:px-6 sm:pb-24 sm:pt-40 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center sm:mb-16"
          >
            <h1 className="mb-6 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Hakkımızda
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              BlogProduce, AI destekli blog içerik üretim uygulaması ve RESTful API&apos;si olarak,
              içerik üreticileri ve geliştiricilerin hayatını kolaylaştırmayı hedefliyor.
              Prompt&apos;a göre size özel, SEO optimizasyonlu blog içerikleri üretiyoruz.
            </p>
          </motion.div>

          <div className="mb-12 grid items-center gap-8 md:grid-cols-2 md:gap-12 lg:mb-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="mb-6 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                Misyonumuz
              </h2>
              <p className="mb-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                BlogProduce olarak, içerik üreticileri ve geliştiricilerin blog üretim süreçlerini
                hızlandırmayı hedefliyoruz. Prompt&apos;a göre size özel, SEO optimizasyonlu blog
                içerikleri üreterek, zamanınızı tasarruf etmenizi ve daha fazla içerik
                oluşturmanızı sağlıyoruz.
              </p>
              <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
                En gelişmiş yapay zeka teknolojilerini kullanarak, web arayüzü veya RESTful API ile
                entegre edilebilen, kaliteli ve SEO dostu blog içerikleri üretmeyi mümkün
                kılıyoruz. Sitenizde, uygulamanızda veya otomasyon sistemlerinizde kullanılabilir.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="rounded-xl border border-border bg-accent p-8 text-center shadow-card md:p-12"
            >
              <div className="mb-2 text-5xl font-semibold tracking-tight text-primary md:text-6xl">
                2024
              </div>
              <p className="text-lg text-muted-foreground">Kuruluş Yılı</p>
            </motion.div>
          </div>

          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="rounded-xl border border-border bg-card p-6 shadow-card md:p-12"
            >
              <h2 className="mb-6 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                Vizyonumuz
              </h2>
              <p className="mb-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                Gelecekte, blog içerik üretim süreçlerinde AI destekli API&apos;lerin vazgeçilmez
                bir araç haline gelmesini öngörüyoruz. Her geliştirici ve içerik üreticisi, kendi
                sistemlerine entegre edebileceği güçlü blog üretim API&apos;lerine ihtiyaç duyacak.
              </p>
              <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
                Bu vizyon doğrultusunda, sürekli gelişen AI teknolojimiz ve kullanıcı odaklı
                yaklaşımımızla, blog üretim API&apos;si sektöründe lider konumda olmayı
                hedefliyoruz. Prompt&apos;a göre özelleştirilebilir, SEO optimizasyonlu ve entegre
                edilebilir çözümler sunmaya devam edeceğiz.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h2 className="mb-6 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                Değerlerimiz
              </h2>
              <ul className="space-y-6">
                {values.map((value) => (
                  <li key={value.title} className="flex items-start gap-4">
                    <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary">
                      <Check className="h-3.5 w-3.5 text-primary-foreground" />
                    </span>
                    <div>
                      <h3 className="mb-1 font-semibold text-foreground">{value.title}</h3>
                      <p className="leading-relaxed text-muted-foreground">{value.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
