'use client';

import { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  Clock,
  Edit,
  Eye,
  EyeOff,
  FileText,
  LogIn,
  LogOut,
  Search,
  Settings,
  Shield,
  Trash2,
  User,
  UserPlus,
  XCircle,
} from 'lucide-react';
import { getAdminActivityLogs, type ActivityLog } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';

const SELECT_CLASS =
  'h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export default function AdminActivitiesPage() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'user' | 'blog' | 'system' | 'auth'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'info' | 'warning' | 'error' | 'success'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  useEffect(() => {
    loadActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);

      // Backend API'den logları çek
      const logs = await getAdminActivityLogs({
        type: typeFilter !== 'all' ? typeFilter : undefined,
        severity: severityFilter !== 'all' ? severityFilter : undefined,
        limit: 100,
      });

      // API'den gelen veriyi frontend formatına çevir
      const formattedLogs: ActivityLog[] = logs.map((log) => ({
        id: log.id,
        type: log.type,
        action: log.action,
        user: log.user,
        target: log.targetType && log.targetId ? {
          type: log.targetType,
          id: log.targetId,
          name: log.targetName || '',
        } : undefined,
        details: log.details,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        timestamp: log.timestamp || log.createdAt || new Date().toISOString(),
        severity: log.severity,
      }));

      setActivities(formattedLogs);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user':
        return User;
      case 'blog':
        return FileText;
      case 'auth':
        return Shield;
      case 'system':
        return Settings;
      default:
        return Activity;
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('Giriş')) return LogIn;
    if (action.includes('Çıkış')) return LogOut;
    if (action.includes('oluşturuldu') || action.includes('kayıt')) return UserPlus;
    if (action.includes('silindi')) return Trash2;
    if (action.includes('düzenlendi')) return Edit;
    if (action.includes('yayınlandı')) return Eye;
    if (action.includes('taslak')) return EyeOff;
    return Activity;
  };

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      activity.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.user?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.target?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || activity.type === typeFilter;
    const matchesSeverity = severityFilter === 'all' || activity.severity === severityFilter;

    let matchesDate = true;
    if (dateFilter !== 'all') {
      if (!activity.timestamp) {
        matchesDate = false;
      } else {
        const activityDate = new Date(activity.timestamp);
        const now = new Date();
        if (dateFilter === 'today') {
          matchesDate = activityDate.toDateString() === now.toDateString();
        } else if (dateFilter === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = activityDate >= weekAgo;
        } else if (dateFilter === 'month') {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = activityDate >= monthAgo;
        }
      }
    }

    return matchesSearch && matchesType && matchesSeverity && matchesDate;
  });

  const getSeverityVariant = (severity: string): BadgeProps['variant'] => {
    switch (severity) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'destructive';
      default:
        return 'info';
    }
  };

  const getTypeIconClass = (type: string) => {
    switch (type) {
      case 'user':
        return 'bg-accent text-accent-foreground';
      case 'blog':
        return 'bg-success-muted text-success';
      case 'auth':
        return 'bg-warning-muted text-warning';
      case 'system':
        return 'bg-info-muted text-info';
      default:
        return 'bg-secondary text-muted-foreground';
    }
  };

  const stats = {
    total: activities.length,
    today: activities.filter(a => {
      if (!a.timestamp) return false;
      const date = new Date(a.timestamp);
      return date.toDateString() === new Date().toDateString();
    }).length,
    errors: activities.filter(a => a.severity === 'error').length,
    warnings: activities.filter(a => a.severity === 'warning').length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Aktivite Logları"
        description="Sistem genelindeki tüm aktiviteleri ve log kayıtlarını görüntüleyin"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="Toplam Aktivite" value={stats.total} icon={<Activity />} />
        <StatCard label="Bugün" value={stats.today} icon={<CalendarDays />} />
        <StatCard label="Hatalar" value={stats.errors} icon={<XCircle />} />
        <StatCard label="Uyarılar" value={stats.warnings} icon={<AlertTriangle />} />
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Aktivite, kullanıcı veya hedef ile ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              aria-label="Tip filtresi"
              className={SELECT_CLASS}
            >
              <option value="all">Tüm Tipler</option>
              <option value="user">Kullanıcı</option>
              <option value="blog">Blog</option>
              <option value="auth">Kimlik Doğrulama</option>
              <option value="system">Sistem</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as any)}
              aria-label="Seviye filtresi"
              className={SELECT_CLASS}
            >
              <option value="all">Tüm Seviyeler</option>
              <option value="info">Bilgi</option>
              <option value="success">Başarılı</option>
              <option value="warning">Uyarı</option>
              <option value="error">Hata</option>
            </select>
          </div>
        </div>

        {/* Date Filter */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-sm text-muted-foreground">Tarih:</span>
          <div className="flex flex-wrap items-center gap-2">
            {(['all', 'today', 'week', 'month'] as const).map((period) => (
              <Button
                key={period}
                size="sm"
                variant={dateFilter === period ? 'default' : 'outline'}
                onClick={() => setDateFilter(period)}
              >
                {period === 'all' && 'Tümü'}
                {period === 'today' && 'Bugün'}
                {period === 'week' && 'Bu Hafta'}
                {period === 'month' && 'Bu Ay'}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Activities List */}
      <div className="space-y-3">
        {loading ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground shadow-card">
            Yükleniyor...
          </div>
        ) : filteredActivities.length === 0 ? (
          <EmptyState
            icon={<Activity />}
            title="Aktivite bulunamadı"
            description="Seçtiğiniz filtrelere uygun bir log kaydı yok."
          />
        ) : (
          filteredActivities.map((activity) => {
            const TypeIcon = getActivityIcon(activity.type);
            const ActionIcon = getActionIcon(activity.action);

            return (
              <div
                key={activity.id}
                className="rounded-xl border border-border bg-card p-5 shadow-card transition-shadow hover:shadow-card-hover"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${getTypeIconClass(activity.type)}`}
                  >
                    <TypeIcon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <ActionIcon className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm font-medium text-foreground">{activity.action}</p>
                          <Badge variant={getSeverityVariant(activity.severity)}>
                            {activity.severity}
                          </Badge>
                        </div>

                        {activity.user && (
                          <div className="mb-1 flex items-center gap-2">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {activity.user.name} ({activity.user.email})
                            </span>
                          </div>
                        )}

                        {activity.target && (
                          <div className="mb-1 flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {activity.target.type}: {activity.target.name}
                            </span>
                          </div>
                        )}

                        {activity.details && (
                          <div className="mt-2 overflow-x-auto rounded-lg border border-border bg-secondary p-3">
                            <pre className="font-mono text-xs text-muted-foreground">
                              {JSON.stringify(activity.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>

                      <div className="shrink-0 sm:text-right">
                        <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground sm:justify-end">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            {activity.timestamp
                              ? new Date(activity.timestamp).toLocaleString('tr-TR')
                              : 'N/A'}
                          </span>
                        </div>
                        {activity.ipAddress && (
                          <p className="font-mono text-xs text-muted-foreground">
                            IP: {activity.ipAddress}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
