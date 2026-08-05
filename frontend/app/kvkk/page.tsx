'use client';

import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileText, UserCheck, Database, AlertCircle } from 'lucide-react';

export default function KVKKPage() {
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
            KVKK Aydınlatma Metni
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
              Veri Sorumlusu
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
              6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) uyarınca, kişisel verileriniz aşağıdaki şekilde işlenmektedir:
            </p>
            <div className="mt-4 rounded-lg border border-border bg-secondary p-4">
              <p className="text-sm leading-7 text-muted-foreground">
                <strong className="font-medium text-foreground">Veri Sorumlusu:</strong> Bilal ORHANLAR<br />
                <strong className="font-medium text-foreground">Adres:</strong> İstanbul, Türkiye<br />
                <strong className="font-medium text-foreground">E-posta:</strong>{' '}
                <a href="/contact" className="font-medium text-accent-foreground hover:underline">İletişim Sayfası</a>
              </p>
            </div>
          </section>

          <section className="py-8">
            <h2 className="flex items-center gap-2.5 text-xl font-semibold tracking-tight text-foreground">
              <Database className="h-5 w-5 shrink-0 text-accent-foreground" />
              İşlenen Kişisel Veriler
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
              Hizmetlerimizi sağlamak için aşağıdaki kişisel verileriniz işlenmektedir:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] leading-7 text-muted-foreground marker:text-border">
              <li><strong className="font-medium text-foreground">Kimlik Bilgileri:</strong> Ad, soyad</li>
              <li><strong className="font-medium text-foreground">İletişim Bilgileri:</strong> E-posta adresi, telefon numarası</li>
              <li><strong className="font-medium text-foreground">Hesap Bilgileri:</strong> Kullanıcı adı, şifre (hashlenmiş)</li>
              <li><strong className="font-medium text-foreground">Kullanım Verileri:</strong> Oluşturulan bloglar, API kullanım verileri, işlem geçmişi</li>
              <li><strong className="font-medium text-foreground">Teknik Veriler:</strong> IP adresi, tarayıcı bilgileri, cihaz bilgileri</li>
              <li><strong className="font-medium text-foreground">Çerez Verileri:</strong> Oturum bilgileri, tercihler</li>
            </ul>
          </section>

          <section className="py-8">
            <h2 className="flex items-center gap-2.5 text-xl font-semibold tracking-tight text-foreground">
              <FileText className="h-5 w-5 shrink-0 text-accent-foreground" />
              İşleme Amaçları
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
              Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] leading-7 text-muted-foreground marker:text-border">
              <li>Hesap oluşturma ve yönetimi</li>
              <li>Hizmetlerimizi sağlama ve geliştirme</li>
              <li>Müşteri desteği ve iletişim</li>
              <li>Faturalama ve ödeme işlemleri</li>
              <li>Yasal yükümlülüklerin yerine getirilmesi</li>
              <li>Güvenlik ve dolandırıcılık önleme</li>
              <li>İstatistiksel analiz ve raporlama</li>
              <li>Pazarlama ve tanıtım faaliyetleri (açık rıza ile)</li>
            </ul>
          </section>

          <section className="py-8">
            <h2 className="flex items-center gap-2.5 text-xl font-semibold tracking-tight text-foreground">
              <Lock className="h-5 w-5 shrink-0 text-accent-foreground" />
              İşleme Hukuki Sebepleri
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
              Kişisel verileriniz KVKK&apos;nın 5. ve 6. maddelerinde belirtilen aşağıdaki hukuki sebeplere dayanarak işlenmektedir:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] leading-7 text-muted-foreground marker:text-border">
              <li>Açık rızanız</li>
              <li>Sözleşmenin kurulması veya ifası ile doğrudan ilgili olması</li>
              <li>Yasal yükümlülüğün yerine getirilmesi</li>
              <li>Veri sorumlusunun hukuki yükümlülüğünü yerine getirmesi</li>
              <li>Meşru menfaatlerimiz (güvenlik, hizmet kalitesi vb.)</li>
            </ul>
          </section>

          <section className="py-8">
            <h2 className="flex items-center gap-2.5 text-xl font-semibold tracking-tight text-foreground">
              <Eye className="h-5 w-5 shrink-0 text-accent-foreground" />
              Veri Paylaşımı
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
              Kişisel verileriniz, yukarıda belirtilen amaçlar doğrultusunda aşağıdaki taraflarla paylaşılabilir:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] leading-7 text-muted-foreground marker:text-border">
              <li>Hizmet sağlayıcılarımız (hosting, e-posta, ödeme işlemcileri)</li>
              <li>Yasal yükümlülükler gereği kamu kurum ve kuruluşları</li>
              <li>Yasal danışmanlar ve denetim firmaları</li>
              <li>İş ortaklarımız (sadece gerekli durumlarda ve sınırlı ölçüde)</li>
            </ul>
            <p className="mt-4 text-[15px] leading-7 text-muted-foreground">
              Verileriniz yurt dışına aktarılacaksa, KVKK&apos;nın 9. maddesi uyarınca gerekli güvenlik önlemleri alınacak ve yeterli koruma sağlanacaktır.
            </p>
          </section>

          <section className="py-8">
            <h2 className="flex items-center gap-2.5 text-xl font-semibold tracking-tight text-foreground">
              <UserCheck className="h-5 w-5 shrink-0 text-accent-foreground" />
              Haklarınız
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
              KVKK&apos;nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] leading-7 text-muted-foreground marker:text-border">
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
              <li>İşlenmişse bilgi talep etme</li>
              <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
              <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
              <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
              <li>KVKK&apos;nın 7. maddesinde öngörülen şartlar çerçevesinde silinmesini veya yok edilmesini isteme</li>
              <li>Düzeltme, silme, yok etme işlemlerinin, kişisel verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme</li>
              <li>İşlenen verilerin münhasıran otomatik sistemler ile analiz edilmesi suretiyle kişinin kendisi aleyhine bir sonucun ortaya çıkmasına itiraz etme</li>
              <li>Kişisel verilerin kanuna aykırı olarak işlenmesi sebebiyle zarara uğraması halinde zararın giderilmesini talep etme</li>
            </ul>
          </section>

          <section className="py-8">
            <h2 className="flex items-center gap-2.5 text-xl font-semibold tracking-tight text-foreground">
              <AlertCircle className="h-5 w-5 shrink-0 text-accent-foreground" />
              Haklarınızı Kullanma
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
              Yukarıda belirtilen haklarınızı kullanmak için{' '}
              <a href="/contact" className="font-medium text-accent-foreground hover:underline">
                iletişim
              </a>
              {' '}sayfamızdan bize ulaşabilir veya e-posta gönderebilirsiniz. Talebiniz en geç 30 gün içinde değerlendirilip sonuçlandırılacaktır.
            </p>
            <p className="mt-4 text-[15px] leading-7 text-muted-foreground">
              Kişisel Verileri Koruma Kurulu&apos;na şikayette bulunma hakkınız saklıdır.
            </p>
          </section>

          <section className="py-8">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Veri Güvenliği
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
              Kişisel verilerinizin güvenliği için teknik ve idari tedbirler alınmıştır. Verileriniz SSL/TLS şifreleme ile korunmakta, şifreleriniz bcrypt ile hashlenmekte ve güvenli sunucularda saklanmaktadır.
            </p>
          </section>
        </motion.div>
      </main>
    </div>
  );
}
