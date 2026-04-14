'use client';

import { motion } from 'framer-motion';
import { FileText, AlertCircle, Shield, Scale } from 'lucide-react';

export default function TermsPage() {
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
              Hizmet Şartları
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
                <FileText className="w-6 h-6 text-[#203eec]" />
                Kullanım Koşulları
              </h2>
              <p
                className="text-muted-foreground leading-relaxed mb-4"
              >
                BlogProduce hizmetini kullanarak aşağıdaki şartları kabul etmiş sayılırsınız:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Hesabınızı kişisel kullanımınız için kullanmalısınız</li>
                <li>Hizmeti yasadışı amaçlar için kullanamazsınız</li>
                <li>Başkalarının haklarını ihlal eden içerik üretemezsiniz</li>
                <li>Sistem güvenliğini tehlikeye atacak işlemler yapamazsınız</li>
              </ul>
            </section>

            <section className="bg-card border border-border rounded-2xl p-6 md:p-8">
              <h2
                className="text-2xl md:text-3xl font-semibold mb-4 text-foreground flex items-center gap-3"
              >
                <Scale className="w-6 h-6 text-[#203eec]" />
                Ödeme ve İade
              </h2>
              <p
                className="text-muted-foreground leading-relaxed mb-4"
              >
                Ödeme koşulları:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Tüm ödemeler ön ödemelidir</li>
                <li>Planlar otomatik olarak yenilenir</li>
                <li>14 gün içinde iptal garantisi vardır</li>
                <li>İade talepleri iletişim formu üzerinden yapılmalıdır</li>
              </ul>
            </section>

            <section className="bg-card border border-border rounded-2xl p-6 md:p-8">
              <h2
                className="text-2xl md:text-3xl font-semibold mb-4 text-foreground flex items-center gap-3"
              >
                <AlertCircle className="w-6 h-6 text-[#203eec]" />
                Sorumluluk Reddi
              </h2>
              <p
                className="text-muted-foreground leading-relaxed"
              >
                BlogProduce, oluşturulan içeriklerin doğruluğu, uygunluğu veya yasal uyumluluğu konusunda sorumluluk kabul etmez. Kullanıcılar, ürettikleri içeriklerin telif hakları, gizlilik ve diğer yasal konularda tam sorumluluğa sahiptir.
              </p>
            </section>

            <section className="bg-card border border-border rounded-2xl p-6 md:p-8">
              <h2
                className="text-2xl md:text-3xl font-semibold mb-4 text-foreground flex items-center gap-3"
              >
                <Shield className="w-6 h-6 text-[#203eec]" />
                Hesap İptali
              </h2>
              <p
                className="text-muted-foreground leading-relaxed mb-4"
              >
                Hesabınızı istediğiniz zaman iptal edebilirsiniz:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Ayarlar sayfasından hesap iptal edilebilir</li>
                <li>İptal sonrası mevcut dönem sonuna kadar hizmet devam eder</li>
                <li>Verileriniz iptal sonrası 30 gün saklanır</li>
                <li>Kalıcı silme için{' '}
                  <a href="/contact" className="text-[#203eec] hover:underline">
                    iletişime
                  </a>
                  {' '}geçin
                </li>
              </ul>
            </section>

            <section className="bg-card border border-border rounded-2xl p-6 md:p-8">
              <h2
                className="text-2xl md:text-3xl font-semibold mb-4 text-foreground"
              >
                Değişiklikler
              </h2>
              <p
                className="text-muted-foreground leading-relaxed"
              >
                Bu şartlar gerektiğinde güncellenebilir. Önemli değişiklikler e-posta ile bildirilir. Değişikliklerden haberdar olmak için bu sayfayı düzenli olarak kontrol edin.
              </p>
            </section>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

