'use client';

import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileText } from 'lucide-react';

export default function PrivacyPage() {
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
              Gizlilik Politikası
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
                <Shield className="w-6 h-6 text-[#203eec]" />
                Veri Toplama
              </h2>
              <p
                className="text-muted-foreground leading-relaxed mb-4"
              >
                BlogProduce, hizmetlerimizi sağlamak için aşağıdaki verileri toplamaktadır:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Hesap bilgileri (ad, e-posta, şifre)</li>
                <li>Kullanım verileri (oluşturulan bloglar, API çağrıları)</li>
                <li>Cihaz ve tarayıcı bilgileri</li>
                <li>IP adresi ve konum verileri</li>
              </ul>
            </section>

            <section className="bg-card border border-border rounded-2xl p-6 md:p-8">
              <h2
                className="text-2xl md:text-3xl font-semibold mb-4 text-foreground flex items-center gap-3"
              >
                <Lock className="w-6 h-6 text-[#203eec]" />
                Veri Güvenliği
              </h2>
              <p
                className="text-muted-foreground leading-relaxed"
              >
                Tüm verileriniz SSL/TLS şifreleme ile korunmaktadır. Şifreleriniz bcrypt ile hashlenerek saklanır ve hiçbir zaman düz metin olarak erişilemez. Verileriniz yalnızca güvenli sunucularda saklanır ve yedeklenir.
              </p>
            </section>

            <section className="bg-card border border-border rounded-2xl p-6 md:p-8">
              <h2
                className="text-2xl md:text-3xl font-semibold mb-4 text-foreground flex items-center gap-3"
              >
                <Eye className="w-6 h-6 text-[#203eec]" />
                Veri Kullanımı
              </h2>
              <p
                className="text-muted-foreground leading-relaxed mb-4"
              >
                Toplanan veriler aşağıdaki amaçlarla kullanılmaktadır:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Hizmetlerimizi sağlamak ve geliştirmek</li>
                <li>Müşteri desteği sunmak</li>
                <li>Yasal yükümlülükleri yerine getirmek</li>
                <li>Güvenlik ve dolandırıcılık önleme</li>
              </ul>
            </section>

            <section className="bg-card border border-border rounded-2xl p-6 md:p-8">
              <h2
                className="text-2xl md:text-3xl font-semibold mb-4 text-foreground flex items-center gap-3"
              >
                <FileText className="w-6 h-6 text-[#203eec]" />
                Veri Paylaşımı
              </h2>
              <p
                className="text-muted-foreground leading-relaxed"
              >
                Kişisel verileriniz, yasal yükümlülükler dışında üçüncü taraflarla paylaşılmaz. Hizmet sağlayıcılarımız (hosting, e-posta vb.) verilerinizi yalnızca hizmet sağlama amacıyla işler ve sıkı gizlilik anlaşmalarına tabidir.
              </p>
            </section>

            <section className="bg-card border border-border rounded-2xl p-6 md:p-8">
              <h2
                className="text-2xl md:text-3xl font-semibold mb-4 text-foreground"
              >
                Haklarınız
              </h2>
              <p
                className="text-muted-foreground leading-relaxed mb-4"
              >
                KVKK kapsamında aşağıdaki haklara sahipsiniz:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                <li>İşlenmişse bilgi talep etme</li>
                <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
                <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
                <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
                <li>Silinmesini veya yok edilmesini isteme</li>
              </ul>
            </section>

            <section className="bg-card border border-border rounded-2xl p-6 md:p-8">
              <h2
                className="text-2xl md:text-3xl font-semibold mb-4 text-foreground"
              >
                İletişim
              </h2>
              <p
                className="text-muted-foreground leading-relaxed"
              >
                Gizlilik politikamız hakkında sorularınız için{' '}
                <a href="/contact" className="text-[#203eec] hover:underline">
                  iletişim
                </a>
                {' '}sayfamızdan bize ulaşabilirsiniz.
              </p>
            </section>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

