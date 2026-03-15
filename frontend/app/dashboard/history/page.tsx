'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { History, Search, Clock, FileText, Sparkles, Calendar, TrendingUp, Filter, Loader2, AlertCircle, EyeOff, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
        return <Sparkles className="w-5 h-5 text-[#203eec]" />;
      case 'edited':
        return <FileText className="w-5 h-5 text-[#10B981]" />;
      case 'published':
        return <TrendingUp className="w-5 h-5 text-[#F59E0B]" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getActivityColor = (type: ActivityType) => {
    switch (type) {
      case 'generated':
        return 'bg-[#203eec]/10 border-[#203eec]/20';
      case 'edited':
        return 'bg-[#10B981]/10 border-[#10B981]/20';
      case 'published':
        return 'bg-[#F59E0B]/10 border-[#F59E0B]/20';
      default:
        return 'bg-gray-100 border-gray-200';
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-3 text-[#203eec] animate-spin" />
          <p className="text-base text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-5">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Hata</p>
              <p>{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={loadHistory}
                className="mt-2 border-red-200 text-red-600 hover:bg-red-100"
              >
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
            <History className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Geçmiş</h1>
            <p className="text-sm text-muted-foreground">Tüm aktivite ve işlem geçmişinizi görüntüleyin</p>
          </div>
        </div>
        {/* Stats Pills */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{ background: '#203eec12', color: '#203eec', border: '1px solid #203eec20' }}>
            <Sparkles className="w-3.5 h-3.5" />
            {totalGenerated} Üretildi
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{ background: '#10B98112', color: '#10B981', border: '1px solid #10B98120' }}>
            <FileText className="w-3.5 h-3.5" />
            {totalEdited} Düzenlendi
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{ background: '#F59E0B12', color: '#F59E0B', border: '1px solid #F59E0B20' }}>
            <TrendingUp className="w-3.5 h-3.5" />
            {totalPublished} Yayınlandı
          </span>
        </div>
      </motion.div>

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="rounded-2xl p-3.5 flex flex-col md:flex-row gap-3"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Geçmişte ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--secondary)] rounded-xl border border-transparent focus:border-[#203eec] focus:bg-white focus:outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as ActivityType | 'Tümü')}
            className="px-4 py-2 bg-[var(--secondary)] rounded-xl border border-transparent focus:border-[#203eec] focus:outline-none transition-all"
          >
            <option value="Tümü">Tümü</option>
            <option value="generated">Üretildi</option>
            <option value="edited">Düzenlendi</option>
            <option value="published">Yayınlandı</option>
          </select>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Toplam Aktivite', value: history.length, icon: History, gradient: 'linear-gradient(135deg,#203eec,#00d4ff)' },
          { label: 'Üretilen', value: totalGenerated, icon: Sparkles, gradient: 'linear-gradient(135deg,#203eec,#818cf8)' },
          { label: 'Düzenlenen', value: totalEdited, icon: FileText, gradient: 'linear-gradient(135deg,#10B981,#34d399)' },
          { label: 'Yayınlanan', value: totalPublished, icon: TrendingUp, gradient: 'linear-gradient(135deg,#F59E0B,#fbbf24)' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 + i * 0.07 }}
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
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* History Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="rounded-2xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        {filteredHistory.length === 0 ? (
          <div className="p-12 text-center">
            <History className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p
              className="text-lg text-muted-foreground mb-2"
            >
              {history.length === 0 ? 'Henüz aktivite bulunmuyor' : 'Aktivite bulunamadı'}
            </p>
            <p
              className="text-sm text-muted-foreground"
            >
              {history.length === 0 
                ? 'Blog üretmeye başladığınızda aktiviteleriniz burada görünecek'
                : 'Arama kriterlerinizi değiştirip tekrar deneyin'}
            </p>
          </div>
        ) : (
          <div className="p-6">
            {Object.entries(groupedHistory).map(([date, items], dateIndex) => (
              <div key={date} className={dateIndex > 0 ? 'mt-8' : ''}>
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <h3
                    className="text-lg font-medium text-foreground"
                  >
                    {date}
                  </h3>
                </div>
                <div className="relative pl-8 border-l-2 border-[var(--border)] space-y-6">
                  {items.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: dateIndex * 0.1 + index * 0.05 }}
                      className="relative"
                    >
                      {/* Timeline dot */}
                      <div className="absolute -left-[29px] top-1 w-3.5 h-3.5 rounded-full flex items-center justify-center" style={{ background: 'var(--card)', border: '2px solid var(--border)' }}>
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          item.type === 'generated' ? 'bg-[#203eec]' :
                          item.type === 'edited' ? 'bg-[#10B981]' :
                          'bg-[#F59E0B]'
                        }`} />
                      </div>

                      <Link href={`/dashboard/blogs/${item.postId}`}>
                        <div className={`p-3.5 rounded-lg border ${item.hiddenByAdmin ? 'bg-red-50 border-red-200' : getActivityColor(item.type)} cursor-pointer hover:shadow-md transition-all`}>
                          <div className="flex items-start justify-between gap-3 mb-1.5">
                            <div className="flex items-center gap-2.5">
                              <div className={`p-1.5 rounded-lg ${item.hiddenByAdmin ? 'bg-red-100 border-red-200' : getActivityColor(item.type)}`}>
                                {item.hiddenByAdmin ? (
                                  <AlertTriangle className="w-4 h-4 text-red-500" />
                                ) : (
                                  getActivityIcon(item.type)
                                )}
                              </div>
                              <div>
                                <h4
                                  className={`text-sm font-medium ${item.hiddenByAdmin ? 'text-red-700' : 'text-foreground'}`}
                                >
                                  {item.title}
                                </h4>
                                <p
                                  className={`text-xs ${item.hiddenByAdmin ? 'text-red-600' : 'text-muted-foreground'}`}
                                >
                                  {item.description}
                                  {item.hiddenByAdmin && item.hiddenReason && (
                                    <span className="block mt-0.5 italic">
                                      Sebep: {item.hiddenReason}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              {item.hiddenByAdmin ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
                                  <EyeOff className="w-3 h-3" />
                                  Kaldırıldı
                                </span>
                              ) : (
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium ${getActivityColor(item.type)}`}
                                >
                                  {getActivityLabel(item.type)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1.5">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{item.time}</span>
                            </div>
                            <span>•</span>
                            <span>{item.timestamp}</span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
