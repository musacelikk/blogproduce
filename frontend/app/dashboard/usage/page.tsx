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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center md:justify-end gap-3"
      >
        <div className="flex items-center gap-2">
          <select
            value={selectedMonth || currentMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-[#e5e5e5] rounded-lg focus:border-[#203eec] focus:outline-none"
            style={{
            }}
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl p-5"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span
              className="text-xs text-[#666666]"
              style={{
              }}
            >
              Toplam Token
            </span>
            <Zap className="w-5 h-5 text-[#203eec]" />
          </div>
          {loading ? (
            <div className="h-7 w-24 bg-[#e5e5e5] animate-pulse rounded" />
          ) : (
            <p
              className="text-2xl font-semibold text-[#202020]"
              style={{
              }}
            >
              {formatTokens(totalTokens)}
            </p>
          )}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-2xl p-5"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span
              className="text-xs text-[#666666]"
              style={{
              }}
            >
              Input Token
            </span>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          {loading ? (
            <div className="h-7 w-24 bg-[#e5e5e5] animate-pulse rounded" />
          ) : (
            <p
              className="text-2xl font-semibold text-[#202020]"
              style={{
              }}
            >
              {formatTokens(totalTokensIn)}
            </p>
          )}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-2xl p-5"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span
              className="text-xs text-[#666666]"
              style={{
              }}
            >
              Output Token
            </span>
            <Zap className="w-5 h-5 text-green-600" />
          </div>
          {loading ? (
            <div className="h-7 w-24 bg-[#e5e5e5] animate-pulse rounded" />
          ) : (
            <p
              className="text-2xl font-semibold text-[#202020]"
              style={{
              }}
            >
              {formatTokens(totalTokensOut)}
            </p>
          )}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="rounded-2xl p-5"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span
              className="text-xs text-[#666666]"
              style={{
              }}
            >
              İstek Sayısı
            </span>
            <Filter className="w-5 h-5 text-purple-600" />
          </div>
          {loading ? (
            <div className="h-7 w-24 bg-[#e5e5e5] animate-pulse rounded" />
          ) : (
            <p
              className="text-2xl font-semibold text-[#202020]"
              style={{
              }}
            >
              {totalRequests.toLocaleString('tr-TR')}
            </p>
          )}
        </motion.div>
      </div>

      {/* Workspace-based Usage */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="p-6 border-b border-[#e5e5e5]">
          <div className="flex items-center gap-3">
            <Folder className="w-5 h-5 text-[#203eec]" />
            <h2
              className="text-lg font-semibold text-[#202020]"
              style={{
              }}
            >
              Workspace Bazlı Kullanım
            </h2>
          </div>
          <p
            className="text-sm text-[#666666] mt-1"
            style={{
            }}
          >
            Her workspace için token kullanım detayları
          </p>
        </div>
        {loading ? (
          <TableSkeleton rows={5} />
        ) : workspaceUsage.length === 0 ? (
          <div className="p-12 text-center">
            <Folder className="w-16 h-16 mx-auto mb-4 text-[#999999] opacity-50" />
            <p
              className="text-lg text-[#666666] mb-2"
              style={{
              }}
            >
              Henüz token kullanımı yok
            </p>
            <p
              className="text-sm text-[#999999]"
              style={{
              }}
            >
              Blog ürettiğinizde workspace bazlı kullanım verileri burada görünecek
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#e5e5e5]">
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
                  className="p-6 hover:bg-[#fafafa] transition-colors"
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
                          className="text-base font-medium text-[#202020] mb-1"
                          style={{
                          }}
                        >
                          {usage.workspaceName}
                        </h3>
                        <p
                          className="text-xs text-[#666666]"
                          style={{
                          }}
                        >
                          {usage.requestCount} istek
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className="text-xl font-semibold text-[#202020]"
                        style={{
                        }}
                      >
                        {formatTokens(Number(usage.totalTokens) || 0)}
                      </p>
                      <p
                        className="text-xs text-[#666666] mt-0.5"
                        style={{
                        }}
                      >
                        {totalPercentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full bg-[#f5f5f5] rounded-full h-2 overflow-hidden">
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
                          className="text-xs text-[#666666] mb-1"
                          style={{
                          }}
                        >
                          Input Token
                        </p>
                      <p
                        className="text-base font-medium text-blue-600"
                        style={{
                        }}
                      >
                        {formatTokens(Number(usage.tokensIn) || 0)}
                      </p>
                      </div>
                      <div>
                        <p
                          className="text-xs text-[#666666] mb-1"
                          style={{
                          }}
                        >
                          Output Token
                        </p>
                        <p
                          className="text-base font-medium text-green-600"
                          style={{
                          }}
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
          <div className="p-6 border-b border-[#e5e5e5]">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#203eec]" />
              <h2
                className="text-lg font-semibold text-[#202020]"
                style={{
                }}
              >
                Aylık Kullanım Geçmişi
              </h2>
            </div>
          </div>
          <div className="divide-y divide-[#e5e5e5]">
            {usageHistory.slice(0, 12).map((usage, index) => {
              const usageTotal = (Number(usage.tokensIn) || 0) + (Number(usage.tokensOut) || 0);
              return (
                <motion.div
                  key={usage.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                  className="p-6 hover:bg-[#fafafa] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className="text-base font-medium text-[#202020] mb-1"
                        style={{
                        }}
                      >
                        {formatMonth(usage.month)}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-[#666666]">
                        <span>Input: {formatTokens(Number(usage.tokensIn) || 0)}</span>
                        <span>Output: {formatTokens(Number(usage.tokensOut) || 0)}</span>
                        <span>{Number(usage.requestCount) || 0} istek</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className="text-xl font-semibold text-[#202020]"
                        style={{
                        }}
                      >
                        {formatTokens(usageTotal)}
                      </p>
                      <p
                        className="text-xs text-[#666666] mt-0.5"
                        style={{
                        }}
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

