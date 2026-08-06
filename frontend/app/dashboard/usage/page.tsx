'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Calendar,
  Folder,
  Gauge,
  Repeat,
  Sparkles,
  Wallet,
  Zap,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { StatsCardSkeleton, TableSkeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  getCurrentUsage,
  getEntitlement,
  getUsageHistory,
  getWorkspaceUsage,
  getWorkspaces,
  type Entitlement,
  type UsageLedger,
  type Workspace,
  type WorkspaceUsage,
} from '@/lib/api';

const MONTHS_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

const formatTokens = (value: number) => (Number(value) || 0).toLocaleString('tr-TR');

/** Compact form for the big number on a tile — "1,5M", "500K". */
const compactTokens = (value: number) => {
  const n = Number(value) || 0;
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString('tr-TR', { maximumFractionDigits: 1 })}M`;
  if (n >= 1_000) return `${(n / 1_000).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}K`;
  return n.toLocaleString('tr-TR');
};

export default function UsagePage() {
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [currentUsage, setCurrentUsage] = useState<UsageLedger | null>(null);
  const [usageHistory, setUsageHistory] = useState<UsageLedger[]>([]);
  const [workspaceUsage, setWorkspaceUsage] = useState<WorkspaceUsage[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsageData();
    loadWorkspaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  const loadUsageData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [current, history, workspaceUsageData, ent] = await Promise.all([
        getCurrentUsage().catch(() => null),
        getUsageHistory().catch(() => []),
        getWorkspaceUsage(selectedMonth || undefined).catch(() => []),
        getEntitlement().catch(() => null),
      ]);
      setCurrentUsage(current);
      setUsageHistory(Array.isArray(history) ? history : []);
      setWorkspaceUsage(Array.isArray(workspaceUsageData) ? workspaceUsageData : []);
      setEntitlement(ent);
    } catch (err) {
      console.error('Error loading usage data:', err);
      setError(err instanceof Error ? err.message : 'Kullanım verileri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const loadWorkspaces = async () => {
    try {
      const workspacesData = await getWorkspaces();
      setWorkspaces(Array.isArray(workspacesData) ? workspacesData : []);
    } catch (err) {
      console.error('Error loading workspaces:', err);
    }
  };

  // Get available months from history
  const availableMonths = usageHistory.map(u => u.month).filter((v, i, a) => a.indexOf(v) === i).sort().reverse();
  const currentMonth = currentUsage?.month || new Date().toISOString().slice(0, 7);

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-');
    return `${MONTHS_TR[parseInt(monthNum) - 1]} ${year}`;
  };

  const totalTokensIn = Number(currentUsage?.tokensIn) || 0;
  const totalTokensOut = Number(currentUsage?.tokensOut) || 0;
  const totalTokens = totalTokensIn + totalTokensOut;
  const totalRequests = Number(currentUsage?.requestCount) || 0;

  const allowance = entitlement?.tokenAllowance ?? 0;
  const used = entitlement?.tokensUsedThisMonth ?? totalTokens;
  const usedPct = allowance > 0 ? Math.min(100, (used / allowance) * 100) : used > 0 ? 100 : 0;
  const totalRemaining = entitlement?.totalTokensRemaining ?? 0;
  const articlesRemaining = entitlement?.estimatedArticlesRemaining ?? 0;

  const breakdown = [
    { label: 'Input token', value: totalTokensIn, icon: ArrowDownToLine },
    { label: 'Output token', value: totalTokensOut, icon: ArrowUpFromLine },
    { label: 'İstek sayısı', value: totalRequests, icon: Repeat },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kullanım"
        description="Aylık token kotanızı ve workspace bazlı tüketiminizi takip edin."
        actions={
          <div className="flex items-center gap-2">
            <select
              value={selectedMonth || currentMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground transition-colors duration-fast ease-out-quart hover:border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Bu Ay ({formatMonth(currentMonth)})</option>
              {availableMonths.map((month) => (
                <option key={month} value={month}>
                  {formatMonth(month)}
                </option>
              ))}
            </select>
            <Button asChild variant="outline">
              <Link href="/dashboard/billing">
                <Wallet />
                Token satın al
              </Link>
            </Button>
          </div>
        }
      />

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-border bg-destructive-muted p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Hata</p>
            <p>{error}</p>
            <Button variant="outline" size="sm" onClick={loadUsageData} className="mt-2">
              Tekrar Dene
            </Button>
          </div>
        </div>
      )}

      {/* Entitlement summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          [...Array(4)].map((_, i) => <StatsCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              label="Aylık token kotası"
              value={compactTokens(allowance)}
              icon={<Gauge />}
              progress={usedPct}
              hint={`${entitlement?.planName ?? 'Planınız'} · her ay yenilenir`}
            />
            <StatCard
              label="Bu ay kullanılan"
              value={compactTokens(used)}
              icon={<Zap />}
              hint={`Kotanızın %${Math.round(usedPct)} kadarı harcandı`}
            />
            <StatCard
              label="Kalan token"
              value={compactTokens(totalRemaining)}
              icon={<Wallet />}
              hint={`Plan kotası ${formatTokens(entitlement?.tokensRemainingInPlan ?? 0)} + ek bakiye ${formatTokens(entitlement?.tokenBalance ?? 0)}`}
            />
            <StatCard
              label="Kalan blog üretimi"
              value={`≈ ${formatTokens(articlesRemaining)}`}
              icon={<Sparkles />}
              hint={`≈ ${formatTokens(articlesRemaining)} blog daha üretebilirsiniz`}
            />
          </>
        )}
      </div>

      {/* This month's raw breakdown */}
      <Card className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground-strong">
              {formatMonth(selectedMonth || currentMonth)} dökümü
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Toplam {formatTokens(totalTokens)} token tüketildi.
            </p>
          </div>
          {entitlement && (
            <Badge variant={usedPct >= 90 ? 'destructive' : usedPct >= 75 ? 'warning' : 'success'}>
              Kota kullanımı %{Math.round(usedPct)}
            </Badge>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {breakdown.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-lg bg-surface-raised p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-medium">{item.label}</span>
                </div>
                <p className="mt-2 text-xl font-semibold tabular-nums text-foreground-strong">
                  {formatTokens(item.value)}
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Workspace-based Usage */}
      <Card className="overflow-hidden">
        <div className="border-b border-border p-6">
          <div className="flex items-center gap-3">
            <Folder className="h-5 w-5 text-accent-foreground" />
            <h2 className="text-lg font-semibold text-foreground-strong">
              Workspace Bazlı Kullanım
            </h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Her workspace için token kullanım detayları
          </p>
        </div>
        {loading ? (
          <TableSkeleton rows={5} />
        ) : workspaceUsage.length === 0 ? (
          <EmptyState
            className="rounded-none border-0"
            icon={<Folder />}
            title="Henüz token kullanımı yok"
            description="Blog ürettiğinizde workspace bazlı kullanım verileri burada görünecek"
          />
        ) : (
          <div className="divide-y divide-border">
            {workspaceUsage.map((usage) => {
              const workspace = workspaces.find(w => w.id === usage.workspaceId);
              const workspaceColor = workspace?.color || 'var(--primary)';
              const usageTotalTokens = Number(usage.totalTokens) || 0;
              const totalPercentage = totalTokens > 0 ? (usageTotalTokens / totalTokens) * 100 : 0;

              return (
                <div
                  key={usage.workspaceId}
                  className="p-6 transition-colors duration-base ease-out-quart hover:bg-surface-raised"
                >
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div className="flex flex-1 items-center gap-3">
                      <div
                        className="h-4 w-4 shrink-0 rounded-full"
                        style={{ backgroundColor: workspaceColor }}
                      />
                      <div className="flex-1">
                        <h3 className="mb-1 text-base font-medium text-foreground-strong">
                          {usage.workspaceName}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {formatTokens(Number(usage.requestCount) || 0)} istek
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-semibold tabular-nums text-foreground-strong">
                        {formatTokens(usageTotalTokens)}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Toplam kullanımın %{totalPercentage.toFixed(1)} kadarı
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-sunken">
                      <div
                        className="h-full rounded-full transition-[width] duration-slow ease-out-quart"
                        style={{
                          width: `${totalPercentage}%`,
                          backgroundColor: workspaceColor,
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="mb-1 text-xs text-muted-foreground">
                          Input token
                        </p>
                        <p className="text-base font-medium tabular-nums text-foreground">
                          {formatTokens(Number(usage.tokensIn) || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="mb-1 text-xs text-muted-foreground">
                          Output token
                        </p>
                        <p className="text-base font-medium tabular-nums text-foreground">
                          {formatTokens(Number(usage.tokensOut) || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Usage History */}
      {usageHistory.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-3">
            <Calendar className="h-5 w-5 text-accent-foreground" />
            <h2 className="text-lg font-semibold text-foreground-strong">Aylık Kullanım Geçmişi</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dönem</TableHead>
                <TableHead className="text-right">Input</TableHead>
                <TableHead className="text-right">Output</TableHead>
                <TableHead className="text-right">İstek</TableHead>
                <TableHead className="text-right">Toplam token</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usageHistory.slice(0, 12).map((usage) => {
                const usageTotal = (Number(usage.tokensIn) || 0) + (Number(usage.tokensOut) || 0);
                return (
                  <TableRow key={usage.id}>
                    <TableCell className="font-medium text-foreground-strong">
                      {formatMonth(usage.month)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatTokens(Number(usage.tokensIn) || 0)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatTokens(Number(usage.tokensOut) || 0)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatTokens(Number(usage.requestCount) || 0)}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatTokens(usageTotal)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </section>
      )}
    </div>
  );
}
