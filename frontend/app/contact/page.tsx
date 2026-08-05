'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { createContact } from '@/lib/api';

const contactDetails = [
  { icon: Mail, label: 'E-posta', value: 'info@bilalorhanlar.com' },
  { icon: Phone, label: 'Telefon', value: '+90 (553) 323 1993' },
  {
    icon: MapPin,
    label: 'Adres',
    value: 'Dumlupınar Mah. Yumurtacı Abdibey Cad. No:4BE Daire:221 Kadıköy/İstanbul',
  },
];

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
      <main className="w-full px-4 pb-16 pt-32 sm:px-6 sm:pb-24 sm:pt-40 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center sm:mb-16"
          >
            <h1 className="mb-6 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              İletişim
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Sorularınız, önerileriniz veya destek talepleriniz için bizimle iletişime geçin.
            </p>
          </motion.div>

          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2 md:gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-8"
            >
              <div>
                <h2 className="mb-6 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                  Bize Ulaşın
                </h2>
                <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
                  Aşağıdaki iletişim bilgilerinden bize ulaşabilir veya iletişim formunu
                  kullanabilirsiniz.
                </p>
              </div>

              <div className="space-y-6">
                {contactDetails.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent">
                      <Icon className="h-5 w-5 text-accent-foreground" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="mb-1 font-semibold text-foreground">{label}</h3>
                      <p className="text-muted-foreground">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8"
            >
              <h2 className="mb-4 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                Mesaj Gönder
              </h2>
              <p className="mb-8 text-base text-muted-foreground">
                Bize ulaşmak için formu doldurun
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  placeholder="Ad Soyad"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                <Input
                  type="email"
                  placeholder="E-posta"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                <Input
                  placeholder="Konu"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                />
                <Textarea
                  placeholder="Mesajınız"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                />

                {submitStatus === 'success' && (
                  <div className="rounded-lg border border-border bg-success-muted p-4">
                    <p className="text-sm text-success">
                      Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağız.
                    </p>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="rounded-lg border border-border bg-[var(--destructive-muted)] p-4">
                    <p className="text-sm text-destructive">
                      {errorMessage || 'Mesaj gönderilirken bir hata oluştu. Lütfen tekrar deneyin.'}
                    </p>
                  </div>
                )}

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? (
                    'Gönderiliyor...'
                  ) : (
                    <>
                      Gönder
                      <Send className="h-4 w-4" />
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
