'use client';

import { useState, useEffect } from 'react';
import { Users, FileText, Activity, Zap, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { getAdminDashboardStats, getAdminUsers, getAdminPosts, type AdminUser, type AdminDashboardStats } from '@/lib/api';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<AdminUser[]>([]);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsData, usersData, postsData] = await Promise.all([
        getAdminDashboardStats(),
        getAdminUsers(),
        getAdminPosts({ status: 'generated' }),
      ]);

      setStats(statsData);
      setRecentUsers(usersData.slice(0, 5));

      // Handle both pagination format and array format
      let postsArray: any[] = [];
      if (postsData && typeof postsData === 'object' && 'data' in postsData && 'pagination' in postsData) {
        // New format with pagination
        postsArray = postsData.data;
      } else if (Array.isArray(postsData)) {
        // Old format (array)
        postsArray = postsData;
      }
      setRecentPosts(postsArray.slice(0, 5));
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Veriler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="mb-6 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-card">
              <div className="mb-4 flex items-center justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-9 w-9 rounded-lg" />
              </div>
              <Skeleton className="mb-2 h-7 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[...Array(2)].map((_, card) => (
            <div key={card} className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
              <div className="flex items-center justify-between border-b border-border bg-surface-raised p-5">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="divide-y divide-border">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-5">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="mb-2 h-4 w-32" />
                      <Skeleton className="h-3 w-48 max-w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Yönetim"
          title="Admin Dashboard"
          description="Sistem genelinde istatistikler ve yönetim paneli"
        />
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-[var(--destructive-muted)] p-4 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Panel verileri yüklenemedi</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      name: 'Toplam Kullanıcı',
      value: stats?.totalUsers?.toLocaleString('tr-TR') || '0',
      change: '+12%',
      changeType: 'up' as const,
      icon: Users,
    },
    {
      name: 'Toplam Blog',
      value: stats?.totalPosts?.toLocaleString('tr-TR') || '0',
      change: '+8%',
      changeType: 'up' as const,
      icon: FileText,
    },
    {
      name: 'Aktif Kullanıcı',
      value: stats?.activeUsers?.toLocaleString('tr-TR') || '0',
      change: '+5%',
      changeType: 'up' as const,
      icon: Activity,
    },
    {
      name: 'Toplam Token',
      value: stats?.totalTokens?.toLocaleString('tr-TR') || '0',
      change: '+24%',
      changeType: 'up' as const,
      icon: Zap,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Yönetim"
        title="Admin Dashboard"
        description="Sistem genelinde istatistikler ve yönetim paneli"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <StatCard
              key={stat.name}
              label={stat.name}
              value={stat.value}
              icon={<Icon />}
              trend={{ value: stat.change, positive: stat.changeType === 'up' }}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Users */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border bg-surface-raised p-5">
            <CardTitle>Son Kullanıcılar</CardTitle>
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-1 text-xs font-medium text-accent-foreground transition-colors hover:text-primary-dark"
            >
              Tümünü Gör
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentUsers.length > 0 ? (
              <div className="divide-y divide-border">
                {recentUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between gap-4 p-5 transition-colors duration-fast ease-out-quart hover:bg-surface-raised"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground-strong">
                          {user.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                      <p className="text-sm font-medium text-foreground-strong">
                        <span className="tabular-nums">
                          {user.blogsCount.toLocaleString('tr-TR')}
                        </span>{' '}
                        blog
                      </p>
                      <Badge variant={user.status === 'active' ? 'success' : 'destructive'}>
                        {user.status === 'active' ? 'Aktif' : 'Pasif'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Users />}
                title="Henüz kullanıcı yok"
                description="Sisteme ilk kayıt geldiğinde en yeni kullanıcılar burada listelenir."
                className="border-0 bg-transparent py-10"
                action={
                  <Button asChild variant="outline" size="sm">
                    <Link href="/admin/users">
                      <Users />
                      Kullanıcı Yönetimine Git
                    </Link>
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>

        {/* Recent Posts */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border bg-surface-raised p-5">
            <CardTitle>Son Bloglar</CardTitle>
            <Link
              href="/admin/blogs"
              className="inline-flex items-center gap-1 text-xs font-medium text-accent-foreground transition-colors hover:text-primary-dark"
            >
              Tümünü Gör
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentPosts.length > 0 ? (
              <div className="divide-y divide-border">
                {recentPosts.map((post) => (
                  <div
                    key={post.id}
                    className="p-5 transition-colors duration-fast ease-out-quart hover:bg-surface-raised"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-success-muted">
                        <FileText className="h-5 w-5 text-success" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-medium text-foreground-strong">
                          {post.title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                          {new Date(post.createdAt).toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<FileText />}
                title="Henüz blog yok"
                description="Kullanıcılar içerik ürettikçe en son hazırlanan bloglar burada görünür."
                className="border-0 bg-transparent py-10"
                action={
                  <Button asChild variant="outline" size="sm">
                    <Link href="/admin/blogs">
                      <FileText />
                      Blog Yönetimine Git
                    </Link>
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
