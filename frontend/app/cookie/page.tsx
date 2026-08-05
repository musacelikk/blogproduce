'use client';

import { motion } from 'framer-motion';
import { Cookie, Settings, Info } from 'lucide-react';

export default function CookiePage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-20 sm:px-6 md:pt-24 lg:px-8 lg:pt-32">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="border-b border-border pb-8"
        >
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Çerez Politikası
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Son güncelleme: {new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="divide-y divide-border"
        >
          <section className="py-8">
            <h2 className="flex items-center gap-2.5 text-xl font-semibold tracking-tight text-foreground">
              <Cookie className="h-5 w-5 shrink-0 text-accent-foreground" />
              Çerez Nedir?
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
              Çerezler, web sitelerinin tarayıcınızda sakladığı küçük metin dosyalarıdır. Bu dosyalar, site deneyiminizi iyileştirmek, tercihlerinizi hatırlamak ve site performansını analiz etmek için kullanılır.
            </p>
          </section>

          <section className="py-8">
            <h2 className="flex items-center gap-2.5 text-xl font-semibold tracking-tight text-foreground">
              <Settings className="h-5 w-5 shrink-0 text-accent-foreground" />
              Kullandığımız Çerezler
            </h2>
            <div className="mt-4 space-y-5">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Zorunlu Çerezler
                </h3>
                <p className="mt-1.5 text-[15px] leading-7 text-muted-foreground">
                  Bu çerezler sitenin çalışması için gereklidir. Oturum yönetimi, güvenlik ve temel işlevsellik için kullanılır. Devre dışı bırakılamazlar.
                </p>
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Performans Çerezleri
                </h3>
                <p className="mt-1.5 text-[15px] leading-7 text-muted-foreground">
                  Site performansını analiz etmek ve iyileştirmek için kullanılır. Anonim veriler toplanır ve kişisel bilgi içermez.
                </p>
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  İşlevsellik Çerezleri
                </h3>
                <p className="mt-1.5 text-[15px] leading-7 text-muted-foreground">
                  Tercihlerinizi hatırlamak ve kişiselleştirilmiş deneyim sunmak için kullanılır.
                </p>
              </div>
            </div>
          </section>

          <section className="py-8">
            <h2 className="flex items-center gap-2.5 text-xl font-semibold tracking-tight text-foreground">
              <Info className="h-5 w-5 shrink-0 text-accent-foreground" />
              Çerezleri Yönetme
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
              Çerez tercihlerinizi aşağıdaki yollarla yönetebilirsiniz:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] leading-7 text-muted-foreground marker:text-border">
              <li>Tarayıcı ayarlarından çerezleri silebilir veya engelleyebilirsiniz</li>
              <li>Çoğu tarayıcı varsayılan olarak çerezleri kabul eder</li>
              <li>Çerezleri engellerseniz bazı özellikler düzgün çalışmayabilir</li>
              <li>Oturum çerezleri tarayıcı kapatıldığında otomatik olarak silinir</li>
            </ul>
          </section>

          <section className="py-8">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Üçüncü Taraf Çerezler
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
              Sitemizde üçüncü taraf servislerin çerezleri kullanılabilir. Bu servislerin çerez politikalarını kendi web sitelerinden inceleyebilirsiniz. Analytics ve performans ölçümü için güvenilir üçüncü taraf servisler kullanılmaktadır.
            </p>
          </section>
        </motion.div>
      </main>
    </div>
  );
}
