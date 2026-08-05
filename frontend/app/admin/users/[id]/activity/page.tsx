'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Activity,
  Clock,
  User,
  Search,
  Loader2,
  AlertCircle,
  FileText,
  Shield,
  Settings,
  LogIn,
  LogOut,
  Trash2,
  Edit,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import {
  getAdminUserById,
  getAdminActivityLogs,
  type AdminUser,
  type ActivityLog,
} from '@/lib/api';

const selectClass =
  'h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

export default function UserActivityPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<AdminUser | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'user' | 'blog' | 'system' | 'auth'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'info' | 'warning' | 'error' | 'success'>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      loadUserData();
      loadUserLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await getAdminUserById(userId);
      setUser(userData);
    } catch (err) {
      console.error('Error loading user:', err);
      setError(err instanceof Error ? err.message : 'Kullanıcı bilgileri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const loadUserLogs = async () => {
    try {
      setLoadingLogs(true);
      const userLogs = await getAdminActivityLogs({
        userId,
        limit: 200,
      });
      setLogs(userLogs);
    } catch (err) {
      console.error('Error loading logs:', err);
      setError(err instanceof Error ? err.message : 'Loglar yüklenirken bir hata oluştu');
    } finally {
      setLoadingLogs(false);
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
    if (action.includes('oluşturuldu') || action.includes('kayıt')) return User;
    if (action.includes('silindi')) return Trash2;
    if (action.includes('düzenlendi')) return Edit;
    if (action.includes('yayınlandı')) return Eye;
    return Activity;
  };

  const getSeverityVariant = (severity: string): 'success' | 'warning' | 'destructive' | 'info' => {
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

  const getTypeStyles = (type: string) => {
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

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.targetName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || log.type === typeFilter;
    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
    return matchesSearch && matchesType && matchesSeverity;
  });

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-destructive/30 bg-[var(--destructive-muted)] p-4">
          <div className="flex items-start gap-2 text-destructive">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Hata</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
        <Button onClick={() => router.push('/admin/users')} variant="outline">
          <ArrowLeft className="h-4 w-4" />
          Geri Dön
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <Button
          onClick={() => router.push('/admin/users')}
          variant="ghost"
          size="sm"
          className="-ml-3 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Geri Dön
        </Button>
        <PageHeader
          title="Kullanıcı Aktiviteleri"
          description={user ? `${user.name} (${user.email})` : undefined}
          className="mb-0"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-[var(--destructive-muted)] p-4">
          <div className="flex items-start gap-2 text-destructive">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Hata</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Aktivite veya hedef ile ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-card pl-9"
              />
            </div>
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            aria-label="Tip filtresi"
            className={selectClass}
          >
            <option value="all">Tüm Tipler</option>
            <option value="user">Kullanıcı</option>
            <option value="blog">Blog</option>
            <option value="auth">Kimlik Doğrulama</option>
            <option value="system">Sistem</option>
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
            aria-label="Seviye filtresi"
            className={selectClass}
          >
            <option value="all">Tüm Seviyeler</option>
            <option value="info">Bilgi</option>
            <option value="success">Başarılı</option>
            <option value="warning">Uyarı</option>
            <option value="error">Hata</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="Toplam Aktivite" value={logs.length} icon={<Activity />} />
        <StatCard label="Hatalar" value={logs.filter((l) => l.severity === 'error').length} />
        <StatCard label="Uyarılar" value={logs.filter((l) => l.severity === 'warning').length} />
        <StatCard label="Başarılı" value={logs.filter((l) => l.severity === 'success').length} />
      </div>

      {/* Logs List */}
      <div className="space-y-3">
        {loadingLogs ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center shadow-card">
            <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loglar yükleniyor...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <EmptyState
            icon={<Activity />}
            title="Aktivite bulunamadı"
            description="Seçtiğiniz filtrelerle eşleşen bir aktivite kaydı yok."
          />
        ) : (
          filteredLogs.map((log) => {
            const TypeIcon = getActivityIcon(log.type);
            const ActionIcon = getActionIcon(log.action);

            return (
              <div
                key={log.id}
                className="rounded-xl border border-border bg-card p-4 shadow-card transition-shadow hover:shadow-card-hover"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${getTypeStyles(log.type)}`}
                  >
                    <TypeIcon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row">
                      <div className="min-w-0">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <ActionIcon className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm font-medium text-foreground">{log.action}</p>
                          <Badge variant={getSeverityVariant(log.severity)}>{log.severity}</Badge>
                        </div>

                        {log.targetName && (
                          <div className="mb-1 flex items-center gap-2">
                            <FileText className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {log.targetType}: {log.targetName}
                            </span>
                          </div>
                        )}

                        {log.details && (
                          <div className="mt-2 overflow-x-auto rounded-lg border border-border bg-secondary p-2">
                            <pre className="font-mono text-xs text-muted-foreground">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>

                      <div className="flex-shrink-0 sm:text-right">
                        <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground sm:justify-end">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            {new Date(log.timestamp || log.createdAt || '').toLocaleString('tr-TR')}
                          </span>
                        </div>
                        {log.ipAddress && (
                          <p className="font-mono text-xs text-muted-foreground">
                            IP: {log.ipAddress}
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
