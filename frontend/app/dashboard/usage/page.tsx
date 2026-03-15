'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Loader2, AlertCircle, Folder, Filter, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
               style={{ background: 'linear-gradient(135deg,#203eec,#00d4ff)' }}>
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Kullanım</h1>
            <p className="text-sm text-muted-foreground">Token ve API kullanım istatistiklerinizi görüntüleyin</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedMonth || currentMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border focus:border-[#203eec] focus:outline-none"
            style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          >
            <option value="">Bu Ay ({formatMonth(currentMonth)})</option>
            {availableMonths.map((month) => (
              <option key={month} value={month}>
                {formatMonth(month)}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Hata</p>
              <p className="text-sm">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={loadUsageData}
                className="mt-2 border-red-200 text-red-600 hover:bg-red-100"
              >
                Tekrar Dene
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Overall Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Toplam Token', value: formatTokens(totalTokens), icon: Zap, gradient: 'linear-gradient(135deg,#203eec,#00d4ff)' },
          { label: 'Input Token', value: formatTokens(totalTokensIn), icon: TrendingUp, gradient: 'linear-gradient(135deg,#3b82f6,#60a5fa)' },
          { label: 'Output Token', value: formatTokens(totalTokensOut), icon: Zap, gradient: 'linear-gradient(135deg,#10B981,#34d399)' },
          { label: 'İstek Sayısı', value: totalRequests.toLocaleString('tr-TR'), icon: Filter, gradient: 'linear-gradient(135deg,#8b5cf6,#a78bfa)' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.07 }}
              className="rounded-2xl p-4 relative overflow-hidden"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full opacity-[0.07] blur-xl"
                   style={{ background: stat.gradient }} />
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{stat.label}</span>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                     style={{ background: stat.gradient }}>
                  <Icon className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              {loading ? (
                <div className="h-7 w-24 bg-[var(--border)] animate-pulse rounded" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Workspace-based Usage */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="p-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <Folder className="w-5 h-5 text-[#203eec]" />
            <h2
              className="text-lg font-semibold text-foreground"
            >
              Workspace Bazlı Kullanım
            </h2>
          </div>
          <p
            className="text-sm text-muted-foreground mt-1"
          >
            Her workspace için token kullanım detayları
          </p>
        </div>
        {loading ? (
          <TableSkeleton rows={5} />
        ) : workspaceUsage.length === 0 ? (
          <div className="p-12 text-center">
            <Folder className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p
              className="text-lg text-muted-foreground mb-2"
            >
              Henüz token kullanımı yok
            </p>
            <p
              className="text-sm text-muted-foreground"
            >
              Blog ürettiğinizde workspace bazlı kullanım verileri burada görünecek
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {workspaceUsage.map((usage, index) => {
              const workspace = workspaces.find(w => w.id === usage.workspaceId);
              const workspaceColor = workspace?.color || '#203eec';
              const usageTotalTokens = Number(usage.totalTokens) || 0;
              const totalPercentage = totalTokens > 0 ? (usageTotalTokens / totalTokens) * 100 : 0;

              return (
                <motion.div
                  key={usage.workspaceId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="p-6 hover:bg-[var(--secondary)] transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      {workspaceColor && (
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: workspaceColor }}
                        />
                      )}
                      <div className="flex-1">
                        <h3
                          className="text-base font-medium text-foreground mb-1"
                        >
                          {usage.workspaceName}
                        </h3>
                        <p
                          className="text-xs text-muted-foreground"
                        >
                          {usage.requestCount} istek
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className="text-xl font-semibold text-foreground"
                      >
                        {formatTokens(Number(usage.totalTokens) || 0)}
                      </p>
                      <p
                        className="text-xs text-muted-foreground mt-0.5"
                      >
                        {totalPercentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full bg-[var(--secondary)] rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full transition-all duration-500 rounded-full"
                        style={{
                          width: `${totalPercentage}%`,
                          backgroundColor: workspaceColor,
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p
                          className="text-xs text-muted-foreground mb-1"
                        >
                          Input Token
                        </p>
                      <p
                        className="text-base font-medium text-blue-600"
                      >
                        {formatTokens(Number(usage.tokensIn) || 0)}
                      </p>
                      </div>
                      <div>
                        <p
                          className="text-xs text-muted-foreground mb-1"
                        >
                          Output Token
                        </p>
                        <p
                          className="text-base font-medium text-green-600"
                        >
                          {formatTokens(Number(usage.tokensOut) || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Usage History */}
      {usageHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div className="p-6 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#203eec]" />
              <h2
                className="text-lg font-semibold text-foreground"
              >
                Aylık Kullanım Geçmişi
              </h2>
            </div>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {usageHistory.slice(0, 12).map((usage, index) => {
              const usageTotal = (Number(usage.tokensIn) || 0) + (Number(usage.tokensOut) || 0);
              return (
                <motion.div
                  key={usage.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                  className="p-6 hover:bg-[var(--secondary)] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className="text-base font-medium text-foreground mb-1"
                      >
                        {formatMonth(usage.month)}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Input: {formatTokens(Number(usage.tokensIn) || 0)}</span>
                        <span>Output: {formatTokens(Number(usage.tokensOut) || 0)}</span>
                        <span>{Number(usage.requestCount) || 0} istek</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className="text-xl font-semibold text-foreground"
                      >
                        {formatTokens(usageTotal)}
                      </p>
                      <p
                        className="text-xs text-muted-foreground mt-0.5"
                      >
                        Toplam Token
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}

