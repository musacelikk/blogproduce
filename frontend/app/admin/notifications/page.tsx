'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Send, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { createBroadcastNotification } from '@/lib/api';

type NotificationType = 'info' | 'warning' | 'success' | 'system';

export default function AdminNotificationsPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<NotificationType>('info');
  const [linkUrl, setLinkUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      await createBroadcastNotification({
        title: title.trim(),
        message: message.trim() || undefined,
        type,
        linkUrl: linkUrl.trim() || undefined,
      });
      setStatus('success');
      setTitle('');
      setMessage('');
      setLinkUrl('');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Bildirim gönderilemedi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 lg:p-12">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-lg md:text-xl lg:text-2xl font-normal mb-3 text-[#ebebeb]"
            style={{
              fontFamily: 'var(--font-display), \"Space Grotesk\", sans-serif',
            }}
          >
            Bildirimler
          </h1>
          <p
            className="text-sm md:text-base text-[#b3b3b3]"
            style={{
              fontFamily: 'var(--font-sans), \"Inter\", sans-serif',
            }}
          >
            Tüm kullanıcılara gidecek duyuru ve sistem bildirimlerini buradan
            oluşturup, kullanıcı panelindeki bildirim ikonuna düşürebilirsiniz.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#151515] border border-[#2b2b2b] rounded-2xl p-5 md:p-6"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <Bell className="w-4 h-4 text-[#3B82F6]" />
              <h2
                className="text-sm md:text-base font-medium text-[#ebebeb]"
                style={{
                  fontFamily: 'var(--font-display), \"Space Grotesk\", sans-serif',
                }}
              >
                Yeni bildirim oluştur
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  className="text-xs text-[#b3b3b3]"
                  style={{
                    fontFamily: 'var(--font-sans), \"Inter\", sans-serif',
                  }}
                >
                  Başlık
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Örn: Yeni özellik yayında!"
                  required
                  className="bg-[#111111] border-[#2b2b2b] text-[#ebebeb] placeholder:text-[#555555] focus-visible:ring-[#3B82F6]"
                />
              </div>
              <div className="space-y-2">
                <label
                  className="text-xs text-[#b3b3b3]"
                  style={{
                    fontFamily: 'var(--font-sans), \"Inter\", sans-serif',
                  }}
                >
                  Tür
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'info', label: 'Bilgi' },
                    { id: 'success', label: 'Başarılı' },
                    { id: 'warning', label: 'Uyarı' },
                    { id: 'system', label: 'Sistem' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setType(item.id as NotificationType)}
                      className={`text-[11px] px-2 py-1 rounded-lg border ${
                        type === item.id
                          ? 'border-[#3B82F6] bg-[#1d2740] text-[#ebebeb]'
                          : 'border-[#333333] text-[#b3b3b3] hover:border-[#444444]'
                      }`}
                      style={{
                        fontFamily: 'var(--font-sans), \"Inter\", sans-serif',
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label
                className="text-xs text-[#b3b3b3]"
                style={{
                  fontFamily: 'var(--font-sans), \"Inter\", sans-serif',
                }}
              >
                Mesaj (opsiyonel)
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Kullanıcıya gösterilecek açıklama metni..."
                className="bg-[#111111] border-[#2b2b2b] text-[#ebebeb] placeholder:text-[#555555] focus-visible:ring-[#3B82F6]"
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-xs text-[#b3b3b3]"
                style={{
                  fontFamily: 'var(--font-sans), \"Inter\", sans-serif',
                }}
              >
                Link (opsiyonel)
              </label>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="Örn: /pricing veya https://blogenerate.com/yeni-ozellik"
                className="bg-[#111111] border-[#2b2b2b] text-[#ebebeb] placeholder:text-[#555555] focus-visible:ring-[#3B82F6]"
              />
              <p
                className="text-[10px] text-[#777777] flex items-center gap-1"
                style={{
                  fontFamily: 'var(--font-sans), \"Inter\", sans-serif',
                }}
              >
                <Info className="w-3 h-3" />
                Kullanıcı bildirime tıklayınca bu linke yönlendirilir.
              </p>
            </div>

            {status === 'success' && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/40">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <p
                  className="text-xs text-emerald-100"
                  style={{
                    fontFamily: 'var(--font-sans), \"Inter\", sans-serif',
                  }}
                >
                  Bildirim tüm kullanıcılara gönderildi.
                </p>
              </div>
            )}

            {status === 'error' && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/40">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <p
                  className="text-xs text-red-100"
                  style={{
                    fontFamily: 'var(--font-sans), \"Inter\", sans-serif',
                  }}
                >
                  {errorMessage || 'Bildirim gönderilirken bir hata oluştu.'}
                </p>
              </div>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="inline-flex items-center gap-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-full px-5 py-2.5 text-sm hover:rounded-2xl transition-all duration-200"
                style={{
                  fontFamily: 'var(--font-display), \"Space Grotesk\", sans-serif',
                }}
              >
                {isSubmitting ? (
                  'Gönderiliyor...'
                ) : (
                  <>
                    Bildirim Gönder
                    <Send className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}


