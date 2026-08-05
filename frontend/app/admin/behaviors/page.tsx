'use client';

import { useState, useEffect } from 'react';
import {
  Activity,
  AlertCircle,
  BarChart3,
  Clock,
  Search,
  User,
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
        title="User Behavior Tracking"
        description="Kullanıcı davranışlarını ve etkileşimlerini analiz edin"
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatCard
            label="Toplam Behavior"
            value={stats?.totalBehaviors || 0}
            icon={<Activity />}
          />
          <StatCard
            label="Ortalama Süre"
            value={formatDuration(stats?.avgSessionDuration)}
            icon={<Clock />}
          />
          <StatCard
            label="Benzersiz Session"
            value={stats?.uniqueSessions || 0}
            icon={<User />}
          />
          <StatCard
            label="Behavior Tipleri"
            value={stats?.behaviorsByType?.length || 0}
            icon={<BarChart3 />}
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
            value={behaviorTypeFilter}
            onChange={(e) => setBehaviorTypeFilter(e.target.value)}
            aria-label="Behavior tipi filtresi"
            className={SELECT_CLASS}
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

      {/* Behaviors Table */}
      {filteredBehaviors.length === 0 ? (
        <EmptyState
          icon={<Activity />}
          title="Henüz behavior kaydı bulunmuyor"
          description="Seçtiğiniz filtrelere uygun bir davranış kaydı yok."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tip</TableHead>
              <TableHead>Sayfa</TableHead>
              <TableHead>Kullanıcı</TableHead>
              <TableHead>Süre</TableHead>
              <TableHead>Session</TableHead>
              <TableHead>Tarih</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBehaviors.map((behavior) => (
              <TableRow key={behavior.id}>
                <TableCell>
                  <Badge variant="info">{behavior.behaviorType}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{behavior.page || '-'}</TableCell>
                <TableCell className="text-muted-foreground">
                  {behavior.user?.email || 'Misafir'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDuration(behavior.duration)}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {behavior.sessionId?.substring(0, 8) || '-'}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {new Date(behavior.createdAt).toLocaleString('tr-TR')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
