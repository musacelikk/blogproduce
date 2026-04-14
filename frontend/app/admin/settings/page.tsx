'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Database,
  Mail,
  Shield,
  Bell,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1
          className="text-[24px] font-normal text-white mb-2"
          style={{
            fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
          }}
        >
          Sistem Ayarları
        </h1>
        <p
          className="text-sm text-[#ebebeb]"
          style={{
            fontFamily: 'var(--font-sans), "Inter", sans-serif',
          }}
        >
          Sistem genelinde ayarları yönetin
        </p>
      </motion.div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 text-red-400">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Hata</p>
              <p>{error}</p>
            </div>
          </div>
        </div>
      )}

      {saved && (
        <div className="bg-green-500/10 border border-green-500/50 rounded-xl p-4 text-green-400">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Başarılı</p>
              <p>Ayarlar başarıyla kaydedildi</p>
            </div>
          </div>
        </div>
      )}

      {/* Settings Sections */}
      <div className="space-y-6">
        {settingSections.map((section, sectionIndex) => {
          const Icon = section.icon;
          return (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: sectionIndex * 0.1 }}
              className="bg-[#1a1a1a] rounded-xl border border-[#333333] overflow-hidden"
            >
              <div className="p-6 border-b border-[#333333] flex items-center gap-3">
                <div className="w-10 h-10 bg-[#3B82F6]/20 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#3B82F6]" />
                </div>
                <h2
                  className="text-base font-medium text-white"
                  style={{
                    fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
                  }}
                >
                  {section.title}
                </h2>
              </div>

              <div className="p-6 space-y-6">
                {section.fields.map((field) => (
                  <div key={field.key}>
                    {field.type === 'checkbox' ? (
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings[field.key as keyof typeof settings] as boolean}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              [field.key]: e.target.checked,
                            })
                          }
                          className="mt-1 w-4 h-4 text-[#3B82F6] border-[#333333] rounded focus:ring-[#3B82F6] bg-[#0f0f0f]"
                        />
                        <div className="flex-1">
                          <p
                            className="text-white font-medium mb-1"
                            style={{
                              fontFamily: 'var(--font-sans), "Inter", sans-serif',
                            }}
                          >
                            {field.label}
                          </p>
                          {field.description && (
                            <p
                              className="text-xs text-[#ebebeb]"
                              style={{
                                fontFamily: 'var(--font-sans), "Inter", sans-serif',
                              }}
                            >
                              {field.description}
                            </p>
                          )}
                        </div>
                      </label>
                    ) : field.type === 'textarea' ? (
                      <div>
                        <label
                          className="block text-white font-medium mb-2"
                          style={{
                            fontFamily: 'var(--font-sans), "Inter", sans-serif',
                          }}
                        >
                          {field.label}
                        </label>
                        <textarea
                          value={settings[field.key as keyof typeof settings] as string}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              [field.key]: e.target.value,
                            })
                          }
                          rows={3}
                          className="w-full px-4 py-2 bg-[#0f0f0f] rounded-lg border border-[#333333] text-white placeholder:text-[#ebebeb] focus:border-[#3B82F6] focus:outline-none resize-none"
                          style={{
                            fontFamily: 'var(--font-sans), "Inter", sans-serif',
                          }}
                        />
                      </div>
                    ) : (
                      <div>
                        <label
                          className="block text-white font-medium mb-2"
                          style={{
                            fontFamily: 'var(--font-sans), "Inter", sans-serif',
                          }}
                        >
                          {field.label}
                        </label>
                        <input
                          type={field.type}
                          value={settings[field.key as keyof typeof settings] as string | number}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 bg-[#0f0f0f] rounded-lg border border-[#333333] text-white placeholder:text-[#ebebeb] focus:border-[#3B82F6] focus:outline-none"
                          style={{
                            fontFamily: 'var(--font-sans), "Inter", sans-serif',
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="flex justify-end"
      >
        <Button
          onClick={handleSave}
          disabled={loading}
          className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-8"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Kaydediliyor...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Ayarları Kaydet
            </>
          )}
        </Button>
      </motion.div>
    </div>
  );
}
