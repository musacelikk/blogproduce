'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MousePointerClick,
  Search,
  Calendar,
  User,
  Filter,
  Loader2,
  AlertCircle,
  BarChart3,
  TrendingUp,
  Eye,
  FileText,
} from 'lucide-react';
import { AdminTableSkeleton } from '@/components/ui/skeleton';

type EventTracking = {
  id: string;
  eventType: string;
  eventName: string;
  userId: string | null;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
  page: string | null;
  referrer: string | null;
  properties: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  sessionId: string | null;
  createdAt: string;
};

type EventStats = {
  totalEvents: number;
  eventsByType: Array<{ type: string; count: string }>;
  topPages: Array<{ page: string; count: string }>;
};

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventTracking[]>([]);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventTypeFilter, startDate, endDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (eventTypeFilter !== 'all') params.append('eventType', eventTypeFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('limit', '100');

      const { apiRequest } = await import('@/lib/api');
      const [eventsResponse, statsResponse] = await Promise.all([
        apiRequest(`/admin/events?${params.toString()}`, { method: 'GET' }),
        apiRequest(`/admin/events/stats?${params.toString()}`, { method: 'GET' }),
      ]);

      // Backend returns { success: true, data: [...] }
      const eventsData = eventsResponse?.data || eventsResponse || [];
      const statsData = statsResponse?.data || statsResponse || null;

      if (!Array.isArray(eventsData)) {
        throw new Error('Invalid events data format');
      }

      setEvents(eventsData);
      setStats(statsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Event tracking verileri yüklenirken bir hata oluştu';
      console.error('Error loading events:', err);
      setError(errorMessage);
      // Fallback: empty arrays
      setEvents([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter((event) =>
    searchQuery
      ? event.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.page?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

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
          Event Tracking
        </h1>
        <p
          className="text-xs text-[#ebebeb]"
          style={{
            fontFamily: 'var(--font-sans), "Inter", sans-serif',
          }}
        >
          Kullanıcı etkileşimlerini ve eventleri takip edin
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333333]"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#3B82F6] rounded-lg flex items-center justify-center">
                <MousePointerClick className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-white">{stats?.totalEvents || 0}</p>
                <p className="text-xs text-[#ebebeb]">Toplam Event</p>
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
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-white">{stats?.eventsByType?.length || 0}</p>
                <p className="text-xs text-[#ebebeb]">Event Tipleri</p>
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
                <Eye className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-white">{stats?.topPages?.length || 0}</p>
                <p className="text-xs text-[#ebebeb]">Popüler Sayfalar</p>
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
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="px-4 py-2 bg-[#0f0f0f] rounded-lg border border-[#333333] text-white text-sm focus:border-[#3B82F6] focus:outline-none"
          >
            <option value="all">Tüm Event Tipleri</option>
            <option value="page_view">Sayfa Görüntüleme</option>
            <option value="click">Tıklama</option>
            <option value="form_submit">Form Gönderimi</option>
            <option value="button_click">Buton Tıklama</option>
            <option value="link_click">Link Tıklama</option>
            <option value="search">Arama</option>
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

      {/* Events Table */}
      <div className="bg-[#1a1a1a] rounded-xl border border-[#333333] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0f0f0f] border-b border-[#333333]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#ebebeb] uppercase">Event</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#ebebeb] uppercase">Tip</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#ebebeb] uppercase">Sayfa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#ebebeb] uppercase">Kullanıcı</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#ebebeb] uppercase">Tarih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#333333]">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#ebebeb]">
                    Henüz event kaydı bulunmuyor
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-[#0f0f0f] transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm text-white font-medium">{event.eventName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-[#3B82F6]/20 text-[#3B82F6] text-xs rounded">
                        {event.eventType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-[#ebebeb]">{event.page || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-[#ebebeb]">{event.user?.email || 'Misafir'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-[#ebebeb]">
                        {new Date(event.createdAt).toLocaleString('tr-TR')}
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

