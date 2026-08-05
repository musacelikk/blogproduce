'use client';

import { useState, useEffect } from 'react';
import {
  AlertCircle,
  DollarSign,
  FileText,
  Loader2,
  Users,
  Zap,
} from 'lucide-react';
import { getAdminUsageStats, getAllUsage, type UsageStats, type UsageLedger } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const SELECT_CLASS =
  'h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

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
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  const totalTokens = stats ? stats.totalTokensIn + stats.totalTokensOut : 0;
  const inputShare = totalTokens > 0 ? (stats!.totalTokensIn / totalTokens) * 100 : 0;

  return (
    <div className="space-y-6">
      <PageHeader
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
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-[var(--destructive-muted)] p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Hata</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      {stats && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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
          <Card className="shadow-card">
            <CardHeader className="p-6 pb-0">
              <CardTitle className="text-base font-semibold">Token Kullanım Detayları</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Input Tokens</p>
                  <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
                    {stats.totalTokensIn.toLocaleString('tr-TR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Output Tokens</p>
                  <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
                    {stats.totalTokensOut.toLocaleString('tr-TR')}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div className="h-full bg-primary" style={{ width: `${inputShare}%` }} />
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
          {stats.usageByUser && stats.usageByUser.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-base font-semibold text-foreground">
                Kullanıcı Bazında Kullanım
              </h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kullanıcı</TableHead>
                    <TableHead>Maliyet</TableHead>
                    <TableHead>Input Tokens</TableHead>
                    <TableHead>Output Tokens</TableHead>
                    <TableHead>İstek Sayısı</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.usageByUser.map((usage) => (
                    <TableRow key={usage.userId}>
                      <TableCell className="font-medium">{usage.userEmail}</TableCell>
                      <TableCell>${usage.cost.toFixed(2)}</TableCell>
                      <TableCell>{usage.tokensIn.toLocaleString('tr-TR')}</TableCell>
                      <TableCell>{usage.tokensOut.toLocaleString('tr-TR')}</TableCell>
                      <TableCell>{usage.requestCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
