'use client';

import { useState, useEffect } from 'react';
import { User, Bell, Shield, Key, CreditCard, Save, Mail, Phone, MapPin, Lock, Eye, EyeOff, Trash2, Loader2, AlertCircle, CheckCircle2, Receipt } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input, fieldClasses } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
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
    <div className="space-y-6">
      <PageHeader
        eyebrow="Hesap"
        title="Ayarlar"
        description="Profil, güvenlik ve uygulama tercihlerinizi yönetin"
      />

      {/* Tabs Navigation */}
      <div
        role="tablist"
        aria-label="Ayarlar bölümleri"
        className="flex flex-wrap gap-1 rounded-xl border border-border bg-surface-raised p-1.5"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-[background-color,color,box-shadow] duration-fast ease-out-quart ${
                isActive
                  ? 'bg-card text-foreground-strong shadow-card'
                  : 'text-muted-foreground hover:bg-card/60 hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <Card className="p-5 lg:p-6">
        {/* Tab Header */}
        <div className="mb-6 flex items-center gap-3 border-b border-border pb-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <ActiveTabIcon className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground-strong">
              {tabs.find(t => t.id === activeTab)?.label}
            </h2>
            <p className="text-xs text-muted-foreground">
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
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                {profileData.name.charAt(0)}
              </div>
              <div>
                <Button variant="outline" size="sm">
                  Fotoğraf Değiştir
                </Button>
                <p className="mt-1.5 text-[10px] text-muted-foreground">
                  JPG, PNG veya GIF. Max 2MB
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Ad Soyad
                </label>
                <Input
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  E-posta
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Telefon
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Konum
                </label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={profileData.location}
                    onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Hakkımda
              </label>
              <Textarea
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
        )}

        {/* Account Tab */}
        {activeTab === 'account' && (
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Dil
              </label>
              <select
                value={accountData.language}
                onChange={(e) => setAccountData({ ...accountData, language: e.target.value })}
                className={cn(fieldClasses, 'block h-10')}
              >
                <option value="tr">Türkçe</option>
                <option value="en">English</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Saat Dilimi
              </label>
              <select
                value={accountData.timezone}
                onChange={(e) => setAccountData({ ...accountData, timezone: e.target.value })}
                className={cn(fieldClasses, 'block h-10')}
              >
                <option value="Europe/Istanbul">İstanbul (GMT+3)</option>
                <option value="Europe/London">London (GMT+0)</option>
                <option value="America/New_York">New York (GMT-5)</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Tarih Formatı
              </label>
              <select
                value={accountData.dateFormat}
                onChange={(e) => setAccountData({ ...accountData, dateFormat: e.target.value })}
                className={cn(fieldClasses, 'block h-10')}
              >
                <option value="DD/MM/YYYY">GG/AA/YYYY</option>
                <option value="MM/DD/YYYY">AA/GG/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-AA-GG</option>
              </select>
            </div>

            <div className="rounded-xl border border-border bg-[var(--destructive-muted)] p-4">
              <p className="mb-1 text-sm font-semibold text-destructive">Tehlikeli Alan</p>
              <p className="mb-3 text-xs text-destructive">
                Hesabınızı silerseniz profiliniz ve erişiminiz kalıcı olarak kaldırılır.
              </p>
              <Button onClick={handleDeleteAccount} disabled={deletingAccount} variant="destructive">
                <Trash2 />
                {deletingAccount ? 'Hesap Siliniyor...' : 'Hesabı Sil'}
              </Button>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            {Object.entries(notifications).map(([key, value]) => (
              <div
                key={key}
                className="flex items-start justify-between gap-4 rounded-xl border border-border bg-surface-raised p-4 sm:items-center"
              >
                <div>
                  <p className="font-medium text-foreground-strong">
                    {key === 'email' && 'E-posta Bildirimleri'}
                    {key === 'blogGenerated' && 'Blog Üretildiğinde'}
                    {key === 'blogPublished' && 'Blog Yayınlandığında'}
                    {key === 'weeklyReport' && 'Haftalık Rapor'}
                    {key === 'marketing' && 'Pazarlama E-postaları'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {key === 'email' && 'Tüm e-posta bildirimlerini al'}
                    {key === 'blogGenerated' && 'Yeni blog üretildiğinde bildirim gönder'}
                    {key === 'blogPublished' && 'Blog yayınlandığında bildirim gönder'}
                    {key === 'weeklyReport' && 'Haftalık aktivite raporu gönder'}
                    {key === 'marketing' && 'Pazarlama ve güncelleme e-postaları al'}
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 shrink-0 rounded-full bg-muted-foreground/30 transition-colors duration-fast ease-out-quart after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-border after:bg-card after:shadow-card after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-card peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2"></div>
                </label>
              </div>
            ))}
          </div>
        )}

        {/* API Tab */}
        {activeTab === 'api' && (
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                API Anahtarı
              </label>
              <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                <Input
                  type="password"
                  value={apiSettings.apiKey}
                  readOnly
                  className="flex-1 bg-surface-sunken font-mono"
                />
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 sm:flex-none">
                    Kopyala
                  </Button>
                  <Button variant="outline" className="flex-1 sm:flex-none">
                    Yenile
                  </Button>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                API anahtarınızı güvenli tutun ve kimseyle paylaşmayın
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Webhook URL
              </label>
              <Input
                type="url"
                value={apiSettings.webhookUrl}
                onChange={(e) => setApiSettings({ ...apiSettings, webhookUrl: e.target.value })}
                placeholder="https://example.com/webhook"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Blog üretildiğinde bu URL&apos;ye bildirim gönderilir
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Rate Limit (Dakikada)
              </label>
              <Input
                type="number"
                value={apiSettings.rateLimit}
                onChange={(e) => setApiSettings({ ...apiSettings, rateLimit: e.target.value })}
              />
            </div>

            <div className="rounded-xl border border-border bg-info-muted p-4">
              <p className="text-sm text-info">
                API dokümantasyonunu görüntülemek için{' '}
                <a href="#" className="font-medium underline">buraya tıklayın</a>
              </p>
            </div>
          </div>
        )}

        {/* Billing Tab */}
        {activeTab === 'billing' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-surface-raised p-6">
              <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <p className="text-eyebrow mb-1.5">Mevcut plan</p>
                  <h3 className="text-lg font-semibold text-foreground-strong">Ücretsiz Plan</h3>
                </div>
                <Button>Planı Yükselt</Button>
              </div>
              <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
                <div>
                  <p className="mb-1 text-muted-foreground">
                    Kullanılan Blog
                  </p>
                  <p className="text-lg font-semibold text-foreground-strong tabular-nums">
                    12 / 50
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-muted-foreground">
                    Sonraki Fatura
                  </p>
                  <p className="text-lg font-semibold text-foreground-strong">
                    Ücretsiz
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-muted-foreground">
                    Ödeme Yöntemi
                  </p>
                  <p className="text-lg font-semibold text-foreground-strong">
                    Yok
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-base font-semibold text-foreground-strong">
                Fatura Geçmişi
              </h3>
              <EmptyState
                icon={<Receipt />}
                title="Henüz fatura oluşmadı"
                description="Ücretli bir plana geçtiğinizde faturalarınız burada listelenir ve PDF olarak indirilebilir."
                action={
                  <Button variant="outline">
                    <CreditCard />
                    Planları İncele
                  </Button>
                }
              />
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-[var(--destructive-muted)] p-4 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-start gap-2.5 rounded-xl border border-success/30 bg-success-muted p-4 text-sm text-success">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Mevcut Şifre
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mevcut şifrenizi girin"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Yeni Şifre
              </label>
              <div className="relative">
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Yeni şifrenizi girin"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showNewPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                En az 6 karakter olmalıdır
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Yeni Şifre (Tekrar)
              </label>
              <Input
                type="password"
                placeholder="Yeni şifrenizi tekrar girin"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              />
            </div>

            <div className="rounded-xl border border-border bg-warning-muted p-4">
              <p className="text-sm text-warning">
                Şifrenizi değiştirdikten sonra tüm cihazlardan çıkış yapmanız gerekebilir
              </p>
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="mb-4 text-base font-semibold text-foreground-strong">
                İki Faktörlü Doğrulama
              </h3>
              <div className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-surface-raised p-4 sm:flex-row sm:items-center">
                <div>
                  <p className="font-medium text-foreground-strong">
                    2FA Aktif Değil
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Hesabınızı daha güvenli hale getirin
                  </p>
                </div>
                <Button variant="outline">
                  Etkinleştir
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-6 flex justify-end border-t border-border pt-5">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <Save />
                Değişiklikleri Kaydet
              </>
            )}
          </Button>
        </div>
      </Card>

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-elevated">
            <h3 className="text-lg font-semibold text-foreground">Hesabı Sil</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Bu işlem geri alınamaz. Devam etmek için aşağıya <strong>HESABIMI SIL</strong> yazın ve mevcut şifrenizi girin.
            </p>

            <div className="mt-4 space-y-3">
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="HESABIMI SIL"
              />
              <Input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Mevcut şifreniz"
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
                variant="destructive"
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
