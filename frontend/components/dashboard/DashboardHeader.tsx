'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Bell, LogOut, Settings, ChevronDown, Check, Zap, Menu, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSidebar } from '@/contexts/SidebarContext';
import { logout, getNotifications, getUnreadNotificationCount, markNotificationAsRead, markAllNotificationsAsRead, getCurrentPlan, getCurrentUsage, type Notification } from '@/lib/api';
import type { UserPlanInfo, UsageLedger } from '@/lib/api';
import { auth } from '@/lib/auth';

const pageMetadata: Record<string, { title: string; description: string }> = {
  '/dashboard':            { title: 'Hoş Geldiniz 👋',         description: 'AI destekli blog üretimine devam edin' },
  '/dashboard/generate':   { title: 'Yeni Blog Üret',           description: "Prompt'a göre özel, SEO uyumlu içerik üretin" },
  '/dashboard/usage':      { title: 'Token Kullanımı',          description: 'Workspace bazlı kullanımınızı takip edin' },
  '/dashboard/blogs':      { title: 'Bloglarım',                description: 'Tüm içeriklerinizi yönetin' },
  '/dashboard/workspaces': { title: "Workspace'lerim",          description: 'İçeriklerinizi organize edin' },
  '/dashboard/plans':      { title: 'Planlar & Fiyatlandırma',  description: 'İhtiyacınıza uygun planı seçin' },
  '/dashboard/billing':    { title: 'Fatura Geçmişi',           description: 'Abonelik ve ödeme geçmişiniz' },
  '/dashboard/history':    { title: 'Geçmiş',                   description: 'Tüm aktivite geçmişiniz' },
  '/dashboard/reports':    { title: 'Raporlar & Analitik',      description: 'Blog performansınızı görüntüleyin' },
  '/dashboard/settings':   { title: 'Ayarlar',                  description: 'Hesap ayarlarınızı yönetin' },
  '/dashboard/api-docs':   { title: 'API Dokümantasyonu',       description: "BlogProduce API'sini entegre edin" },
};

export function DashboardHeader() {
  const [isProfileOpen, setIsProfileOpen]       = useState(false);
  const [user, setUser]                         = useState<any>(null);
  const [planInfo, setPlanInfo]                 = useState<UserPlanInfo | null>(null);
  const [usage, setUsage]                       = useState<UsageLedger | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications]       = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount]           = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const { isMobileOpen, setIsMobileOpen } = useSidebar();
  const router   = useRouter();
  const pathname = usePathname();

  const currentMeta = pageMetadata[pathname] ?? null;

  useEffect(() => {
    setUser(auth.getUser());
    loadUnreadCount();
    const loadPlanAndUsage = async () => {
      try {
        const [plan, usageData] = await Promise.all([
          getCurrentPlan().catch(() => null),
          getCurrentUsage().catch(() => null),
        ]);
        setPlanInfo(plan ?? null);
        setUsage(usageData ?? null);
      } catch {}
    };
    loadPlanAndUsage();
  }, []);

  const loadUnreadCount = async () => {
    try { setUnreadCount(await getUnreadNotificationCount()); } catch {}
  };

  const loadNotifications = async () => {
    try {
      setIsLoadingNotifications(true);
      const data = await getNotifications({ limit: 10 });
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.isRead).length);
    } catch {} finally { setIsLoadingNotifications(false); }
  };

  const handleToggleNotifications = async () => {
    const next = !isNotificationsOpen;
    setIsNotificationsOpen(next);
    if (next) await loadNotifications();
  };

  const handleNotificationClick = async (n: Notification) => {
    try {
      if (!n.isRead) {
        await markNotificationAsRead(n.id);
        setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      if (n.linkUrl) { router.push(n.linkUrl); setIsNotificationsOpen(false); }
    } catch {}
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleLogout = async () => { await logout(); router.push('/login'); };

  const initials = user?.name?.charAt(0)?.toUpperCase() ?? 'U';

  const total    = usage ? Number(usage.tokensIn) + Number(usage.tokensOut) : 0;
  const maxNum   = typeof planInfo?.currentPlan?.features?.maxTokensPerMonth === 'number'
    ? planInfo.currentPlan.features.maxTokensPerMonth : null;
  const showToken = total > 0 || maxNum != null;

  return (
    <header
      className="fixed top-0 right-0 left-0 flex items-center justify-between px-4 sm:px-5 h-14 z-50"
      style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}
    >
      {/* Left: Hamburger (mobile) + Logo + Page title */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* Mobile hamburger */}
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="lg:hidden p-2 rounded-xl transition-colors flex-shrink-0"
          style={{ color: 'var(--foreground)' }}
          aria-label="Menüyü aç/kapat"
        >
          {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <Link href="/dashboard" className="flex items-center gap-2.5 flex-shrink-0">
          <Image src="/images/logo.png" alt="BlogProduce" width={64} height={64} className="w-auto h-16 object-contain" />
        </Link>

        {currentMeta && (
          <div className="hidden lg:flex items-center gap-2 min-w-0 ml-6 pl-6" style={{ borderLeft: '1px solid var(--border)' }}>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate leading-tight">{currentMeta.title}</p>
              <p className="text-[11px] text-muted-foreground truncate leading-tight">{currentMeta.description}</p>
            </div>
          </div>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">

        {/* Plan badge */}
        <Link
          href="/dashboard/plans"
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors"
          style={{
            background: 'linear-gradient(135deg,#203eec15,#00d4ff15)',
            border: '1px solid #203eec30',
            color: '#203eec',
          }}
        >
          {planInfo?.currentPlan?.name ?? (planInfo?.isFree ? 'Ücretsiz' : '—')}
          <span className="text-[10px] font-normal opacity-70">
            · {planInfo?.subscription?.daysRemaining != null && planInfo.subscription.daysRemaining >= 0
              ? `${planInfo.subscription.daysRemaining}g`
              : '∞'}
          </span>
        </Link>

        {/* Token badge */}
        {showToken && (
          <Link
            href="/dashboard/usage"
            className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}
            title="Token kullanımı"
          >
            <Zap className="w-3 h-3" style={{ color: '#203eec' }} />
            {total >= 1000 ? `${(total / 1000).toFixed(1)}K` : total}
            {maxNum != null ? ` / ${maxNum >= 1000 ? `${(maxNum / 1000).toFixed(0)}K` : maxNum}` : ''} token
          </Link>
        )}

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={handleToggleNotifications}
            className="relative p-2 rounded-lg transition-colors hover:bg-[var(--card)]"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 px-0.5 rounded-full text-[9px] text-white flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#203eec,#00d4ff)' }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
              <div
                className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-80 rounded-2xl shadow-xl z-50 overflow-hidden"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Bildirimler</p>
                    <p className="text-[10px] text-muted-foreground">
                      {unreadCount > 0 ? `${unreadCount} okunmamış` : 'Tümü okundu'}
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-colors"
                      style={{ color: '#203eec' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#203eec15'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      <Check className="w-3 h-3" /> Tümünü oku
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {isLoadingNotifications ? (
                    <div className="py-8 text-center text-xs text-muted-foreground">Yükleniyor…</div>
                  ) : notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground">Henüz bildirim yok</div>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className="w-full text-left px-4 py-3 transition-colors"
                        style={{
                          borderBottom: '1px solid var(--border)',
                          background: !n.isRead ? '#203eec08' : 'transparent',
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--card)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = !n.isRead ? '#203eec08' : 'transparent'; }}
                      >
                        <p className={`text-xs font-medium mb-0.5 ${!n.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {n.title}
                        </p>
                        {n.message && <p className="text-[11px] text-muted-foreground line-clamp-2">{n.message}</p>}
                        <p className="mt-1 text-[10px] text-muted-foreground opacity-60">
                          {new Date(n.createdAt).toLocaleString('tr-TR')}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl transition-colors"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#203eec,#00d4ff)' }}
            >
              {initials}
            </div>
            <div className="hidden sm:block text-left pr-1">
              <p className="text-[11px] font-semibold text-foreground leading-tight">{user?.name ?? 'Kullanıcı'}</p>
              <p className="text-[10px] text-muted-foreground leading-tight max-w-[100px] truncate">{user?.email ?? ''}</p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground hidden sm:block transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
          </button>

          {isProfileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
              <div
                className="absolute right-0 top-full mt-2 w-52 rounded-2xl shadow-xl z-50 overflow-hidden"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                {/* User info */}
                <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg,#203eec,#00d4ff)' }}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{user?.name ?? 'Kullanıcı'}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{user?.email ?? ''}</p>
                    </div>
                  </div>
                </div>

                <Link
                  href="/dashboard/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground transition-colors"
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--border)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  Ayarlar
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors"
                  style={{ color: '#ef4444' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#ef444415'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <LogOut className="w-4 h-4" />
                  Çıkış Yap
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
