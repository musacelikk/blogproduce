'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="w-full px-4 md:px-6 lg:px-8 pt-20 md:pt-24 lg:pt-32 pb-12 md:pb-16">
        <div className="max-w-[1280px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 md:mb-16"
          >
            <h1
              className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground mb-4 md:mb-6"
            >
              Hakkımızda
            </h1>
            <p
              className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4"
            >
              BlogProduce, AI destekli blog içerik üretim uygulaması ve RESTful API&apos;si olarak, içerik üreticileri ve geliştiricilerin hayatını kolaylaştırmayı hedefliyor. Prompt&apos;a göre size özel, SEO optimizasyonlu blog içerikleri üretiyoruz.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center mb-12 md:mb-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2
                className="text-2xl md:text-3xl font-semibold tracking-tight mb-4 md:mb-6 text-foreground"
              >
                Misyonumuz
              </h2>
              <p
                className="text-base md:text-lg text-muted-foreground mb-3 md:mb-4 leading-6 md:leading-7"
              >
                BlogProduce olarak, içerik üreticileri ve geliştiricilerin blog üretim süreçlerini hızlandırmayı hedefliyoruz. Prompt&apos;a göre size özel, SEO optimizasyonlu blog içerikleri üreterek, zamanınızı tasarruf etmenizi ve daha fazla içerik oluşturmanızı sağlıyoruz.
              </p>
              <p
                className="text-base md:text-lg text-muted-foreground leading-6 md:leading-7"
              >
                En gelişmiş yapay zeka teknolojilerini kullanarak, web arayüzü veya RESTful API ile entegre edilebilen, kaliteli ve SEO dostu blog içerikleri üretmeyi mümkün kılıyoruz. Sitenizde, uygulamanızda veya otomasyon sistemlerinizde kullanılabilir.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-card border border-border rounded-2xl md:rounded-3xl p-8 md:p-12 text-center"
            >
              <div
                className="text-4xl md:text-6xl font-bold text-[#203eec] mb-2"
              >
                2024
              </div>
              <p
                className="text-lg md:text-xl text-muted-foreground"
              >
                Kuruluş Yılı
              </p>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-card border border-border rounded-2xl md:rounded-3xl p-6 md:p-12"
            >
              <h2
                className="text-2xl md:text-3xl font-semibold tracking-tight mb-4 md:mb-6 text-foreground"
              >
                Vizyonumuz
              </h2>
              <p
                className="text-base md:text-lg text-muted-foreground mb-3 md:mb-4 leading-6 md:leading-7"
              >
                Gelecekte, blog içerik üretim süreçlerinde AI destekli API&apos;lerin vazgeçilmez bir araç haline gelmesini öngörüyoruz. Her geliştirici ve içerik üreticisi, kendi sistemlerine entegre edebileceği güçlü blog üretim API&apos;lerine ihtiyaç duyacak.
              </p>
              <p
                className="text-base md:text-lg text-muted-foreground leading-6 md:leading-7"
              >
                Bu vizyon doğrultusunda, sürekli gelişen AI teknolojimiz ve kullanıcı odaklı yaklaşımımızla, blog üretim API&apos;si sektöründe lider konumda olmayı hedefliyoruz. Prompt&apos;a göre özelleştirilebilir, SEO optimizasyonlu ve entegre edilebilir çözümler sunmaya devam edeceğiz.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h2
                className="text-2xl md:text-3xl font-semibold tracking-tight mb-4 md:mb-6 text-foreground"
              >
                Değerlerimiz
              </h2>
              <ul className="space-y-4 md:space-y-6">
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-[#203eec] rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4
                      className="font-semibold mb-1 text-foreground"
                    >
                      İnovasyon
                    </h4>
                    <p
                      className="text-muted-foreground leading-6"
                    >
                      En gelişmiş AI teknolojilerini kullanarak, prompt&apos;a göre özelleştirilebilir blog üretim API&apos;si geliştiriyoruz.
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-[#203eec] rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4
                      className="font-semibold mb-1 text-foreground"
                    >
                      Kalite
                    </h4>
                    <p
                      className="text-muted-foreground leading-6"
                    >
                      Ürettiğimiz her blog içeriğinde SEO optimizasyonu, okunabilirlik ve kalite standartlarını garanti ediyoruz.
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-[#203eec] rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4
                      className="font-semibold mb-1 text-foreground"
                    >
                      Kullanıcı Odaklılık
                    </h4>
                    <p
                      className="text-muted-foreground leading-6"
                    >
                      Web arayüzü ve RESTful API ile kullanıcı deneyimini sürekli iyileştirmek için çalışıyoruz.
                    </p>
                  </div>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
