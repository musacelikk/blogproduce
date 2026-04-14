'use client';

import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileText, UserCheck, Database, AlertCircle } from 'lucide-react';

export default function KVKKPage() {
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
              KVKK Aydınlatma Metni
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
                Veri Sorumlusu
              </h2>
              <p
                className="text-muted-foreground leading-relaxed mb-4"
              >
                6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) uyarınca, kişisel verileriniz aşağıdaki şekilde işlenmektedir:
              </p>
              <div className="bg-[#f5f5f5] rounded-lg p-4 mt-4">
                <p
                  className="text-sm text-muted-foreground"
                >
                  <strong>Veri Sorumlusu:</strong> IBBM Tech.<br />
                  <strong>Adres:</strong> İstanbul, Türkiye<br />
                  <strong>E-posta:</strong> <a href="/contact" className="text-[#203eec] hover:underline">İletişim Sayfası</a>
                </p>
              </div>
            </section>

            <section className="bg-card border border-border rounded-2xl p-6 md:p-8">
              <h2
                className="text-2xl md:text-3xl font-semibold mb-4 text-foreground flex items-center gap-3"
              >
                <Database className="w-6 h-6 text-[#203eec]" />
                İşlenen Kişisel Veriler
              </h2>
              <p
                className="text-muted-foreground leading-relaxed mb-4"
              >
                Hizmetlerimizi sağlamak için aşağıdaki kişisel verileriniz işlenmektedir:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li><strong>Kimlik Bilgileri:</strong> Ad, soyad</li>
                <li><strong>İletişim Bilgileri:</strong> E-posta adresi, telefon numarası</li>
                <li><strong>Hesap Bilgileri:</strong> Kullanıcı adı, şifre (hashlenmiş)</li>
                <li><strong>Kullanım Verileri:</strong> Oluşturulan bloglar, API kullanım verileri, işlem geçmişi</li>
                <li><strong>Teknik Veriler:</strong> IP adresi, tarayıcı bilgileri, cihaz bilgileri</li>
                <li><strong>Çerez Verileri:</strong> Oturum bilgileri, tercihler</li>
              </ul>
            </section>

            <section className="bg-card border border-border rounded-2xl p-6 md:p-8">
              <h2
                className="text-2xl md:text-3xl font-semibold mb-4 text-foreground flex items-center gap-3"
              >
                <FileText className="w-6 h-6 text-[#203eec]" />
                İşleme Amaçları
              </h2>
              <p
                className="text-muted-foreground leading-relaxed mb-4"
              >
                Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
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

            <section className="bg-card border border-border rounded-2xl p-6 md:p-8">
              <h2
                className="text-2xl md:text-3xl font-semibold mb-4 text-foreground flex items-center gap-3"
              >
                <Lock className="w-6 h-6 text-[#203eec]" />
                İşleme Hukuki Sebepleri
              </h2>
              <p
                className="text-muted-foreground leading-relaxed mb-4"
              >
                Kişisel verileriniz KVKK&apos;nın 5. ve 6. maddelerinde belirtilen aşağıdaki hukuki sebeplere dayanarak işlenmektedir:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Açık rızanız</li>
                <li>Sözleşmenin kurulması veya ifası ile doğrudan ilgili olması</li>
                <li>Yasal yükümlülüğün yerine getirilmesi</li>
                <li>Veri sorumlusunun hukuki yükümlülüğünü yerine getirmesi</li>
                <li>Meşru menfaatlerimiz (güvenlik, hizmet kalitesi vb.)</li>
              </ul>
            </section>

            <section className="bg-card border border-border rounded-2xl p-6 md:p-8">
              <h2
                className="text-2xl md:text-3xl font-semibold mb-4 text-foreground flex items-center gap-3"
              >
                <Eye className="w-6 h-6 text-[#203eec]" />
                Veri Paylaşımı
              </h2>
              <p
                className="text-muted-foreground leading-relaxed mb-4"
              >
                Kişisel verileriniz, yukarıda belirtilen amaçlar doğrultusunda aşağıdaki taraflarla paylaşılabilir:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Hizmet sağlayıcılarımız (hosting, e-posta, ödeme işlemcileri)</li>
                <li>Yasal yükümlülükler gereği kamu kurum ve kuruluşları</li>
                <li>Yasal danışmanlar ve denetim firmaları</li>
                <li>İş ortaklarımız (sadece gerekli durumlarda ve sınırlı ölçüde)</li>
              </ul>
              <p
                className="text-muted-foreground leading-relaxed mt-4"
              >
                Verileriniz yurt dışına aktarılacaksa, KVKK&apos;nın 9. maddesi uyarınca gerekli güvenlik önlemleri alınacak ve yeterli koruma sağlanacaktır.
              </p>
            </section>

            <section className="bg-card border border-border rounded-2xl p-6 md:p-8">
              <h2
                className="text-2xl md:text-3xl font-semibold mb-4 text-foreground flex items-center gap-3"
              >
                <UserCheck className="w-6 h-6 text-[#203eec]" />
                Haklarınız
              </h2>
              <p
                className="text-muted-foreground leading-relaxed mb-4"
              >
                KVKK&apos;nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
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

            <section className="bg-card border border-border rounded-2xl p-6 md:p-8">
              <h2
                className="text-2xl md:text-3xl font-semibold mb-4 text-foreground flex items-center gap-3"
              >
                <AlertCircle className="w-6 h-6 text-[#203eec]" />
                Haklarınızı Kullanma
              </h2>
              <p
                className="text-muted-foreground leading-relaxed mb-4"
              >
                Yukarıda belirtilen haklarınızı kullanmak için{' '}
                <a href="/contact" className="text-[#203eec] hover:underline">
                  iletişim
                </a>
                {' '}sayfamızdan bize ulaşabilir veya e-posta gönderebilirsiniz. Talebiniz en geç 30 gün içinde değerlendirilip sonuçlandırılacaktır.
              </p>
              <p
                className="text-muted-foreground leading-relaxed mt-4"
              >
                Kişisel Verileri Koruma Kurulu&apos;na şikayette bulunma hakkınız saklıdır.
              </p>
            </section>

            <section className="bg-card border border-border rounded-2xl p-6 md:p-8">
              <h2
                className="text-2xl md:text-3xl font-semibold mb-4 text-foreground"
              >
                Veri Güvenliği
              </h2>
              <p
                className="text-muted-foreground leading-relaxed"
              >
                Kişisel verilerinizin güvenliği için teknik ve idari tedbirler alınmıştır. Verileriniz SSL/TLS şifreleme ile korunmakta, şifreleriniz bcrypt ile hashlenmekte ve güvenli sunucularda saklanmaktadır.
              </p>
            </section>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
