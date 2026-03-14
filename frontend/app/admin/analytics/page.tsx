'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  Zap,
  DollarSign,
  Calendar,
  Loader2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { getAdminUsageStats, getAllUsage, type UsageStats, type UsageLedger } from '@/lib/api';

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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-3 text-[#3B82F6] animate-spin" />
          <p className="text-xs text-[#ebebeb]">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1
            className="text-[24px] font-normal text-white mb-2"
            style={{
              fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
            }}
          >
            İstatistikler ve Analitik
          </h1>
          <p
            className="text-sm text-[#ebebeb]"
            style={{
              fontFamily: 'var(--font-sans), "Inter", sans-serif',
            }}
          >
            Sistem kullanım istatistikleri ve analitik veriler
          </p>
        </div>

        {/* Month Selector */}
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-4 py-2 bg-[#1a1a1a] rounded-lg border border-[#333333] text-white focus:border-[#3B82F6] focus:outline-none"
          style={{
            fontFamily: 'var(--font-sans), "Inter", sans-serif',
          }}
        >
          <option value="">Tüm Zamanlar</option>
          {monthOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </motion.div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 text-red-400">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Hata</p>
              <p>{error}</p>
            </div>
          </div>
        </div>
      )}

      {stats && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333333]"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-[#3B82F6] rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3
                className="text-lg font-semibold text-white mb-1"
                style={{
                  fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
                }}
              >
                ${stats.totalCost.toFixed(2)}
              </h3>
              <p
                className="text-xs text-[#ebebeb]"
                style={{
                  fontFamily: 'var(--font-sans), "Inter", sans-serif',
                }}
              >
                Toplam Maliyet
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333333]"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-[#10B981] rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3
                className="text-lg font-semibold text-white mb-1"
                style={{
                  fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
                }}
              >
                {(stats.totalTokensIn + stats.totalTokensOut).toLocaleString('tr-TR')}
              </h3>
              <p
                className="text-xs text-[#ebebeb]"
                style={{
                  fontFamily: 'var(--font-sans), "Inter", sans-serif',
                }}
              >
                Toplam Token
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333333]"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-[#F59E0B] rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3
                className="text-lg font-semibold text-white mb-1"
                style={{
                  fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
                }}
              >
                {stats.totalRequests.toLocaleString('tr-TR')}
              </h3>
              <p
                className="text-xs text-[#ebebeb]"
                style={{
                  fontFamily: 'var(--font-sans), "Inter", sans-serif',
                }}
              >
                Toplam İstek
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333333]"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-[#8B5CF6] rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3
                className="text-lg font-semibold text-white mb-1"
                style={{
                  fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
                }}
              >
                {stats.activeUsers}
              </h3>
              <p
                className="text-xs text-[#ebebeb]"
                style={{
                  fontFamily: 'var(--font-sans), "Inter", sans-serif',
                }}
              >
                Aktif Kullanıcı
              </p>
            </motion.div>
          </div>

          {/* Token Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333333]"
          >
            <h2
              className="text-base font-medium text-white mb-6"
              style={{
                fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
              }}
            >
              Token Kullanım Detayları
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p
                  className="text-xs text-[#ebebeb] mb-2"
                  style={{
                    fontFamily: 'var(--font-sans), "Inter", sans-serif',
                  }}
                >
                  Input Tokens
                </p>
                <p
                  className="text-3xl font-semibold text-white"
                  style={{
                    fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
                  }}
                >
                  {stats.totalTokensIn.toLocaleString('tr-TR')}
                </p>
              </div>
              <div>
                <p
                  className="text-xs text-[#ebebeb] mb-2"
                  style={{
                    fontFamily: 'var(--font-sans), "Inter", sans-serif',
                  }}
                >
                  Output Tokens
                </p>
                <p
                  className="text-3xl font-semibold text-white"
                  style={{
                    fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
                  }}
                >
                  {stats.totalTokensOut.toLocaleString('tr-TR')}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Usage by User */}
          {stats.usageByUser && stats.usageByUser.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="bg-[#1a1a1a] rounded-xl border border-[#333333] overflow-hidden"
            >
              <div className="p-6 border-b border-[#333333]">
                <h2
                  className="text-base font-medium text-white"
                  style={{
                    fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
                  }}
                >
                  Kullanıcı Bazında Kullanım
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#0f0f0f] border-b border-[#333333]">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#ebebeb]">Kullanıcı</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#ebebeb]">Maliyet</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#ebebeb]">Input Tokens</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#ebebeb]">Output Tokens</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#ebebeb]">İstek Sayısı</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#333333]">
                    {stats.usageByUser.map((usage) => (
                      <tr key={usage.userId} className="hover:bg-[#0f0f0f] transition-colors">
                        <td className="px-6 py-4">
                          <p
                            className="text-white"
                            style={{
                              fontFamily: 'var(--font-sans), "Inter", sans-serif',
                            }}
                          >
                            {usage.userEmail}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p
                            className="text-white"
                            style={{
                              fontFamily: 'var(--font-sans), "Inter", sans-serif',
                            }}
                          >
                            ${usage.cost.toFixed(2)}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p
                            className="text-white"
                            style={{
                              fontFamily: 'var(--font-sans), "Inter", sans-serif',
                            }}
                          >
                            {usage.tokensIn.toLocaleString('tr-TR')}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p
                            className="text-white"
                            style={{
                              fontFamily: 'var(--font-sans), "Inter", sans-serif',
                            }}
                          >
                            {usage.tokensOut.toLocaleString('tr-TR')}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p
                            className="text-white"
                            style={{
                              fontFamily: 'var(--font-sans), "Inter", sans-serif',
                            }}
                          >
                            {usage.requestCount}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
