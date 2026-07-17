'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { createContact } from '@/lib/api';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      await createContact(formData);
      setSubmitStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Mesaj gönderilirken bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

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
              İletişim
            </h1>
            <p
              className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4"
            >
              Sorularınız, önerileriniz veya destek talepleriniz için bizimle iletişime geçin.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12 max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6 md:space-y-8"
            >
              <div>
                <h2
                  className="text-2xl md:text-3xl font-semibold tracking-tight mb-4 md:mb-6 text-foreground"
                >
                  Bize Ulaşın
                </h2>
                <p
                  className="text-base md:text-lg text-muted-foreground mb-6 md:mb-8"
                >
                  Aşağıdaki iletişim bilgilerinden bize ulaşabilir veya iletişim formunu
                  kullanabilirsiniz.
                </p>
              </div>

              <div className="space-y-4 md:space-y-6">
                <div className="flex items-start">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-card border border-border rounded-2xl flex items-center justify-center mr-3 md:mr-4 flex-shrink-0">
                    <Mail className="w-5 h-5 md:w-6 md:h-6 text-[#203eec]" />
                  </div>
                  <div>
                    <h3
                      className="font-semibold mb-1 text-foreground"
                    >
                      E-posta
                    </h3>
                    <p
                      className="text-muted-foreground"
                    >
                      info@bilalorhanlar.com
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-card border border-border rounded-2xl flex items-center justify-center mr-3 md:mr-4 flex-shrink-0">
                    <Phone className="w-5 h-5 md:w-6 md:h-6 text-[#203eec]" />
                  </div>
                  <div>
                    <h3
                      className="font-semibold mb-1 text-foreground"
                    >
                      Telefon
                    </h3>
                    <p
                      className="text-muted-foreground"
                    >
                      +90 (553) 323 1993
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-card border border-border rounded-2xl flex items-center justify-center mr-3 md:mr-4 flex-shrink-0">
                    <MapPin className="w-5 h-5 md:w-6 md:h-6 text-[#203eec]" />
                  </div>
                  <div>
                    <h3
                      className="font-semibold mb-1 text-foreground"
                    >
                      Adres
                    </h3>
                    <p
                      className="text-muted-foreground"
                    >
                      Dumlupınar Mah. Yumurtacı Abdibey Cad. No:4BE Daire:221 Kadıköy/İstanbul
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-card border border-border rounded-2xl md:rounded-3xl p-6 md:p-12"
            >
              <h2
                className="text-2xl md:text-3xl font-semibold tracking-tight mb-4 text-foreground"
              >
                Mesaj Gönder
              </h2>
              <p
                className="text-base md:text-lg text-muted-foreground mb-6 md:mb-8"
              >
                Bize ulaşmak için formu doldurun
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  placeholder="Ad Soyad"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="bg-background border-border focus-visible:ring-[#203eec]"
                />
                <Input
                  type="email"
                  placeholder="E-posta"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="bg-background border-border focus-visible:ring-[#203eec]"
                />
                <Input
                  placeholder="Konu"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="bg-background border-border focus-visible:ring-[#203eec]"
                />
                <Textarea
                  placeholder="Mesajınız"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="bg-background border-border focus-visible:ring-[#203eec]"
                />

                {submitStatus === 'success' && (
                  <div className="p-4 bg-[#203eec]/10 border border-[#203eec]/20 rounded-2xl">
                    <p
                      className="text-[#203eec]"
                    >
                      Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağız.
                    </p>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                    <p
                      className="text-red-500"
                    >
                      {errorMessage || 'Mesaj gönderilirken bir hata oluştu. Lütfen tekrar deneyin.'}
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#203eec] hover:bg-[#1a32cc] text-white rounded-full py-[15px] hover:rounded-2xl transition-all duration-200"
                >
                  {isSubmitting ? (
                    'Gönderiliyor...'
                  ) : (
                    <>
                      Gönder
                      <Send className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
