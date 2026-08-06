'use client';

import { useState, useEffect } from 'react';
import {
  AlertCircle,
  DollarSign,
  FileText,
  Users,
  Zap,
} from 'lucide-react';
import { getAdminUsageStats, getAllUsage, type UsageStats, type UsageLedger } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
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

const SELECT_CLASS = cn(fieldClasses, 'block h-10 w-auto');

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [usageHistory, setUsageHistory] = useState<UsageLedger[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  useEffect(() => {
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsData, historyData] = await Promise.all([
        getAdminUsageStats(selectedMonth || undefined),
        getAllUsage(selectedMonth || undefined),
      ]);

      setStats(statsData);
      setUsageHistory(historyData);
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError(err instanceof Error ? err.message : 'İstatistikler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Generate month options (last 12 months)
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: date.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' }),
    };
  });

  if (loading) {
    return (
      /* Skeleton mirrors the page: header, four stat tiles, token breakdown, usage table. */
      <div className="space-y-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-10 w-40 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[102px] rounded-xl" />
          ))}
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <Skeleton className="mb-6 h-5 w-56" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-36" />
              </div>
            ))}
          </div>
          <Skeleton className="mt-6 h-2 w-full rounded-full" />
        </div>
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <div className="h-12 border-b border-border bg-surface-raised" />
          <div className="divide-y divide-border">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3.5">
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-14" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalTokens = stats ? stats.totalTokensIn + stats.totalTokensOut : 0;
  const inputShare = totalTokens > 0 ? (stats!.totalTokensIn / totalTokens) * 100 : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Analitik"
        title="İstatistikler ve Analitik"
        description="Sistem kullanım istatistikleri ve analitik veriler"
        actions={
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            aria-label="Dönem seçin"
            className={SELECT_CLASS}
          >
            <option value="">Tüm Zamanlar</option>
            {monthOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        }
      />

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-[var(--destructive-muted)] p-4 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">İstatistikler yüklenemedi</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {stats && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Toplam Maliyet"
              value={`$${stats.totalCost.toFixed(2)}`}
              icon={<DollarSign />}
            />
            <StatCard
              label="Toplam Token"
              value={totalTokens.toLocaleString('tr-TR')}
              icon={<Zap />}
            />
            <StatCard
              label="Toplam İstek"
              value={stats.totalRequests.toLocaleString('tr-TR')}
              icon={<FileText />}
            />
            <StatCard label="Aktif Kullanıcı" value={stats.activeUsers} icon={<Users />} />
          </div>

          {/* Token Breakdown */}
          <Card>
            <CardHeader className="p-6 pb-0">
              <CardTitle>Token Kullanım Detayları</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Input Tokens</p>
                  <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground-strong tabular-nums">
                    {stats.totalTokensIn.toLocaleString('tr-TR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Output Tokens</p>
                  <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground-strong tabular-nums">
                    {stats.totalTokensOut.toLocaleString('tr-TR')}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex h-2 w-full overflow-hidden rounded-full bg-surface-sunken">
                <div
                  className="h-full bg-primary transition-[width] duration-slow ease-out-quart"
                  style={{ width: `${inputShare}%` }}
                />
                <div className="h-full flex-1 bg-info" />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  Input
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-info" />
                  Output
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Usage by User */}
          <div className="space-y-3">
            <div>
              <p className="text-eyebrow mb-1.5">Dağılım</p>
              <h2 className="text-base font-semibold text-foreground-strong">
                Kullanıcı Bazında Kullanım
              </h2>
            </div>
            {stats.usageByUser && stats.usageByUser.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kullanıcı</TableHead>
                    <TableHead className="text-right">Maliyet</TableHead>
                    <TableHead className="text-right">Input Tokens</TableHead>
                    <TableHead className="text-right">Output Tokens</TableHead>
                    <TableHead className="text-right">İstek Sayısı</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.usageByUser.map((usage) => (
                    <TableRow key={usage.userId}>
                      <TableCell className="font-medium text-foreground-strong">
                        {usage.userEmail}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        ${usage.cost.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground tabular-nums">
                        {usage.tokensIn.toLocaleString('tr-TR')}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground tabular-nums">
                        {usage.tokensOut.toLocaleString('tr-TR')}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground tabular-nums">
                        {usage.requestCount.toLocaleString('tr-TR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState
                icon={<Users />}
                title="Bu dönemde kullanım yok"
                description="Seçtiğiniz dönemde hiçbir kullanıcı token harcamadı. Farklı bir dönem seçerek geçmiş kullanımı inceleyebilirsiniz."
              />
            )}
          </div>

          {usageHistory.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Bu dönem için{' '}
              <span className="tabular-nums">{usageHistory.length.toLocaleString('tr-TR')}</span>{' '}
              kullanım kaydı bulundu.
            </p>
          )}
        </>
      )}
    </div>
  );
}
