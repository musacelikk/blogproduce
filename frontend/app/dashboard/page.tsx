'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, FileText, Zap, Clock, AlertCircle, ArrowRight, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { StatsCardSkeleton, BlogListSkeleton } from '@/components/ui/skeleton';
import { getPosts, getCurrentUsage, type Post } from '@/lib/api';

const statusLabel: Record<string, string> = {
  queued: 'Kuyruğa Eklendi', generating: 'Üretiliyor', generated: 'Hazır',
  failed: 'Başarısız', draft: 'Taslak', published: 'Yayında',
  review: 'İncelemede', scheduled: 'Zamanlanmış', archived: 'Arşivlendi',
};

const statusStyle: Record<string, { bg: string; color: string }> = {
  queued:     { bg: '#fef9c3', color: '#854d0e' },
  generating: { bg: '#203eec12', color: '#203eec' },
  generated:  { bg: '#dcfce7', color: '#166534' },
  published:  { bg: '#dcfce7', color: '#166534' },
  failed:     { bg: '#fee2e2', color: '#991b1b' },
  draft:      { bg: 'var(--card)', color: 'var(--muted-foreground)' },
  review:     { bg: '#fff7ed', color: '#9a3412' },
  scheduled:  { bg: '#f3e8ff', color: '#6b21a8' },
  archived:   { bg: 'var(--card)', color: 'var(--muted-foreground)' },
};

function formatRelativeTime(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)  return 'Az önce';
  if (mins < 60) return `${mins}dk önce`;
  if (hours < 24) return `${hours}sa önce`;
  if (days < 7)  return `${days}g önce`;
  return new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });
}

const card = {
  hidden:  { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] as const } }),
};

export default function DashboardPage() {
  const [posts,     setPosts]     = useState<Post[]>([]);
  const [usage,     setUsage]     = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [postsData, usageData] = await Promise.all([
        getPosts(),
        getCurrentUsage().catch(() => null),
      ]);
      setPosts(postsData);
      setUsage(usageData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Veriler yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const totalPosts     = posts.length;
  const thisMonthPosts = posts.filter((p) => {
    const d = new Date(p.createdAt), n = new Date();
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  }).length;
  const recentPosts = posts.slice(0, 5);
  const latestPost  = posts[0];
  const totalTokens = usage ? Number(usage.tokensIn || 0) + Number(usage.tokensOut || 0) : 0;

  const stats = [
    {
      label: 'Toplam Blog',
      value: totalPosts.toString(),
      sub: `${thisMonthPosts} bu ay`,
      icon: FileText,
      gradient: 'linear-gradient(135deg,#203eec,#00b4d8)',
    },
    {
      label: 'Bu Ay Üretilen',
      value: thisMonthPosts.toString(),
      sub: 'Aylık üretim',
      icon: Sparkles,
      gradient: 'linear-gradient(135deg,#10b981,#059669)',
    },
    {
      label: 'Token Kullanımı',
      value: totalTokens >= 1000 ? `${(totalTokens / 1000).toFixed(1)}K` : totalTokens.toString(),
      sub: usage ? `${Number(usage.tokensIn || 0).toLocaleString('tr-TR')} in / ${Number(usage.tokensOut || 0).toLocaleString('tr-TR')} out` : 'Henüz kullanım yok',
      icon: Zap,
      gradient: 'linear-gradient(135deg,#f59e0b,#d97706)',
    },
    {
      label: 'Son Blog',
      value: latestPost ? formatRelativeTime(latestPost.createdAt) : '—',
      sub: latestPost ? latestPost.title.substring(0, 28) + '…' : 'Blog üretmeye başlayın',
      icon: Clock,
      gradient: 'linear-gradient(135deg,#8b5cf6,#7c3aed)',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="h-7 w-56 rounded-xl animate-pulse" style={{ background: 'var(--card)' }} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <StatsCardSkeleton key={i} />)}
        </div>
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="h-5 w-32 rounded-lg animate-pulse" style={{ background: 'var(--border)' }} />
            <div className="h-4 w-16 rounded-lg animate-pulse" style={{ background: 'var(--border)' }} />
          </div>
          <BlogListSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 rounded-2xl flex items-start gap-3 text-sm" style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b' }}>
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold mb-1">Veri yüklenemedi</p>
          <p>{error}</p>
          <button onClick={loadData} className="mt-2 text-xs font-semibold underline">Tekrar Dene</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={card}
              className="relative overflow-hidden rounded-2xl p-5 group"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              {/* Subtle gradient orb */}
              <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-[0.07] blur-xl"
                   style={{ background: s.gradient }} />
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                     style={{ background: s.gradient }}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <TrendingUp className="w-4 h-4 opacity-30" style={{ color: 'var(--muted-foreground)' }} />
              </div>
              <p className="text-2xl font-bold text-foreground tracking-tight mb-0.5">{s.value}</p>
              <p className="text-xs font-medium text-muted-foreground mb-1">{s.label}</p>
              <p className="text-[10px] text-muted-foreground opacity-70 truncate">{s.sub}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.34 }}
        className="rounded-2xl p-5"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <h2 className="text-sm font-semibold text-foreground mb-4">Hızlı İşlemler</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/generate"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg,#203eec,#00d4ff)' }}
          >
            <Sparkles className="w-4 h-4" />
            Yeni Blog Üret
          </Link>
          <Link
            href="/dashboard/blogs"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all hover:border-[#203eec] hover:text-[#203eec]"
            style={{ border: '1px solid var(--border)', color: 'var(--foreground)', background: 'var(--background)' }}
          >
            <FileText className="w-4 h-4" />
            Bloglarımı Görüntüle
          </Link>
        </div>
      </motion.div>

      {/* Recent Blogs */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.44 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-sm font-semibold text-foreground">Son Bloglarım</h2>
          <Link href="/dashboard/blogs" className="text-xs font-semibold transition-colors hover:opacity-80" style={{ color: '#203eec' }}>
            Tümünü Gör →
          </Link>
        </div>

        {recentPosts.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg,#203eec12,#00d4ff12)', border: '1px solid #203eec20' }}>
              <FileText className="w-6 h-6" style={{ color: '#203eec' }} />
            </div>
            <p className="text-sm font-medium text-foreground mb-1.5">Henüz blog oluşturulmamış</p>
            <p className="text-xs text-muted-foreground mb-5">İlk blogunu oluşturmak için aşağıya tıkla</p>
            <Link
              href="/dashboard/generate"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#203eec,#00d4ff)' }}
            >
              <Sparkles className="w-4 h-4" /> Yeni Blog Üret
            </Link>
          </div>
        ) : (
          <div>
            {recentPosts.map((post, i) => {
              const sStyle = statusStyle[post.status] ?? statusStyle.draft;
              return (
                <Link
                  key={post.id}
                  href={`/dashboard/blogs/${post.id}`}
                  className="flex items-center justify-between px-5 py-3.5 transition-colors group"
                  style={{ borderBottom: i < recentPosts.length - 1 ? '1px solid var(--border)' : 'none' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--background)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="text-sm font-medium text-foreground group-hover:text-[#203eec] transition-colors truncate mb-1">
                      {post.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{formatDate(post.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{ background: sStyle.bg, color: sStyle.color }}>
                      {statusLabel[post.status] ?? post.status}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
