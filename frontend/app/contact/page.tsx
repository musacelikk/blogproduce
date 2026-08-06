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
      <main className="w-full pb-20 pt-32 sm:pb-28 sm:pt-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-2xl text-center"
          >
            <p className="text-eyebrow">İletişim</p>
            <h1 className="mt-3 text-balance text-display-xl text-foreground-strong">
              Konuşalım
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Sorularınız, önerileriniz veya destek talepleriniz için bize yazın; bir iş günü içinde
              dönüş yapıyoruz.
            </p>
          </motion.div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-10 md:grid-cols-2 md:gap-12 lg:gap-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-display-md text-foreground-strong">Bize ulaşın</h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Aşağıdaki kanallardan doğrudan iletişime geçebilir veya formu kullanabilirsiniz.
              </p>

              <div className="mt-10 space-y-6">
                {contactDetails.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-foreground-strong">{label}</h3>
                      <p className="mt-1 leading-relaxed text-muted-foreground">{value}</p>
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
              <h2 className="text-lg font-semibold text-foreground-strong">Mesaj gönderin</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Formu doldurun, ekibimiz size dönsün.
              </p>
              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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
                  <div className="rounded-lg border border-success/20 bg-success-muted p-4">
                    <p className="text-sm text-success">
                      Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağız.
                    </p>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="rounded-lg border border-destructive/20 bg-destructive-muted p-4">
                    <p className="text-sm text-destructive">
                      {errorMessage || 'Mesaj gönderilirken bir hata oluştu. Lütfen tekrar deneyin.'}
                    </p>
                  </div>
                )}

                <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
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
