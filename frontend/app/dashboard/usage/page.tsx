'use client';

import { useState, useEffect } from 'react';
import { Zap, AlertCircle, Folder, Filter, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { UsageCardSkeleton, TableSkeleton } from '@/components/ui/skeleton';
import { getCurrentUsage, getUsageHistory, getWorkspaceUsage, getWorkspaces, type UsageLedger, type WorkspaceUsage, type Workspace } from '@/lib/api';

const MONTHS_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

export default function UsagePage() {
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [currentUsage, setCurrentUsage] = useState<UsageLedger | null>(null);
  const [usageHistory, setUsageHistory] = useState<UsageLedger[]>([]);
  const [workspaceUsage, setWorkspaceUsage] = useState<WorkspaceUsage[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
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
      const [current, history, workspaceUsageData] = await Promise.all([
        getCurrentUsage().catch(() => null),
        getUsageHistory().catch(() => []),
        getWorkspaceUsage(selectedMonth || undefined).catch(() => []),
      ]);
      setCurrentUsage(current);
      setUsageHistory(Array.isArray(history) ? history : []);
      setWorkspaceUsage(Array.isArray(workspaceUsageData) ? workspaceUsageData : []);
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

  const formatTokens = (tokens: number) => {
    return tokens.toLocaleString('tr-TR');
  };

  const totalTokensIn = Number(currentUsage?.tokensIn) || 0;
  const totalTokensOut = Number(currentUsage?.tokensOut) || 0;
  const totalTokens = totalTokensIn + totalTokensOut;
  const totalRequests = Number(currentUsage?.requestCount) || 0;

  const overallStats = [
    { label: 'Toplam Token', value: formatTokens(totalTokens), icon: Zap },
    { label: 'Input Token', value: formatTokens(totalTokensIn), icon: TrendingUp },
    { label: 'Output Token', value: formatTokens(totalTokensOut), icon: Zap },
    { label: 'İstek Sayısı', value: totalRequests.toLocaleString('tr-TR'), icon: Filter },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kullanım"
        description="Token ve API kullanım istatistiklerinizi görüntüleyin"
        actions={
          <select
            value={selectedMonth || currentMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">Bu Ay ({formatMonth(currentMonth)})</option>
            {availableMonths.map((month) => (
              <option key={month} value={month}>
                {formatMonth(month)}
              </option>
            ))}
          </select>
        }
      />

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-border bg-[var(--destructive-muted)] p-4 text-sm text-destructive">
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

      {/* Overall Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {loading
          ? [...Array(4)].map((_, i) => <UsageCardSkeleton key={i} />)
          : overallStats.map((stat) => (
              <StatCard key={stat.label} label={stat.label} value={stat.value} icon={<stat.icon />} />
            ))}
      </div>

      {/* Workspace-based Usage */}
      <Card className="overflow-hidden shadow-card">
        <div className="border-b border-border p-6">
          <div className="flex items-center gap-3">
            <Folder className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
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
                  className="p-6 transition-colors hover:bg-secondary"
                >
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div className="flex flex-1 items-center gap-3">
                      {workspaceColor && (
                        <div
                          className="h-4 w-4 shrink-0 rounded-full"
                          style={{ backgroundColor: workspaceColor }}
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="mb-1 text-base font-medium text-foreground">
                          {usage.workspaceName}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {usage.requestCount} istek
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-semibold text-foreground">
                        {formatTokens(Number(usage.totalTokens) || 0)}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {totalPercentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${totalPercentage}%`,
                          backgroundColor: workspaceColor,
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="mb-1 text-xs text-muted-foreground">
                          Input Token
                        </p>
                        <p className="text-base font-medium text-info">
                          {formatTokens(Number(usage.tokensIn) || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="mb-1 text-xs text-muted-foreground">
                          Output Token
                        </p>
                        <p className="text-base font-medium text-success">
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
        <Card className="overflow-hidden shadow-card">
          <div className="border-b border-border p-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">
                Aylık Kullanım Geçmişi
              </h2>
            </div>
          </div>
          <div className="divide-y divide-border">
            {usageHistory.slice(0, 12).map((usage) => {
              const usageTotal = (Number(usage.tokensIn) || 0) + (Number(usage.tokensOut) || 0);
              return (
                <div
                  key={usage.id}
                  className="p-6 transition-colors hover:bg-secondary"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="mb-1 text-base font-medium text-foreground">
                        {formatMonth(usage.month)}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Input: {formatTokens(Number(usage.tokensIn) || 0)}</span>
                        <span>Output: {formatTokens(Number(usage.tokensOut) || 0)}</span>
                        <span>{Number(usage.requestCount) || 0} istek</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-semibold text-foreground">
                        {formatTokens(usageTotal)}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Toplam Token
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
