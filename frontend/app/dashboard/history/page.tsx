'use client';

import { useState, useEffect } from 'react';
import { History, Search, Clock, FileText, Sparkles, Calendar, TrendingUp, Filter, Loader2, AlertCircle, EyeOff, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { getPosts, type Post } from '@/lib/api';
import Link from 'next/link';

type ActivityType = 'generated' | 'edited' | 'published';

interface HistoryItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  date: string;
  time: string;
  postId: string;
  datetime: Date;
  hiddenByAdmin?: boolean;
  hiddenReason?: string;
}

const formatRelativeTime = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Az önce';
  if (diffMins < 60) return `${diffMins} dakika önce`;
  if (diffHours < 24) return `${diffHours} saat önce`;
  if (diffDays < 7) return `${diffDays} gün önce`;

  return date.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ActivityType | 'Tümü'>('Tümü');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const posts = await getPosts();

      const activities: HistoryItem[] = [];

      posts.forEach((post) => {
        const createdAt = new Date(post.createdAt);
        const updatedAt = new Date(post.updatedAt);
        const publishedAt = post.publishedAt ? new Date(post.publishedAt) : null;

        // Generated activity
        activities.push({
          id: `${post.id}-generated`,
          type: 'generated',
          title: post.title,
          description: post.hiddenByAdmin ? 'Admin tarafından kaldırılan blog' : 'Blog başarıyla üretildi',
          timestamp: formatRelativeTime(createdAt),
          date: formatDate(createdAt),
          time: formatTime(createdAt),
          postId: post.id,
          datetime: createdAt,
          hiddenByAdmin: post.hiddenByAdmin,
          hiddenReason: post.hiddenReason || undefined,
        });

        // Edited activity (if updated after creation)
        if (updatedAt.getTime() > createdAt.getTime() + 1000) { // 1 second threshold
          activities.push({
            id: `${post.id}-edited`,
            type: 'edited',
            title: post.title,
            description: 'Blog düzenlendi ve kaydedildi',
            timestamp: formatRelativeTime(updatedAt),
            date: formatDate(updatedAt),
            time: formatTime(updatedAt),
            postId: post.id,
            datetime: updatedAt,
          });
        }

        // Published activity (if published)
        if (post.status === 'published' && publishedAt) {
          activities.push({
            id: `${post.id}-published`,
            type: 'published',
            title: post.title,
            description: 'Blog yayınlandı',
            timestamp: formatRelativeTime(publishedAt),
            date: formatDate(publishedAt),
            time: formatTime(publishedAt),
            postId: post.id,
            datetime: publishedAt,
          });
        }
      });

      // Sort by datetime (newest first)
      activities.sort((a, b) => b.datetime.getTime() - a.datetime.getTime());

      setHistory(activities);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Geçmiş yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredHistory = history.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'Tümü' || item.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'generated':
        return <Sparkles className="h-5 w-5 text-primary" />;
      case 'edited':
        return <FileText className="h-5 w-5 text-success" />;
      case 'published':
        return <TrendingUp className="h-5 w-5 text-warning" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getActivityColor = (type: ActivityType) => {
    switch (type) {
      case 'generated':
        return 'bg-accent';
      case 'edited':
        return 'bg-success-muted';
      case 'published':
        return 'bg-warning-muted';
      default:
        return 'bg-secondary';
    }
  };

  const getActivityDotColor = (type: ActivityType) => {
    switch (type) {
      case 'generated':
        return 'bg-primary';
      case 'edited':
        return 'bg-success';
      case 'published':
        return 'bg-warning';
      default:
        return 'bg-muted-foreground';
    }
  };

  const getActivityLabel = (type: ActivityType) => {
    switch (type) {
      case 'generated':
        return 'Üretildi';
      case 'edited':
        return 'Düzenlendi';
      case 'published':
        return 'Yayınlandı';
      default:
        return 'Bilinmiyor';
    }
  };

  // Group by date
  const groupedHistory = filteredHistory.reduce((acc, item) => {
    if (!acc[item.date]) {
      acc[item.date] = [];
    }
    acc[item.date].push(item);
    return acc;
  }, {} as Record<string, HistoryItem[]>);

  const totalGenerated = history.filter(h => h.type === 'generated').length;
  const totalEdited = history.filter(h => h.type === 'edited').length;
  const totalPublished = history.filter(h => h.type === 'published').length;

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 h-12 w-12 animate-spin text-primary" />
          <p className="text-base text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-border bg-[var(--destructive-muted)] p-4 text-destructive">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Hata</p>
              <p>{error}</p>
              <Button variant="outline" size="sm" onClick={loadHistory} className="mt-2">
                Tekrar Dene
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Geçmiş"
        description="Tüm aktivite ve işlem geçmişinizi görüntüleyin"
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge variant="primary">
              <Sparkles className="h-3.5 w-3.5" />
              {totalGenerated} Üretildi
            </Badge>
            <Badge variant="success">
              <FileText className="h-3.5 w-3.5" />
              {totalEdited} Düzenlendi
            </Badge>
            <Badge variant="warning">
              <TrendingUp className="h-3.5 w-3.5" />
              {totalPublished} Yayınlandı
            </Badge>
          </div>
        }
      />

      {/* Search and Filter */}
      <Card className="flex flex-col gap-3 p-3.5 shadow-card md:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Geçmişte ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as ActivityType | 'Tümü')}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="Tümü">Tümü</option>
            <option value="generated">Üretildi</option>
            <option value="edited">Düzenlendi</option>
            <option value="published">Yayınlandı</option>
          </select>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Toplam Aktivite" value={history.length} icon={<History />} />
        <StatCard label="Üretilen" value={totalGenerated} icon={<Sparkles />} />
        <StatCard label="Düzenlenen" value={totalEdited} icon={<FileText />} />
        <StatCard label="Yayınlanan" value={totalPublished} icon={<TrendingUp />} />
      </div>

      {/* History Timeline */}
      <Card className="overflow-hidden shadow-card">
        {filteredHistory.length === 0 ? (
          <EmptyState
            className="rounded-none border-0"
            icon={<History />}
            title={history.length === 0 ? 'Henüz aktivite bulunmuyor' : 'Aktivite bulunamadı'}
            description={
              history.length === 0
                ? 'Blog üretmeye başladığınızda aktiviteleriniz burada görünecek'
                : 'Arama kriterlerinizi değiştirip tekrar deneyin'
            }
          />
        ) : (
          <div className="p-6">
            {Object.entries(groupedHistory).map(([date, items], dateIndex) => (
              <div key={date} className={dateIndex > 0 ? 'mt-8' : ''}>
                <div className="mb-4 flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-lg font-medium text-foreground">
                    {date}
                  </h3>
                </div>
                <div className="relative space-y-6 border-l-2 border-border pl-8">
                  {items.map((item) => (
                    <div key={item.id} className="relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-[29px] top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-border bg-card">
                        <div className={`h-1.5 w-1.5 rounded-full ${getActivityDotColor(item.type)}`} />
                      </div>

                      <Link href={`/dashboard/blogs/${item.postId}`}>
                        <div className={`rounded-lg border border-border p-3.5 transition-all hover:shadow-card-hover ${item.hiddenByAdmin ? 'bg-[var(--destructive-muted)]' : getActivityColor(item.type)}`}>
                          <div className="mb-1.5 flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`rounded-lg p-1.5 ${item.hiddenByAdmin ? 'bg-[var(--destructive-muted)]' : getActivityColor(item.type)}`}>
                                {item.hiddenByAdmin ? (
                                  <AlertTriangle className="h-4 w-4 text-destructive" />
                                ) : (
                                  getActivityIcon(item.type)
                                )}
                              </div>
                              <div>
                                <h4 className={`text-sm font-medium ${item.hiddenByAdmin ? 'text-destructive' : 'text-foreground'}`}>
                                  {item.title}
                                </h4>
                                <p className={`text-xs ${item.hiddenByAdmin ? 'text-destructive' : 'text-muted-foreground'}`}>
                                  {item.description}
                                  {item.hiddenByAdmin && item.hiddenReason && (
                                    <span className="mt-0.5 block italic">
                                      Sebep: {item.hiddenReason}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              {item.hiddenByAdmin ? (
                                <Badge variant="destructive">
                                  <EyeOff className="h-3 w-3" />
                                  Kaldırıldı
                                </Badge>
                              ) : (
                                <span className="rounded-full px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                  {getActivityLabel(item.type)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="mt-1.5 flex items-center gap-3 text-[10px] text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{item.time}</span>
                            </div>
                            <span>•</span>
                            <span>{item.timestamp}</span>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
