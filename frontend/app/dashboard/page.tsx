'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, FileText, Zap, Clock, AlertCircle, ArrowRight, CreditCard, Wallet } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import { getPosts, getCurrentUsage, getEntitlement, type Entitlement, type Post } from '@/lib/api';

const formatTokens = (value: number) => (Number(value) || 0).toLocaleString('tr-TR');

/** Compact form for the big number on a tile — "1,5M", "500K". */
const compactTokens = (value: number) => {
  const n = Number(value) || 0;
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString('tr-TR', { maximumFractionDigits: 1 })}M`;
  if (n >= 1_000) return `${(n / 1_000).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}K`;
  return n.toLocaleString('tr-TR');
};

const statusLabel: Record<string, string> = {
  queued: 'Kuyruğa Eklendi', generating: 'Üretiliyor', generated: 'Hazır',
  failed: 'Başarısız', draft: 'Taslak', published: 'Yayında',
  review: 'İncelemede', scheduled: 'Zamanlanmış', archived: 'Arşivlendi',
};

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'destructive' | 'info' | 'outline';

const statusVariant: Record<string, BadgeVariant> = {
  queued: 'warning',
  generating: 'info',
  generated: 'success',
  published: 'success',
  failed: 'destructive',
  draft: 'outline',
  review: 'warning',
  scheduled: 'info',
  archived: 'outline',
};

function formatRelativeTime(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)  return 'Az önce';
  if (mins < 60) return `${mins}dk önce`;
  if (hours < 24) return `${hours}sa önce`;
  if (days < 7)  return `${days}g önce`;
  return new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });
}

const card = {
  hidden:  { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.35, delay: i * 0.06, ease: [0.25, 0.46, 0.45, 0.94] as const } }),
};

export default function DashboardPage() {
  const [posts,     setPosts]     = useState<Post[]>([]);
  const [usage,     setUsage]     = useState<any>(null);
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [postsData, usageData, entitlementData] = await Promise.all([
        getPosts(),
        getCurrentUsage().catch(() => null),
        getEntitlement().catch(() => null),
      ]);
      setPosts(postsData);
      setUsage(usageData);
      setEntitlement(entitlementData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Veriler yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const totalPosts     = posts.length;
  const thisMonthPosts = posts.filter((p) => {
    const d = new Date(p.createdAt), n = new Date();
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  }).length;
  const recentPosts = posts.slice(0, 5);
  const latestPost  = posts[0];
  const totalTokens = usage ? Number(usage.tokensIn || 0) + Number(usage.tokensOut || 0) : 0;

  // The entitlement is the authority on quota; the raw ledger is the fallback.
  const allowance   = entitlement?.tokenAllowance ?? 0;
  const tokensUsed  = entitlement?.tokensUsedThisMonth ?? totalTokens;
  const quotaPct    = allowance > 0 ? Math.min(100, (tokensUsed / allowance) * 100) : undefined;

  const stats: Array<{
    label: string;
    value: string;
    sub: string;
    icon: typeof FileText;
    progress?: number;
  }> = [
    {
      label: 'Toplam Blog',
      value: totalPosts.toString(),
      sub: `${thisMonthPosts} bu ay`,
      icon: FileText,
    },
    {
      label: 'Bu Ay Üretilen',
      value: thisMonthPosts.toString(),
      sub: 'Aylık üretim',
      icon: Sparkles,
    },
    {
      label: 'Token Kullanımı',
      value: compactTokens(tokensUsed),
      sub: allowance > 0
        ? `${formatTokens(allowance)} tokenin %${Math.round(quotaPct ?? 0)} kadarı kullanıldı`
        : usage
          ? `${formatTokens(Number(usage.tokensIn || 0))} in / ${formatTokens(Number(usage.tokensOut || 0))} out`
          : 'Henüz kullanım yok',
      icon: Zap,
      progress: quotaPct,
    },
    {
      label: 'Son Blog',
      value: latestPost ? formatRelativeTime(latestPost.createdAt) : '—',
      sub: latestPost ? latestPost.title.substring(0, 28) + '…' : 'Blog üretmeye başlayın',
      icon: Clock,
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-9 rounded-lg" />
              </div>
              <Skeleton className="mb-2 h-7 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border p-5">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="divide-y divide-border">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-4">
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-border bg-destructive-muted p-5 text-sm text-destructive">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="mb-1 font-semibold">Veri yüklenemedi</p>
          <p>{error}</p>
          <button onClick={loadData} className="mt-2 text-xs font-semibold underline">Tekrar Dene</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Blog içeriklerinizi üretin, yönetin ve yayınlayın."
        actions={
          <Button asChild>
            <Link href="/dashboard/generate">
              <Sparkles />
              Yeni Blog Üret
            </Link>
          </Button>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} custom={i} initial="hidden" animate="visible" variants={card}>
              <StatCard label={s.label} value={s.value} hint={s.sub} icon={<Icon />} progress={s.progress} />
            </motion.div>
          );
        })}
      </div>

      {/* Quota summary */}
      {entitlement && (
        <Card variant={entitlement.isExpired ? 'default' : 'emphasis'} className="p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-eyebrow">Plan &amp; kota</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-semibold text-foreground-strong">{entitlement.planName}</h2>
                {entitlement.isExpired ? (
                  <Badge variant="destructive">
                    <AlertCircle className="h-3 w-3" />
                    Süresi doldu
                  </Badge>
                ) : entitlement.isTrial && entitlement.trialDaysRemaining != null ? (
                  <Badge variant="warning">
                    <Clock className="h-3 w-3" />
                    Deneme sürümü — {entitlement.trialDaysRemaining} gün kaldı
                  </Badge>
                ) : (
                  <Badge variant="success">Aktif</Badge>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Kalan {formatTokens(entitlement.totalTokensRemaining)} token · ≈{' '}
                {formatTokens(entitlement.estimatedArticlesRemaining)} blog daha üretebilirsiniz.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href="/dashboard/billing">
                  <Wallet />
                  Token satın al
                </Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard/plans">
                  <CreditCard />
                  {entitlement.isExpired ? 'Plan seçin' : 'Planı yükselt'}
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="shadow-card">
        <CardHeader className="p-5 pb-0">
          <CardTitle className="text-base">Hızlı İşlemler</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/dashboard/generate">
                <Sparkles />
                Yeni Blog Üret
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/blogs">
                <FileText />
                Bloglarımı Görüntüle
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Blogs */}
      <Card className="overflow-hidden shadow-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold tracking-tight text-foreground">Son Bloglarım</h2>
          <Link
            href="/dashboard/blogs"
            className="inline-flex items-center gap-1 text-xs font-semibold text-accent-foreground transition-colors hover:underline"
          >
            Tümünü Gör
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentPosts.length === 0 ? (
          <EmptyState
            className="rounded-none border-0"
            icon={<FileText />}
            title="Henüz blog oluşturulmamış"
            description="İlk blogunu oluşturmak için aşağıya tıkla"
            action={
              <Button asChild>
                <Link href="/dashboard/generate">
                  <Sparkles />
                  Yeni Blog Üret
                </Link>
              </Button>
            }
          />
        ) : (
          <div className="divide-y divide-border">
            {recentPosts.map((post) => (
              <Link
                key={post.id}
                href={`/dashboard/blogs/${post.id}`}
                className="group flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-secondary"
              >
                <div className="mr-4 min-w-0 flex-1">
                  <p className="mb-1 truncate text-sm font-medium text-foreground transition-colors group-hover:text-accent-foreground">
                    {post.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(post.createdAt)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge variant={statusVariant[post.status] ?? 'outline'}>
                    {statusLabel[post.status] ?? post.status}
                  </Badge>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
