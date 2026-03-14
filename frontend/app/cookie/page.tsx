'use client';

import { motion } from 'framer-motion';
import { Cookie, Settings, Info } from 'lucide-react';

export default function CookiePage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="w-full px-4 md:px-6 lg:px-8 pt-20 md:pt-24 lg:pt-32 pb-12 md:pb-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground mb-4 md:mb-6">
              Çerez Politikası
            </h1>
            <p
              className="text-base md:text-lg text-muted-foreground"
            >
              Son güncelleme: {new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="prose prose-lg max-w-none space-y-8"
          >
            <section className="bg-card border border-border rounded-2xl p-6 md:p-8">
              <h2
                className="text-2xl md:text-3xl font-semibold mb-4 text-foreground flex items-center gap-3"
              >
                <Cookie className="w-6 h-6 text-[#203eec]" />
                Çerez Nedir?
              </h2>
              <p
                className="text-muted-foreground leading-relaxed"
              >
                Çerezler, web sitelerinin tarayıcınızda sakladığı küçük metin dosyalarıdır. Bu dosyalar, site deneyiminizi iyileştirmek, tercihlerinizi hatırlamak ve site performansını analiz etmek için kullanılır.
              </p>
            </section>

            <section className="bg-card border border-border rounded-2xl p-6 md:p-8">
              <h2
                className="text-2xl md:text-3xl font-semibold mb-4 text-foreground flex items-center gap-3"
              >
                <Settings className="w-6 h-6 text-[#203eec]" />
                Kullandığımız Çerezler
              </h2>
              <div className="space-y-4">
                <div>
                  <h3
                    className="text-lg font-medium text-foreground mb-2"
                  >
                    Zorunlu Çerezler
                  </h3>
                  <p
                    className="text-muted-foreground leading-relaxed"
                  >
                    Bu çerezler sitenin çalışması için gereklidir. Oturum yönetimi, güvenlik ve temel işlevsellik için kullanılır. Devre dışı bırakılamazlar.
                  </p>
                </div>
                <div>
                  <h3
                    className="text-lg font-medium text-foreground mb-2"
                  >
                    Performans Çerezleri
                  </h3>
                  <p
                    className="text-muted-foreground leading-relaxed"
                  >
                    Site performansını analiz etmek ve iyileştirmek için kullanılır. Anonim veriler toplanır ve kişisel bilgi içermez.
                  </p>
                </div>
                <div>
                  <h3
                    className="text-lg font-medium text-foreground mb-2"
                  >
                    İşlevsellik Çerezleri
                  </h3>
                  <p
                    className="text-muted-foreground leading-relaxed"
                  >
                    Tercihlerinizi hatırlamak ve kişiselleştirilmiş deneyim sunmak için kullanılır.
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-card border border-border rounded-2xl p-6 md:p-8">
              <h2
                className="text-2xl md:text-3xl font-semibold mb-4 text-foreground flex items-center gap-3"
              >
                <Info className="w-6 h-6 text-[#203eec]" />
                Çerezleri Yönetme
              </h2>
              <p
                className="text-muted-foreground leading-relaxed mb-4"
              >
                Çerez tercihlerinizi aşağıdaki yollarla yönetebilirsiniz:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Tarayıcı ayarlarından çerezleri silebilir veya engelleyebilirsiniz</li>
                <li>Çoğu tarayıcı varsayılan olarak çerezleri kabul eder</li>
                <li>Çerezleri engellerseniz bazı özellikler düzgün çalışmayabilir</li>
                <li>Oturum çerezleri tarayıcı kapatıldığında otomatik olarak silinir</li>
              </ul>
            </section>

            <section className="bg-card border border-border rounded-2xl p-6 md:p-8">
              <h2
                className="text-2xl md:text-3xl font-semibold mb-4 text-foreground"
              >
                Üçüncü Taraf Çerezler
              </h2>
              <p
                className="text-muted-foreground leading-relaxed"
              >
                Sitemizde üçüncü taraf servislerin çerezleri kullanılabilir. Bu servislerin çerez politikalarını kendi web sitelerinden inceleyebilirsiniz. Analytics ve performans ölçümü için güvenilir üçüncü taraf servisler kullanılmaktadır.
              </p>
            </section>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

