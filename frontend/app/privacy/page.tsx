'use client';

import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileText } from 'lucide-react';

export default function PrivacyPage() {
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
            Gizlilik Politikası
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
              <Shield className="h-5 w-5 shrink-0 text-accent-foreground" />
              Veri Toplama
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
              BlogProduce, hizmetlerimizi sağlamak için aşağıdaki verileri toplamaktadır:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] leading-7 text-muted-foreground marker:text-border">
              <li>Hesap bilgileri (ad, e-posta, şifre)</li>
              <li>Kullanım verileri (oluşturulan bloglar, API çağrıları)</li>
              <li>Cihaz ve tarayıcı bilgileri</li>
              <li>IP adresi ve konum verileri</li>
            </ul>
          </section>

          <section className="py-8">
            <h2 className="flex items-center gap-2.5 text-xl font-semibold tracking-tight text-foreground">
              <Lock className="h-5 w-5 shrink-0 text-accent-foreground" />
              Veri Güvenliği
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
              Tüm verileriniz SSL/TLS şifreleme ile korunmaktadır. Şifreleriniz bcrypt ile hashlenerek saklanır ve hiçbir zaman düz metin olarak erişilemez. Verileriniz yalnızca güvenli sunucularda saklanır ve yedeklenir.
            </p>
          </section>

          <section className="py-8">
            <h2 className="flex items-center gap-2.5 text-xl font-semibold tracking-tight text-foreground">
              <Eye className="h-5 w-5 shrink-0 text-accent-foreground" />
              Veri Kullanımı
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
              Toplanan veriler aşağıdaki amaçlarla kullanılmaktadır:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] leading-7 text-muted-foreground marker:text-border">
              <li>Hizmetlerimizi sağlamak ve geliştirmek</li>
              <li>Müşteri desteği sunmak</li>
              <li>Yasal yükümlülükleri yerine getirmek</li>
              <li>Güvenlik ve dolandırıcılık önleme</li>
            </ul>
          </section>

          <section className="py-8">
            <h2 className="flex items-center gap-2.5 text-xl font-semibold tracking-tight text-foreground">
              <FileText className="h-5 w-5 shrink-0 text-accent-foreground" />
              Veri Paylaşımı
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
              Kişisel verileriniz, yasal yükümlülükler dışında üçüncü taraflarla paylaşılmaz. Hizmet sağlayıcılarımız (hosting, e-posta vb.) verilerinizi yalnızca hizmet sağlama amacıyla işler ve sıkı gizlilik anlaşmalarına tabidir.
            </p>
          </section>

          <section className="py-8">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Haklarınız
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
              KVKK kapsamında aşağıdaki haklara sahipsiniz:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] leading-7 text-muted-foreground marker:text-border">
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
              <li>İşlenmişse bilgi talep etme</li>
              <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
              <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
              <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
              <li>Silinmesini veya yok edilmesini isteme</li>
            </ul>
          </section>

          <section className="py-8">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              İletişim
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
              Gizlilik politikamız hakkında sorularınız için{' '}
              <a href="/contact" className="font-medium text-accent-foreground hover:underline">
                iletişim
              </a>
              {' '}sayfamızdan bize ulaşabilirsiniz.
            </p>
          </section>
        </motion.div>
      </main>
    </div>
  );
}
