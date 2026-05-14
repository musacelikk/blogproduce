'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Shield, Key, CreditCard, Save, Mail, Phone, MapPin, Lock, Eye, EyeOff, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getProfile, updateProfile, updatePassword, deleteAccount } from '@/lib/api';
import { auth } from '@/lib/auth';

type TabType = 'profile' | 'account' | 'notifications' | 'api' | 'billing' | 'security';

const tabs = [
  { id: 'profile' as TabType, label: 'Profil', icon: User },
  { id: 'account' as TabType, label: 'Hesap', icon: Shield },
  { id: 'notifications' as TabType, label: 'Bildirimler', icon: Bell },
  { id: 'api' as TabType, label: 'API', icon: Key },
  { id: 'billing' as TabType, label: 'Faturalama', icon: CreditCard },
  { id: 'security' as TabType, label: 'Güvenlik', icon: Lock },
];

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    location: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const response = await getProfile();
      if (response.success && response.data) {
        setProfileData({
          name: response.data.name || '',
          email: response.data.email || '',
          phone: response.data.phone || '',
          bio: response.data.bio || '',
          location: response.data.location || '',
        });
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const [accountData, setAccountData] = useState({
    language: 'tr',
    timezone: 'Europe/Istanbul',
    dateFormat: 'DD/MM/YYYY',
  });

  const [notifications, setNotifications] = useState({
    email: true,
    blogGenerated: true,
    blogPublished: true,
    weeklyReport: false,
    marketing: false,
  });

  const [apiSettings, setApiSettings] = useState({
    apiKey: 'bg_sk_live_1234567890abcdef',
    webhookUrl: '',
    rateLimit: '100',
  });

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (activeTab === 'profile') {
        const response = await updateProfile(profileData);
        if (response.success) {
          setSuccess('Profil bilgileri başarıyla güncellendi');
        } else {
          setError(response.message || 'Profil güncellenirken bir hata oluştu');
        }
      } else if (activeTab === 'security') {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
          setError('Yeni şifreler eşleşmiyor');
          setSaving(false);
          return;
        }
        if (passwordData.newPassword.length < 6) {
          setError('Şifre en az 6 karakter olmalıdır');
          setSaving(false);
          return;
        }
        const response = await updatePassword(passwordData.currentPassword, passwordData.newPassword);
        if (response.success) {
          setSuccess('Şifre başarıyla güncellendi');
          setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
        } else {
          setError(response.message || 'Şifre güncellenirken bir hata oluştu');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const ActiveTabIcon = tabs.find(t => t.id === activeTab)?.icon || User;

  const handleDeleteAccount = async () => {
    setDeleteConfirmText('');
    setDeletePassword('');
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteAccount = async () => {
    if (deleteConfirmText.trim() !== 'HESABIMI SIL') {
      setError('Devam etmek için onay metnini "HESABIMI SIL" olarak girin');
      return;
    }
    if (!deletePassword) {
      setError('Lütfen mevcut şifrenizi girin');
      return;
    }

    try {
      setDeletingAccount(true);
      setError('');
      await deleteAccount(deletePassword);
      auth.logout();
      router.push('/register');
    } catch (err: any) {
      setError(err?.message || 'Hesap silinirken bir hata oluştu');
    } finally {
      setDeletingAccount(false);
      setIsDeleteModalOpen(false);
    }
  };

    return (
      <div className="space-y-5">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex items-center gap-4"
        >
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
               style={{ background: 'linear-gradient(135deg,#203eec,#00d4ff)' }}>
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Ayarlar</h1>
            <p className="text-sm text-muted-foreground">Profil, güvenlik ve uygulama tercihlerinizi yönetin</p>
          </div>
        </motion.div>

        {/* Tabs Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="rounded-2xl p-1.5"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="flex flex-wrap gap-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm rounded-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-[#203eec] text-white shadow-sm'
                    : 'text-muted-foreground hover:bg-[var(--secondary)] hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
          <div className="rounded-2xl p-5 lg:p-6"
               style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            {/* Tab Header */}
            <div className="flex items-center gap-2.5 mb-5 pb-5 border-b border-[var(--border)]">
              <div className="w-9 h-9 bg-[#203eec]/10 rounded-lg flex items-center justify-center">
                <ActiveTabIcon className="w-4 h-4 text-[#203eec]" />
              </div>
              <div>
                <h2
                  className="text-lg font-medium text-foreground"
                  style={{
                  }}
                >
                  {tabs.find(t => t.id === activeTab)?.label}
                </h2>
                <p
                  className="text-xs text-muted-foreground"
                  style={{
                  }}
                >
                  {activeTab === 'profile' && 'Profil bilgilerinizi güncelleyin'}
                  {activeTab === 'account' && 'Hesap ayarlarınızı yönetin'}
                  {activeTab === 'notifications' && 'Bildirim tercihlerinizi ayarlayın'}
                  {activeTab === 'api' && 'API ayarlarınızı yönetin'}
                  {activeTab === 'billing' && 'Faturalama ve ödeme bilgileriniz'}
                  {activeTab === 'security' && 'Güvenlik ayarlarınızı yönetin'}
                </p>
              </div>
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-5">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-[#203eec] rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {profileData.name.charAt(0)}
                  </div>
                  <div>
                    <Button variant="outline" size="sm" className="border-[var(--border)] hover:border-[#203eec] hover:text-[#203eec] text-sm">
                      Fotoğraf Değiştir
                    </Button>
                    <p
                      className="text-[10px] text-muted-foreground mt-1.5"
                      style={{
                      }}
                    >
                      JPG, PNG veya GIF. Max 2MB
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label
                      className="text-sm font-medium text-foreground mb-2 block"
                      style={{
                      }}
                    >
                      Ad Soyad
                    </label>
                    <Input
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="border-[var(--border)] focus:border-[#203eec]"
                    />
                  </div>
                  <div>
                    <label
                      className="text-sm font-medium text-foreground mb-2 block"
                      style={{
                      }}
                    >
                      E-posta
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        className="pl-10 border-[var(--border)] focus:border-[#203eec]"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      className="text-sm font-medium text-foreground mb-2 block"
                      style={{
                      }}
                    >
                      Telefon
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        className="pl-10 border-[var(--border)] focus:border-[#203eec]"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      className="text-sm font-medium text-foreground mb-2 block"
                      style={{
                      }}
                    >
                      Konum
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        value={profileData.location}
                        onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                        className="pl-10 border-[var(--border)] focus:border-[#203eec]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    className="text-sm font-medium text-foreground mb-2 block"
                    style={{
                    }}
                  >
                    Hakkımda
                  </label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-[var(--border)] rounded-xl focus:border-[#203eec] focus:outline-none resize-none"
                    style={{
                    }}
                  />
                </div>
              </div>
            )}

            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <div>
                  <label
                    className="text-sm font-medium text-foreground mb-2 block"
                    style={{
                    }}
                  >
                    Dil
                  </label>
                  <select
                    value={accountData.language}
                    onChange={(e) => setAccountData({ ...accountData, language: e.target.value })}
                    className="w-full px-4 py-2 border border-[var(--border)] rounded-xl focus:border-[#203eec] focus:outline-none"
                  >
                    <option value="tr">Türkçe</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div>
                  <label
                    className="text-sm font-medium text-foreground mb-2 block"
                    style={{
                    }}
                  >
                    Saat Dilimi
                  </label>
                  <select
                    value={accountData.timezone}
                    onChange={(e) => setAccountData({ ...accountData, timezone: e.target.value })}
                    className="w-full px-4 py-2 border border-[var(--border)] rounded-xl focus:border-[#203eec] focus:outline-none"
                  >
                    <option value="Europe/Istanbul">İstanbul (GMT+3)</option>
                    <option value="Europe/London">London (GMT+0)</option>
                    <option value="America/New_York">New York (GMT-5)</option>
                  </select>
                </div>

                <div>
                  <label
                    className="text-sm font-medium text-foreground mb-2 block"
                    style={{
                    }}
                  >
                    Tarih Formatı
                  </label>
                  <select
                    value={accountData.dateFormat}
                    onChange={(e) => setAccountData({ ...accountData, dateFormat: e.target.value })}
                    className="w-full px-4 py-2 border border-[var(--border)] rounded-xl focus:border-[#203eec] focus:outline-none"
                  >
                    <option value="DD/MM/YYYY">GG/AA/YYYY</option>
                    <option value="MM/DD/YYYY">AA/GG/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-AA-GG</option>
                  </select>
                </div>

                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-semibold text-red-700 mb-1">Tehlikeli Alan</p>
                  <p className="text-xs text-red-600 mb-3">
                    Hesabınızı silerseniz profiliniz ve erişiminiz kalıcı olarak kaldırılır.
                  </p>
                  <Button
                    onClick={handleDeleteAccount}
                    disabled={deletingAccount}
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-100 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {deletingAccount ? 'Hesap Siliniyor...' : 'Hesabı Sil'}
                  </Button>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                {Object.entries(notifications).map(([key, value]) => (
                  <div key={key} className="flex items-start sm:items-center justify-between gap-3 p-4 bg-[var(--secondary)] rounded-xl">
                    <div>
                      <p
                        className="font-medium text-foreground"
                        style={{
                        }}
                      >
                        {key === 'email' && 'E-posta Bildirimleri'}
                        {key === 'blogGenerated' && 'Blog Üretildiğinde'}
                        {key === 'blogPublished' && 'Blog Yayınlandığında'}
                        {key === 'weeklyReport' && 'Haftalık Rapor'}
                        {key === 'marketing' && 'Pazarlama E-postaları'}
                      </p>
                      <p
                        className="text-sm text-muted-foreground"
                        style={{
                        }}
                      >
                        {key === 'email' && 'Tüm e-posta bildirimlerini al'}
                        {key === 'blogGenerated' && 'Yeni blog üretildiğinde bildirim gönder'}
                        {key === 'blogPublished' && 'Blog yayınlandığında bildirim gönder'}
                        {key === 'weeklyReport' && 'Haftalık aktivite raporu gönder'}
                        {key === 'marketing' && 'Pazarlama ve güncelleme e-postaları al'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#203eec] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#203eec]"></div>
                    </label>
                  </div>
                ))}
              </div>
            )}

            {/* API Tab */}
            {activeTab === 'api' && (
              <div className="space-y-6">
                <div>
                  <label
                    className="text-sm font-medium text-foreground mb-2 block"
                    style={{
                    }}
                  >
                    API Anahtarı
                  </label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <Input
                      type="password"
                      value={apiSettings.apiKey}
                      readOnly
                      className="border-[var(--border)] bg-[var(--secondary)] font-mono flex-1"
                    />
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 sm:flex-none border-[var(--border)] hover:border-[#203eec] hover:text-[#203eec]">
                        Kopyala
                      </Button>
                      <Button variant="outline" className="flex-1 sm:flex-none border-[var(--border)] hover:border-[#203eec] hover:text-[#203eec]">
                        Yenile
                      </Button>
                    </div>
                  </div>
                  <p
                    className="text-xs text-muted-foreground mt-2"
                    style={{
                    }}
                  >
                    API anahtarınızı güvenli tutun ve kimseyle paylaşmayın
                  </p>
                </div>

                <div>
                  <label
                    className="text-sm font-medium text-foreground mb-2 block"
                    style={{
                    }}
                  >
                    Webhook URL
                  </label>
                  <Input
                    type="url"
                    value={apiSettings.webhookUrl}
                    onChange={(e) => setApiSettings({ ...apiSettings, webhookUrl: e.target.value })}
                    placeholder="https://example.com/webhook"
                    className="border-[var(--border)] focus:border-[#203eec]"
                  />
                  <p
                    className="text-xs text-muted-foreground mt-2"
                    style={{
                    }}
                  >
                    Blog üretildiğinde bu URL&apos;ye bildirim gönderilir
                  </p>
                </div>

                <div>
                  <label
                    className="text-sm font-medium text-foreground mb-2 block"
                    style={{
                    }}
                  >
                    Rate Limit (Dakikada)
                  </label>
                  <Input
                    type="number"
                    value={apiSettings.rateLimit}
                    onChange={(e) => setApiSettings({ ...apiSettings, rateLimit: e.target.value })}
                    className="border-[var(--border)] focus:border-[#203eec]"
                  />
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p
                    className="text-sm text-blue-800"
                    style={{
                    }}
                  >
                    💡 API dokümantasyonunu görüntülemek için{' '}
                    <a href="#" className="underline font-medium">buraya tıklayın</a>
                  </p>
                </div>
              </div>
            )}

            {/* Billing Tab */}
            {activeTab === 'billing' && (
              <div className="space-y-6">
                <div className="p-6 bg-[var(--secondary)] rounded-xl border border-[var(--border)]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                      <h3
                        className="text-lg font-medium text-foreground mb-1"
                        style={{
                        }}
                      >
                        Mevcut Plan
                      </h3>
                      <p
                        className="text-sm text-muted-foreground"
                        style={{
                        }}
                      >
                        Ücretsiz Plan
                      </p>
                    </div>
                    <Button className="bg-[#203eec] hover:bg-[#1a32cc] text-white">
                      Planı Yükselt
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p
                        className="text-muted-foreground mb-1"
                        style={{
                        }}
                      >
                        Kullanılan Blog
                      </p>
                      <p
                        className="text-lg font-semibold text-foreground"
                        style={{
                        }}
                      >
                        12 / 50
                      </p>
                    </div>
                    <div>
                      <p
                        className="text-muted-foreground mb-1"
                        style={{
                        }}
                      >
                        Sonraki Fatura
                      </p>
                      <p
                        className="text-lg font-semibold text-foreground"
                        style={{
                        }}
                      >
                        Ücretsiz
                      </p>
                    </div>
                    <div>
                      <p
                        className="text-muted-foreground mb-1"
                        style={{
                        }}
                      >
                        Ödeme Yöntemi
                      </p>
                      <p
                        className="text-lg font-semibold text-foreground"
                        style={{
                        }}
                      >
                        Yok
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3
                    className="text-lg font-medium text-foreground mb-4"
                    style={{
                    }}
                  >
                    Fatura Geçmişi
                  </h3>
                  <div className="p-8 text-center border border-[var(--border)] rounded-xl">
                    <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p
                      className="text-muted-foreground"
                      style={{
                      }}
                    >
                      Henüz fatura bulunmuyor
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                {success && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                    <p className="text-sm text-green-600">{success}</p>
                  </div>
                )}
                <div>
                  <label
                    className="text-sm font-medium text-foreground mb-2 block"
                    style={{
                    }}
                  >
                    Mevcut Şifre
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mevcut şifrenizi girin"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="pr-10 border-[var(--border)] focus:border-[#203eec]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    className="text-sm font-medium text-foreground mb-2 block"
                    style={{
                    }}
                  >
                    Yeni Şifre
                  </label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Yeni şifrenizi girin"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="pr-10 border-[var(--border)] focus:border-[#203eec]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p
                    className="text-xs text-muted-foreground mt-2"
                    style={{
                    }}
                  >
                    En az 6 karakter olmalıdır
                  </p>
                </div>

                <div>
                  <label
                    className="text-sm font-medium text-foreground mb-2 block"
                    style={{
                    }}
                  >
                    Yeni Şifre (Tekrar)
                  </label>
                  <Input
                    type="password"
                    placeholder="Yeni şifrenizi tekrar girin"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="border-[var(--border)] focus:border-[#203eec]"
                  />
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <p
                    className="text-sm text-yellow-800"
                    style={{
                    }}
                  >
                    ⚠️ Şifrenizi değiştirdikten sonra tüm cihazlardan çıkış yapmanız gerekebilir
                  </p>
                </div>

                <div className="pt-6 border-t border-[var(--border)]">
                  <h3
                    className="text-lg font-medium text-foreground mb-4"
                    style={{
                    }}
                  >
                    İki Faktörlü Doğrulama
                  </h3>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[var(--secondary)] rounded-xl">
                    <div>
                      <p
                        className="font-medium text-foreground"
                        style={{
                        }}
                      >
                        2FA Aktif Değil
                      </p>
                      <p
                        className="text-sm text-muted-foreground"
                        style={{
                        }}
                      >
                        Hesabınızı daha güvenli hale getirin
                      </p>
                    </div>
                    <Button variant="outline" className="border-[var(--border)] hover:border-[#203eec] hover:text-[#203eec]">
                      Etkinleştir
                    </Button>
                  </div>
                </div>
              </div>
            )}

          {/* Save Button */}
          <div className="mt-6 pt-5 border-t border-[var(--border)] flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#203eec] hover:bg-[#1a32cc] text-white rounded-full px-5 py-2.5 text-sm"
              style={{
              }}
            >
              {saving ? (
                <>
                  <span className="animate-spin mr-1.5">⏳</span>
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  Değişiklikleri Kaydet
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/45"
            onClick={() => !deletingAccount && setIsDeleteModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-red-200 bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-semibold text-foreground">Hesabı Sil</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Bu işlem geri alınamaz. Devam etmek için aşağıya <strong>HESABIMI SIL</strong> yazın ve mevcut şifrenizi girin.
            </p>

            <div className="mt-4 space-y-3">
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="HESABIMI SIL"
                className="border-red-200 focus:border-red-400"
              />
              <Input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Mevcut şifreniz"
                className="border-red-200 focus:border-red-400"
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={deletingAccount}
              >
                Vazgeç
              </Button>
              <Button
                onClick={handleConfirmDeleteAccount}
                disabled={deletingAccount}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deletingAccount ? 'Siliniyor...' : 'Hesabı Kalıcı Olarak Sil'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

