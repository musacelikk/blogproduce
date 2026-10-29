'use client';

import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Bell, LogOut, Settings, ChevronDown, Check, Zap, Menu, X, Clock, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSidebar } from '@/contexts/SidebarContext';
import { logout, getNotifications, getUnreadNotificationCount, markNotificationAsRead, markAllNotificationsAsRead, getCurrentPlan, getCurrentUsage, getEntitlement, type Notification } from '@/lib/api';
import type { UserPlanInfo, UsageLedger, Entitlement } from '@/lib/api';
import { auth } from '@/lib/auth';

const pageMetadata: Record<string, { title: string; description: string }> = {
  '/dashboard':            { title: 'Hoş Geldiniz',             description: 'AI destekli blog üretimine devam edin' },
  '/dashboard/generate':   { title: 'Yeni Blog Üret',           description: "Prompt'a göre özel, SEO uyumlu içerik üretin" },
  '/dashboard/usage':      { title: 'Token Kullanımı',          description: 'Workspace bazlı kullanımınızı takip edin' },
  '/dashboard/blogs':      { title: 'Bloglarım',                description: 'Tüm içeriklerinizi yönetin' },
  '/dashboard/workspaces': { title: "Workspace'lerim",          description: 'İçeriklerinizi organize edin' },
  '/dashboard/plans':      { title: 'Planlar & Fiyatlandırma',  description: 'İhtiyacınıza uygun planı seçin' },
  '/dashboard/billing':    { title: 'Faturalandırma',           description: 'Plan, token kotası ve satın alımlarınız' },
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
  const [entitlement, setEntitlement]           = useState<Entitlement | null>(null);
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
        const [plan, usageData, ent] = await Promise.all([
          getCurrentPlan().catch(() => null),
          getCurrentUsage().catch(() => null),
          getEntitlement().catch(() => null),
        ]);
        setPlanInfo(plan ?? null);
        setUsage(usageData ?? null);
        setEntitlement(ent ?? null);
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

  // The entitlement is the authority on quota; the raw ledger is only a fallback
  // while it loads or if the endpoint is unreachable.
  const total    = entitlement
    ? entitlement.tokensUsedThisMonth
    : usage ? Number(usage.tokensIn) + Number(usage.tokensOut) : 0;
  const maxNum   = entitlement
    ? entitlement.tokenAllowance
    : typeof planInfo?.currentPlan?.features?.maxTokensPerMonth === 'number'
      ? planInfo.currentPlan.features.maxTokensPerMonth : null;
  const showToken = total > 0 || (maxNum != null && maxNum > 0);
  const quotaPct = maxNum != null && maxNum > 0 ? Math.min(100, (total / maxNum) * 100) : 0;

  const trialDays    = entitlement?.trialDaysRemaining ?? null;
  const isExpired    = Boolean(entitlement?.isExpired);
  const showTrialPill = Boolean(entitlement && (isExpired || (entitlement.isTrial && trialDays != null)));
  const trialUrgent  = trialDays != null && trialDays <= 2;

  return (
    <header className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-card px-4 sm:px-5">
      {/* Left: Hamburger (mobile) + Logo + Page title */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {/* Mobile hamburger */}
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="shrink-0 rounded-lg p-2 text-foreground transition-colors hover:bg-secondary lg:hidden"
          aria-label="Menüyü aç/kapat"
        >
          {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <Link href="/dashboard" className="flex h-full shrink-0 items-center">
          <Image src="/images/logo.png" alt="BlogProduce" width={120} height={32} className="h-8 w-auto object-contain" priority />
        </Link>

        {currentMeta && (
          <div className="ml-6 hidden min-w-0 items-center gap-2 border-l border-border pl-6 lg:flex">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-tight text-foreground">{currentMeta.title}</p>
              <p className="truncate text-[11px] leading-tight text-muted-foreground">{currentMeta.description}</p>
            </div>
          </div>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        {/* Trial / expired pill — visible on every dashboard screen */}
        {showTrialPill && (
          <Link
            href="/dashboard/plans"
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors duration-fast ease-out-quart ${
              isExpired
                ? 'bg-destructive-muted text-destructive hover:bg-destructive/15'
                : trialUrgent
                  ? 'bg-warning-muted text-warning hover:bg-warning/15'
                  : 'bg-accent text-accent-foreground hover:bg-secondary'
            }`}
            title={isExpired ? 'Aboneliğiniz sona erdi' : 'Deneme sürümü'}
          >
            {isExpired ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
            <span className="hidden sm:inline">
              {isExpired ? 'Aboneliğiniz sona erdi — plan seçin' : `Deneme sürümü — ${trialDays} gün kaldı`}
            </span>
            <span className="sm:hidden">{isExpired ? 'Plan seçin' : `${trialDays} gün`}</span>
          </Link>
        )}

        {/* Plan badge */}
        {!showTrialPill && (
          <Link
            href="/dashboard/plans"
            className="hidden items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground transition-colors duration-fast ease-out-quart hover:bg-secondary sm:inline-flex"
          >
            {entitlement?.planName ?? planInfo?.currentPlan?.name ?? (planInfo?.isFree ? 'Ücretsiz' : '—')}
            <span className="text-[10px] font-normal opacity-70">
              · {planInfo?.subscription?.daysRemaining != null && planInfo.subscription.daysRemaining >= 0
                ? `${planInfo.subscription.daysRemaining}g`
                : '∞'}
            </span>
          </Link>
        )}

        {/* Token badge */}
        {showToken && (
          <Link
            href="/dashboard/usage"
            className={`hidden items-center gap-1 rounded-full border bg-card px-2.5 py-1 text-[11px] font-medium transition-colors duration-fast ease-out-quart hover:bg-secondary md:inline-flex ${
              quotaPct >= 90
                ? 'border-destructive/30 text-destructive'
                : quotaPct >= 75
                  ? 'border-warning/30 text-warning'
                  : 'border-border text-muted-foreground'
            }`}
            title="Token kullanımı"
          >
            <Zap className={`h-3 w-3 ${quotaPct >= 75 ? '' : 'text-accent-foreground'}`} />
            {total >= 1000 ? `${(total / 1000).toFixed(1)}K` : total}
            {maxNum != null && maxNum > 0 ? ` / ${maxNum >= 1000 ? `${(maxNum / 1000).toFixed(0)}K` : maxNum}` : ''} token
          </Link>
        )}

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={handleToggleNotifications}
            className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Bildirimler"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-semibold text-primary-foreground">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
              <div className="absolute right-0 top-full z-50 mt-2 w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-card shadow-elevated sm:w-80">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Bildirimler</p>
                    <p className="text-[10px] text-muted-foreground">
                      {unreadCount > 0 ? `${unreadCount} okunmamış` : 'Tümü okundu'}
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-accent-foreground transition-colors hover:bg-accent"
                    >
                      <Check className="h-3 w-3" /> Tümünü oku
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
                        className={`w-full border-b border-border px-4 py-3 text-left transition-colors hover:bg-secondary ${
                          !n.isRead ? 'bg-accent' : 'bg-card'
                        }`}
                      >
                        <p className={`mb-0.5 text-xs font-medium ${!n.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {n.title}
                        </p>
                        {n.message && <p className="line-clamp-2 text-[11px] text-muted-foreground">{n.message}</p>}
                        <p className="mt-1 text-[10px] text-muted-foreground">
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
            className="flex items-center gap-2 rounded-lg border border-border bg-card py-1 pl-2 pr-1 transition-colors hover:bg-secondary"
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary text-[11px] font-bold text-primary-foreground">
              {initials}
            </div>
            <div className="hidden pr-1 text-left sm:block">
              <p className="text-[11px] font-semibold leading-tight text-foreground">{user?.name ?? 'Kullanıcı'}</p>
              <p className="max-w-[100px] truncate text-[10px] leading-tight text-muted-foreground">{user?.email ?? ''}</p>
            </div>
            <ChevronDown className={`hidden h-3.5 w-3.5 text-muted-foreground transition-transform sm:block ${isProfileOpen ? 'rotate-180' : ''}`} />
          </button>

          {isProfileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
              <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-card shadow-elevated">
                {/* User info */}
                <div className="border-b border-border px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{user?.name ?? 'Kullanıcı'}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{user?.email ?? ''}</p>
                    </div>
                  </div>
                </div>

                <Link
                  href="/dashboard/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-secondary"
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  Ayarlar
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive-muted"
                >
                  <LogOut className="h-4 w-4" />
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
