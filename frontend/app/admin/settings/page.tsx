'use client';

import { useState } from 'react';
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Database,
  Globe,
  Loader2,
  Save,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/ui/page-header';

const CHECKBOX_CLASS =
  'mt-0.5 h-4 w-4 shrink-0 rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [settings, setSettings] = useState({
    siteName: 'BlogProduce',
    siteDescription: 'AI-powered blog content generator',
    maintenanceMode: false,
    allowRegistration: true,
    requireEmailVerification: false,
    maxBlogsPerUser: 100,
    maxTokensPerMonth: 1000000,
    emailNotifications: true,
    systemNotifications: true,
  });

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      setSaved(false);

      // TODO: Backend API entegrasyonu
      // await apiRequest('/admin/settings', {
      //   method: 'PATCH',
      //   body: JSON.stringify(settings),
      // });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ayarlar kaydedilirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const settingSections = [
    {
      title: 'Genel Ayarlar',
      icon: Globe,
      fields: [
        {
          label: 'Site Adı',
          key: 'siteName',
          type: 'text',
        },
        {
          label: 'Site Açıklaması',
          key: 'siteDescription',
          type: 'textarea',
        },
      ],
    },
    {
      title: 'Kullanıcı Ayarları',
      icon: Shield,
      fields: [
        {
          label: 'Kayıt İzni',
          key: 'allowRegistration',
          type: 'checkbox',
          description: 'Yeni kullanıcı kaydına izin ver',
        },
        {
          label: 'E-posta Doğrulama Gerekli',
          key: 'requireEmailVerification',
          type: 'checkbox',
          description: 'Kullanıcıların e-posta adreslerini doğrulamasını zorunlu kıl',
        },
        {
          label: 'Kullanıcı Başına Maksimum Blog',
          key: 'maxBlogsPerUser',
          type: 'number',
        },
        {
          label: 'Aylık Maksimum Token',
          key: 'maxTokensPerMonth',
          type: 'number',
        },
      ],
    },
    {
      title: 'Sistem Ayarları',
      icon: Database,
      fields: [
        {
          label: 'Bakım Modu',
          key: 'maintenanceMode',
          type: 'checkbox',
          description: 'Sistemi bakım moduna al (sadece admin erişebilir)',
        },
      ],
    },
    {
      title: 'Bildirim Ayarları',
      icon: Bell,
      fields: [
        {
          label: 'E-posta Bildirimleri',
          key: 'emailNotifications',
          type: 'checkbox',
          description: 'E-posta bildirimlerini etkinleştir',
        },
        {
          label: 'Sistem Bildirimleri',
          key: 'systemNotifications',
          type: 'checkbox',
          description: 'Sistem bildirimlerini etkinleştir',
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Sistem Ayarları" description="Sistem genelinde ayarları yönetin" />

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-[var(--destructive-muted)] p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Hata</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      {saved && (
        <div className="flex items-start gap-2 rounded-xl border border-success/30 bg-success-muted p-4 text-sm text-success">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Başarılı</p>
            <p className="mt-1">Ayarlar başarıyla kaydedildi</p>
          </div>
        </div>
      )}

      {/* Settings Sections */}
      <div className="space-y-6">
        {settingSections.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.title}
              className="overflow-hidden rounded-xl border border-border bg-card shadow-card"
            >
              <div className="flex items-center gap-3 border-b border-border px-6 py-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <Icon className="h-4 w-4" />
                </span>
                <h2 className="text-base font-semibold text-foreground">{section.title}</h2>
              </div>

              <div className="space-y-6 p-6">
                {section.fields.map((field) => (
                  <div key={field.key}>
                    {field.type === 'checkbox' ? (
                      <label className="flex cursor-pointer items-start gap-3">
                        <input
                          type="checkbox"
                          checked={settings[field.key as keyof typeof settings] as boolean}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              [field.key]: e.target.checked,
                            })
                          }
                          className={CHECKBOX_CLASS}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{field.label}</p>
                          {field.description && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {field.description}
                            </p>
                          )}
                        </div>
                      </label>
                    ) : field.type === 'textarea' ? (
                      <div>
                        <label className="mb-2 block text-sm font-medium text-foreground">
                          {field.label}
                        </label>
                        <Textarea
                          value={settings[field.key as keyof typeof settings] as string}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              [field.key]: e.target.value,
                            })
                          }
                          rows={3}
                          className="resize-none"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="mb-2 block text-sm font-medium text-foreground">
                          {field.label}
                        </label>
                        <Input
                          type={field.type}
                          value={settings[field.key as keyof typeof settings] as string | number}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value,
                            })
                          }
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading} className="px-8">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Kaydediliyor...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Ayarları Kaydet
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
