'use client';

import { motion } from 'framer-motion';
import { FileText, AlertCircle, Shield, Scale } from 'lucide-react';

export default function TermsPage() {
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
            Hizmet Şartları
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
              <FileText className="h-5 w-5 shrink-0 text-accent-foreground" />
              Kullanım Koşulları
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
              BlogProduce hizmetini kullanarak aşağıdaki şartları kabul etmiş sayılırsınız:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] leading-7 text-muted-foreground marker:text-border">
              <li>Hesabınızı kişisel kullanımınız için kullanmalısınız</li>
              <li>Hizmeti yasadışı amaçlar için kullanamazsınız</li>
              <li>Başkalarının haklarını ihlal eden içerik üretemezsiniz</li>
              <li>Sistem güvenliğini tehlikeye atacak işlemler yapamazsınız</li>
            </ul>
          </section>

          <section className="py-8">
            <h2 className="flex items-center gap-2.5 text-xl font-semibold tracking-tight text-foreground">
              <Scale className="h-5 w-5 shrink-0 text-accent-foreground" />
              Ödeme ve İade
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
              Ödeme koşulları:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] leading-7 text-muted-foreground marker:text-border">
              <li>Tüm ödemeler ön ödemelidir</li>
              <li>Planlar otomatik olarak yenilenir</li>
              <li>14 gün içinde iptal garantisi vardır</li>
              <li>İade talepleri iletişim formu üzerinden yapılmalıdır</li>
            </ul>
          </section>

          <section className="py-8">
            <h2 className="flex items-center gap-2.5 text-xl font-semibold tracking-tight text-foreground">
              <AlertCircle className="h-5 w-5 shrink-0 text-accent-foreground" />
              Sorumluluk Reddi
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
              BlogProduce, oluşturulan içeriklerin doğruluğu, uygunluğu veya yasal uyumluluğu konusunda sorumluluk kabul etmez. Kullanıcılar, ürettikleri içeriklerin telif hakları, gizlilik ve diğer yasal konularda tam sorumluluğa sahiptir.
            </p>
          </section>

          <section className="py-8">
            <h2 className="flex items-center gap-2.5 text-xl font-semibold tracking-tight text-foreground">
              <Shield className="h-5 w-5 shrink-0 text-accent-foreground" />
              Hesap İptali
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
              Hesabınızı istediğiniz zaman iptal edebilirsiniz:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] leading-7 text-muted-foreground marker:text-border">
              <li>Ayarlar sayfasından hesap iptal edilebilir</li>
              <li>İptal sonrası mevcut dönem sonuna kadar hizmet devam eder</li>
              <li>Verileriniz iptal sonrası 30 gün saklanır</li>
              <li>
                Kalıcı silme için{' '}
                <a href="/contact" className="font-medium text-accent-foreground hover:underline">
                  iletişime
                </a>
                {' '}geçin
              </li>
            </ul>
          </section>

          <section className="py-8">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Değişiklikler
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
              Bu şartlar gerektiğinde güncellenebilir. Önemli değişiklikler e-posta ile bildirilir. Değişikliklerden haberdar olmak için bu sayfayı düzenli olarak kontrol edin.
            </p>
          </section>
        </motion.div>
      </main>
    </div>
  );
}
