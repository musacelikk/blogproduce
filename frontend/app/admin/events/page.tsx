'use client';

import { useState, useEffect } from 'react';
import {
  AlertCircle,
  BarChart3,
  Eye,
  MousePointerClick,
  Search,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const SELECT_CLASS =
  'h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

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
          <Skeleton className="mb-2 h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Event Tracking"
        description="Kullanıcı etkileşimlerini ve eventleri takip edin"
      />

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-[var(--destructive-muted)] p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Hata</p>
            <p className="mt-1 text-xs">{error}</p>
          </div>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            label="Toplam Event"
            value={stats?.totalEvents || 0}
            icon={<MousePointerClick />}
          />
          <StatCard
            label="Event Tipleri"
            value={stats?.eventsByType?.length || 0}
            icon={<BarChart3 />}
          />
          <StatCard
            label="Popüler Sayfalar"
            value={stats?.topPages?.length || 0}
            icon={<Eye />}
          />
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            aria-label="Event tipi filtresi"
            className={SELECT_CLASS}
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
            className={SELECT_CLASS}
            aria-label="Başlangıç Tarihi"
            placeholder="Başlangıç Tarihi"
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={SELECT_CLASS}
            aria-label="Bitiş Tarihi"
            placeholder="Bitiş Tarihi"
          />
        </div>
      </div>

      {/* Events Table */}
      {filteredEvents.length === 0 ? (
        <EmptyState
          icon={<MousePointerClick />}
          title="Henüz event kaydı bulunmuyor"
          description="Seçtiğiniz filtrelere uygun bir event kaydı yok."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Tip</TableHead>
              <TableHead>Sayfa</TableHead>
              <TableHead>Kullanıcı</TableHead>
              <TableHead>Tarih</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEvents.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-medium">{event.eventName}</TableCell>
                <TableCell>
                  <Badge variant="info">{event.eventType}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{event.page || '-'}</TableCell>
                <TableCell className="text-muted-foreground">
                  {event.user?.email || 'Misafir'}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {new Date(event.createdAt).toLocaleString('tr-TR')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
