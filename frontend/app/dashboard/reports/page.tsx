'use client';

import { useState, useEffect, useMemo } from 'react';
import { BarChart3, TrendingUp, Eye, FileText, Calendar, Download, Zap, AlertCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { fieldClasses } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { getCurrentUsage, getUsageHistory, getPosts, type UsageLedger, type Post } from '@/lib/api';

const MONTHS_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<'7days' | '30days' | '90days' | 'all'>('30days');
  const [currentUsage, setCurrentUsage] = useState<UsageLedger | null>(null);
  const [usageHistory, setUsageHistory] = useState<UsageLedger[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingUsage, setIsLoadingUsage] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [usageError, setUsageError] = useState<string | null>(null);
  const [postsError, setPostsError] = useState<string | null>(null);

  // Token limiti (varsayılan - gerçek limit API'den alınabilir)
  const TOKEN_LIMIT = 100000; // Aylık limit

  useEffect(() => {
    loadUsageData();
    loadPostsData();
  }, []);

  const loadUsageData = async () => {
    try {
      setIsLoadingUsage(true);
      setUsageError(null);
      const [current, history] = await Promise.all([
        getCurrentUsage().catch(() => null),
        getUsageHistory().catch(() => []),
      ]);
      setCurrentUsage(current);
      setUsageHistory(Array.isArray(history) ? history : []);
    } catch (err) {
      setUsageError(err instanceof Error ? err.message : 'Kullanım verileri yüklenirken bir hata oluştu');
    } finally {
      setIsLoadingUsage(false);
    }
  };

  const loadPostsData = async () => {
    try {
      setIsLoadingPosts(true);
      setPostsError(null);
      const postsData = await getPosts();
      setPosts(Array.isArray(postsData) ? postsData : []);
    } catch (err) {
      setPostsError(err instanceof Error ? err.message : 'Blog verileri yüklenirken bir hata oluştu');
    } finally {
      setIsLoadingPosts(false);
    }
  };

  // Filtrelenmiş post'lar (seçilen periyoda göre)
  const filteredPosts = useMemo(() => {
    if (selectedPeriod === 'all') return posts;

    const now = new Date();
    const periodDays = selectedPeriod === '7days' ? 7 : selectedPeriod === '30days' ? 30 : 90;
    const cutoffDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    return posts.filter(post => {
      const postDate = new Date(post.createdAt);
      return postDate >= cutoffDate;
    });
  }, [posts, selectedPeriod]);

  // Aylık veriler
  const monthlyData = useMemo(() => {
    const monthlyMap = new Map<string, { blogs: number; generated: number }>();

    filteredPosts.forEach(post => {
      const date = new Date(post.createdAt);
      const monthName = MONTHS_TR[date.getMonth()];
      const year = date.getFullYear();
      const displayKey = `${monthName} ${year}`;

      if (!monthlyMap.has(displayKey)) {
        monthlyMap.set(displayKey, { blogs: 0, generated: 0 });
      }

      const data = monthlyMap.get(displayKey)!;
      data.generated += 1;
      if (post.status === 'published') {
        data.blogs += 1;
      }
    });

    // Map'i array'e çevir ve sırala
    const data = Array.from(monthlyMap.entries())
      .map(([month, values]) => ({
        month,
        blogs: values.blogs,
        generated: values.generated,
        views: 0, // Görüntülenme sayısı backend'de yok, şimdilik 0
      }))
      .sort((a, b) => {
        // Ay isimlerine göre sıralama (basit sıralama)
        const monthIndexA = MONTHS_TR.indexOf(a.month.split(' ')[0]);
        const monthIndexB = MONTHS_TR.indexOf(b.month.split(' ')[0]);
        return monthIndexB - monthIndexA;
      })
      .slice(0, 6); // Son 6 ay

    return data;
  }, [filteredPosts]);

  // En popüler bloglar (published olanlar, tarihe göre sıralı)
  const topBlogs = useMemo(() => {
    return filteredPosts
      .filter(post => post.status === 'published')
      .sort((a, b) => {
        const dateA = new Date(a.publishedAt || a.createdAt);
        const dateB = new Date(b.publishedAt || b.createdAt);
        return dateB.getTime() - dateA.getTime(); // En yeni önce
      })
      .slice(0, 5)
      .map((post) => ({
        id: post.id,
        title: post.title,
        views: 0, // Görüntülenme sayısı backend'de yok, şimdilik 0
        tags: post.tags?.map(tag => tag.name) || [],
      }));
  }, [filteredPosts]);

  // İstatistikler
  const stats = useMemo(() => {
    const publishedPosts = filteredPosts.filter(post => post.status === 'published');
    const totalBlogs = publishedPosts.length;
    const totalGenerated = filteredPosts.length;
    const totalViews = 0; // Görüntülenme sayısı backend'de yok
    const avgViews = totalBlogs > 0 ? Math.round(totalViews / totalBlogs) : 0;

    // Önceki periyod ile karşılaştırma (basit hesaplama)
    const previousPeriodDays = selectedPeriod === '7days' ? 7 : selectedPeriod === '30days' ? 30 : 90;
    const previousCutoff = new Date(new Date().getTime() - previousPeriodDays * 2 * 24 * 60 * 60 * 1000);
    const previousPosts = posts.filter(post => {
      const postDate = new Date(post.createdAt);
      return postDate >= previousCutoff && postDate < new Date(new Date().getTime() - previousPeriodDays * 24 * 60 * 60 * 1000);
    });
    const previousPublished = previousPosts.filter(post => post.status === 'published').length;
    const previousGenerated = previousPosts.length;

    const blogsGrowth = previousPublished > 0
      ? Math.round(((totalBlogs - previousPublished) / previousPublished) * 100)
      : totalBlogs > 0 ? 100 : 0;
    const generatedGrowth = previousGenerated > 0
      ? Math.round(((totalGenerated - previousGenerated) / previousGenerated) * 100)
      : totalGenerated > 0 ? 100 : 0;

    return {
      totalBlogs,
      totalViews,
      avgViews,
      totalGenerated,
      blogsGrowth,
      generatedGrowth,
      viewsGrowth: 0, // Görüntülenme sayısı yok
    };
  }, [filteredPosts, posts, selectedPeriod]);

  const totalTokensUsed = currentUsage
    ? (currentUsage.tokensIn || 0) + (currentUsage.tokensOut || 0)
    : 0;
  const totalTokensIn = currentUsage?.tokensIn || 0;
  const totalTokensOut = currentUsage?.tokensOut || 0;
  const tokenUsagePercent = TOKEN_LIMIT > 0 ? Math.min((totalTokensUsed / TOKEN_LIMIT) * 100, 100) : 0;
  const tokenBarClass = tokenUsagePercent > 80 ? 'bg-destructive' : tokenUsagePercent > 50 ? 'bg-warning' : 'bg-success';
  const tokenTextClass = tokenUsagePercent > 80 ? 'text-destructive' : tokenUsagePercent > 50 ? 'text-warning' : 'text-success';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Analiz"
        title="Raporlar"
        description="Blog ve token kullanım analizlerinizi görüntüleyin"
        actions={
          <>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as typeof selectedPeriod)}
              aria-label="Rapor dönemi"
              className={cn(fieldClasses, 'block h-10 w-auto')}
            >
              <option value="7days">Son 7 Gün</option>
              <option value="30days">Son 30 Gün</option>
              <option value="90days">Son 90 Gün</option>
              <option value="all">Tüm Zamanlar</option>
            </select>
            <Button variant="outline" size="sm">
              <Download />
              Export
            </Button>
          </>
        }
      />

      {/* Error Messages */}
      {(postsError || usageError) && (
        <div className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-[var(--destructive-muted)] p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Rapor verileri eksik yüklendi</p>
            {postsError && <p className="mt-0.5">{postsError}</p>}
            {usageError && <p className="mt-0.5">{usageError}</p>}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Toplam Blog"
          value={isLoadingPosts ? <Skeleton className="h-7 w-20" /> : stats.totalBlogs}
          icon={<FileText />}
          trend={stats.blogsGrowth !== 0 ? { value: `${stats.blogsGrowth > 0 ? '+' : ''}${stats.blogsGrowth}% ${stats.blogsGrowth > 0 ? 'artış' : 'azalış'}`, positive: stats.blogsGrowth > 0 } : undefined}
        />
        <StatCard
          label="Toplam Görüntülenme"
          value={isLoadingPosts ? <Skeleton className="h-7 w-20" /> : stats.totalViews.toLocaleString()}
          icon={<Eye />}
          hint="Görüntülenme takibi yakında"
        />
        <StatCard
          label="Ortalama Görüntülenme"
          value={isLoadingPosts ? <Skeleton className="h-7 w-20" /> : stats.avgViews}
          icon={<TrendingUp />}
          hint="Görüntülenme takibi yakında"
        />
        <StatCard
          label="Üretilen Blog"
          value={isLoadingPosts ? <Skeleton className="h-7 w-20" /> : stats.totalGenerated}
          icon={<BarChart3 />}
          trend={stats.generatedGrowth !== 0 ? { value: `${stats.generatedGrowth > 0 ? '+' : ''}${stats.generatedGrowth}% ${stats.generatedGrowth > 0 ? 'artış' : 'azalış'}`, positive: stats.generatedGrowth > 0 } : undefined}
        />
      </div>

      {/* Token Usage Section */}
      <Card className="p-5">
        <div className="mb-5">
          <p className="text-eyebrow mb-1.5">Kullanım</p>
          <h2 className="text-base font-semibold text-foreground-strong">
            Token Kullanımı ve Limitler
          </h2>
        </div>
        {isLoadingUsage ? (
          /* Skeleton mirrors the meter + three token tiles below it. */
          <div className="space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-3 w-full rounded-full" />
              <Skeleton className="mt-2 h-3 w-24" />
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-[86px] rounded-lg" />
              ))}
            </div>
          </div>
        ) : usageError ? (
          <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-[var(--destructive-muted)] p-4 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">Kullanım verileri yüklenemedi</p>
              <p className="mt-0.5">{usageError}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Token Usage Progress */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-warning" />
                  <span className="text-sm font-medium text-foreground">
                    Aylık Token Kullanımı
                  </span>
                </div>
                <span className={`text-sm font-semibold tabular-nums ${tokenTextClass}`}>
                  {totalTokensUsed.toLocaleString('tr-TR')} / {TOKEN_LIMIT.toLocaleString('tr-TR')}
                </span>
              </div>
              <div
                className="h-3 w-full overflow-hidden rounded-full bg-surface-sunken"
                role="progressbar"
                aria-valuenow={Math.round(tokenUsagePercent)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Aylık token kullanımı"
              >
                <div
                  className={`h-full rounded-full transition-[width] duration-slow ease-out-quart ${tokenBarClass}`}
                  style={{ width: `${tokenUsagePercent}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                <span className="tabular-nums">{tokenUsagePercent.toFixed(1)}%</span> kullanıldı
              </p>
            </div>

            {/* Token Stats Grid */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-border bg-info-muted p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-info">
                    Input Tokens
                  </span>
                  <Zap className="h-4 w-4 text-info" />
                </div>
                <p className="text-2xl font-semibold tracking-tight text-info tabular-nums">
                  {totalTokensIn.toLocaleString('tr-TR')}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-success-muted p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-success">
                    Output Tokens
                  </span>
                  <Zap className="h-4 w-4 text-success" />
                </div>
                <p className="text-2xl font-semibold tracking-tight text-success tabular-nums">
                  {totalTokensOut.toLocaleString('tr-TR')}
                </p>
              </div>
              <div className="rounded-lg bg-accent p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-accent-foreground">
                    Toplam
                  </span>
                  <Zap className="h-4 w-4 text-accent-foreground" />
                </div>
                <p className="text-2xl font-semibold tracking-tight text-accent-foreground tabular-nums">
                  {totalTokensUsed.toLocaleString('tr-TR')}
                </p>
              </div>
            </div>

            {/* Usage History */}
            {usageHistory.length > 0 && (
              <div className="mt-5 border-t border-border pt-5">
                <h3 className="mb-3 text-sm font-semibold text-foreground-strong">
                  Geçmiş Kullanım
                </h3>
                <div className="space-y-2">
                  {usageHistory.slice(0, 5).map((usage) => {
                    const usageTotal = (usage.tokensIn || 0) + (usage.tokensOut || 0);
                    return (
                      <div
                        key={usage.id}
                        className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface-raised p-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground-strong">
                            {usage.month}
                          </p>
                          <p className="text-xs text-muted-foreground tabular-nums">
                            {(usage.tokensIn || 0).toLocaleString('tr-TR')} in /{' '}
                            {(usage.tokensOut || 0).toLocaleString('tr-TR')} out
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold text-foreground-strong tabular-nums">
                          {usageTotal.toLocaleString('tr-TR')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Chart */}
      {monthlyData.length > 0 && (
        <Card className="p-5">
          <div className="mb-5">
            <p className="text-eyebrow mb-1.5">Trend</p>
            <h2 className="text-base font-semibold text-foreground-strong">
              Aylık Blog Üretim Trendi
            </h2>
          </div>
          {isLoadingPosts ? (
            /* Skeleton mirrors the bar chart: six columns of varying height plus labels. */
            <div className="flex h-64 items-end justify-between gap-3">
              {[70, 45, 90, 60, 35, 80].map((h, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <Skeleton className="w-full rounded-t-lg" style={{ height: `${h}%` }} />
                  <Skeleton className="h-2.5 w-10" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-64 items-end justify-between gap-3">
              {monthlyData.map((data) => (
                <div key={data.month} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-full w-full flex-col justify-end rounded-t-lg bg-surface-sunken">
                    <div
                      className="w-full rounded-t-lg bg-primary transition-[height,opacity] duration-slow ease-out-quart hover:opacity-80"
                      style={{
                        height: `${Math.max((data.generated / Math.max(...monthlyData.map(d => d.generated), 1)) * 100, 5)}%`,
                        minHeight: '8px',
                      }}
                      title={`${data.generated} üretim`}
                    />
                  </div>
                  <span className="text-center text-[11px] text-muted-foreground">
                    {data.month.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Top Blogs */}
      {topBlogs.length > 0 && (
        <div className="space-y-3">
          <div>
            <p className="text-eyebrow mb-1.5">İçerik</p>
            <h2 className="text-base font-semibold text-foreground-strong">
              Son Yayınlanan Bloglar
            </h2>
          </div>
          {isLoadingPosts ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-right">#</TableHead>
                  <TableHead>Başlık</TableHead>
                  <TableHead>Etiketler</TableHead>
                  <TableHead className="text-right">Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topBlogs.map((blog, index) => (
                  <TableRow key={blog.id}>
                    <TableCell className="text-right text-sm font-semibold text-muted-foreground tabular-nums">
                      {index + 1}
                    </TableCell>
                    <TableCell className="max-w-[380px]">
                      <span className="line-clamp-1 font-medium text-foreground-strong">
                        {blog.title}
                      </span>
                    </TableCell>
                    <TableCell>
                      {blog.tags.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {blog.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="success">
                        <Calendar className="h-3 w-3" />
                        Yayınlandı
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {!isLoadingPosts && posts.length === 0 && (
        <EmptyState
          icon={<FileText />}
          title="Henüz blog içeriği yok"
          description="İlk blogunuzu ürettiğinizde üretim trendi, token tüketimi ve yayın performansı bu sayfada raporlanır."
          action={
            <Button asChild size="lg">
              <Link href="/dashboard/generate">
                <Sparkles />
                İlk Blogunu Üret
              </Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
