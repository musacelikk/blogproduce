'use client';

import { useState } from 'react';
import { Bell, Send, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
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
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Bildirimler"
        description="Tüm kullanıcılara gidecek duyuru ve sistem bildirimlerini buradan oluşturup, kullanıcı panelindeki bildirim ikonuna düşürebilirsiniz."
      />

      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-accent-foreground" />
            <h2 className="text-base font-semibold text-foreground">Yeni bildirim oluştur</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="notification-title" className="block text-sm font-medium text-foreground">
                Başlık
              </label>
              <Input
                id="notification-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: Yeni özellik yayında!"
                required
              />
            </div>
            <div className="space-y-2">
              <span className="block text-sm font-medium text-foreground">Tür</span>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'info', label: 'Bilgi' },
                  { id: 'success', label: 'Başarılı' },
                  { id: 'warning', label: 'Uyarı' },
                  { id: 'system', label: 'Sistem' },
                ].map((item) => (
                  <Button
                    key={item.id}
                    type="button"
                    variant={type === item.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setType(item.id as NotificationType)}
                    className="px-2 text-xs"
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="notification-message" className="block text-sm font-medium text-foreground">
              Mesaj (opsiyonel)
            </label>
            <Textarea
              id="notification-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Kullanıcıya gösterilecek açıklama metni..."
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="notification-link" className="block text-sm font-medium text-foreground">
              Link (opsiyonel)
            </label>
            <Input
              id="notification-link"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="Örn: /pricing veya https://blogproduce.com/yeni-ozellik"
            />
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Info className="h-3 w-3 shrink-0" />
              Kullanıcı bildirime tıklayınca bu linke yönlendirilir.
            </p>
          </div>

          {status === 'success' && (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-success-muted p-3">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
              <p className="text-sm text-success">Bildirim tüm kullanıcılara gönderildi.</p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-[var(--destructive-muted)] p-3">
              <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
              <p className="text-sm text-destructive">
                {errorMessage || 'Bildirim gönderilirken bir hata oluştu.'}
              </p>
            </div>
          )}

          <div className="pt-2">
            <Button type="submit" disabled={isSubmitting || !title.trim()}>
              {isSubmitting ? (
                'Gönderiliyor...'
              ) : (
                <>
                  Bildirim Gönder
                  <Send className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
