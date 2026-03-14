'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Clock,
  MousePointerClick,
  Search,
  Calendar,
  Filter,
  Loader2,
  AlertCircle,
  BarChart3,
  TrendingUp,
  Eye,
  Activity,
} from 'lucide-react';
import { AdminTableSkeleton } from '@/components/ui/skeleton';

type UserBehavior = {
  id: string;
  behaviorType: string;
  userId: string | null;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
  page: string | null;
  sessionId: string | null;
  data: Record<string, any> | null;
  duration: number | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

type BehaviorStats = {
  totalBehaviors: number;
  behaviorsByType: Array<{ type: string; count: string }>;
  avgSessionDuration: number;
  uniqueSessions: number;
};

export default function AdminBehaviorsPage() {
  const [behaviors, setBehaviors] = useState<UserBehavior[]>([]);
  const [stats, setStats] = useState<BehaviorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [behaviorTypeFilter, setBehaviorTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [behaviorTypeFilter, startDate, endDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (behaviorTypeFilter !== 'all') params.append('behaviorType', behaviorTypeFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('limit', '100');

      const { apiRequest } = await import('@/lib/api');
      const [behaviorsResponse, statsResponse] = await Promise.all([
        apiRequest(`/admin/behaviors?${params.toString()}`, { method: 'GET' }),
        apiRequest(`/admin/behaviors/stats?${params.toString()}`, { method: 'GET' }),
      ]);

      // Backend returns { success: true, data: [...] }
      const behaviorsData = behaviorsResponse?.data || behaviorsResponse || [];
      const statsData = statsResponse?.data || statsResponse || null;

      if (!Array.isArray(behaviorsData)) {
        throw new Error('Invalid behaviors data format');
      }

      setBehaviors(behaviorsData);
      setStats(statsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'User behavior verileri yüklenirken bir hata oluştu';
      console.error('Error loading behaviors:', err);
      setError(errorMessage);
      // Fallback: empty arrays
      setBehaviors([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const filteredBehaviors = behaviors.filter((behavior) =>
    searchQuery
      ? behavior.page?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        behavior.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        behavior.sessionId?.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const formatDuration = (ms: number | null | string | undefined) => {
    if (!ms || ms === null || ms === undefined) return '-';
    const numMs = typeof ms === 'string' ? parseFloat(ms) : ms;
    if (isNaN(numMs) || numMs === 0) return '-';
    const seconds = Math.floor(numMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}s ${minutes % 60}d`;
    if (minutes > 0) return `${minutes}d ${seconds % 60}s`;
    return `${seconds}s`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <div className="h-8 w-48 bg-[#333333] animate-pulse rounded mb-2" />
          <div className="h-4 w-96 bg-[#333333] animate-pulse rounded" />
        </div>
        <AdminTableSkeleton rows={10} />
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
      >
        <h1
          className="text-lg font-medium text-white mb-1"
          style={{
            fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
          }}
        >
          User Behavior Tracking
        </h1>
        <p
          className="text-xs text-[#ebebeb]"
          style={{
            fontFamily: 'var(--font-sans), "Inter", sans-serif',
          }}
        >
          Kullanıcı davranışlarını ve etkileşimlerini analiz edin
        </p>
      </motion.div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 text-red-400">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Hata</p>
              <p className="text-xs">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333333]"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#3B82F6] rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-white">{stats?.totalBehaviors || 0}</p>
                <p className="text-xs text-[#ebebeb]">Toplam Behavior</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333333]"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#10B981] rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-white">
                  {formatDuration(stats?.avgSessionDuration)}
                </p>
                <p className="text-xs text-[#ebebeb]">Ortalama Süre</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333333]"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#F59E0B] rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-white">{stats?.uniqueSessions || 0}</p>
                <p className="text-xs text-[#ebebeb]">Benzersiz Session</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333333]"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#8B5CF6] rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-white">{stats?.behaviorsByType?.length || 0}</p>
                <p className="text-xs text-[#ebebeb]">Behavior Tipleri</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333333]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ebebeb]" />
            <input
              type="text"
              placeholder="Ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#0f0f0f] rounded-lg border border-[#333333] text-white text-sm placeholder:text-[#ebebeb] focus:border-[#3B82F6] focus:outline-none"
            />
          </div>

          <select
            value={behaviorTypeFilter}
            onChange={(e) => setBehaviorTypeFilter(e.target.value)}
            className="px-4 py-2 bg-[#0f0f0f] rounded-lg border border-[#333333] text-white text-sm focus:border-[#3B82F6] focus:outline-none"
          >
            <option value="all">Tüm Behavior Tipleri</option>
            <option value="session_start">Session Başlangıcı</option>
            <option value="session_end">Session Bitişi</option>
            <option value="page_view">Sayfa Görüntüleme</option>
            <option value="time_on_page">Sayfada Geçirilen Süre</option>
            <option value="scroll_depth">Scroll Derinliği</option>
            <option value="mouse_movement">Mouse Hareketi</option>
            <option value="form_interaction">Form Etkileşimi</option>
            <option value="error">Hata</option>
            <option value="custom">Özel</option>
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-4 py-2 bg-[#0f0f0f] rounded-lg border border-[#333333] text-white text-sm focus:border-[#3B82F6] focus:outline-none"
            placeholder="Başlangıç Tarihi"
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-4 py-2 bg-[#0f0f0f] rounded-lg border border-[#333333] text-white text-sm focus:border-[#3B82F6] focus:outline-none"
            placeholder="Bitiş Tarihi"
          />
        </div>
      </div>

      {/* Behaviors Table */}
      <div className="bg-[#1a1a1a] rounded-xl border border-[#333333] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0f0f0f] border-b border-[#333333]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#ebebeb] uppercase">Tip</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#ebebeb] uppercase">Sayfa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#ebebeb] uppercase">Kullanıcı</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#ebebeb] uppercase">Süre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#ebebeb] uppercase">Session</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#ebebeb] uppercase">Tarih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#333333]">
              {filteredBehaviors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#ebebeb]">
                    Henüz behavior kaydı bulunmuyor
                  </td>
                </tr>
              ) : (
                filteredBehaviors.map((behavior) => (
                  <tr key={behavior.id} className="hover:bg-[#0f0f0f] transition-colors">
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-[#3B82F6]/20 text-[#3B82F6] text-xs rounded">
                        {behavior.behaviorType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-[#ebebeb]">{behavior.page || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-[#ebebeb]">{behavior.user?.email || 'Misafir'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-[#ebebeb]">{formatDuration(behavior.duration)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-[#ebebeb] font-mono text-xs">
                        {behavior.sessionId?.substring(0, 8) || '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-[#ebebeb]">
                        {new Date(behavior.createdAt).toLocaleString('tr-TR')}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

