'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, FileText, TrendingUp, Activity, ArrowUpRight, ArrowDownRight, Zap, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { AdminCardSkeleton } from '@/components/ui/skeleton';
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
        <div className="mb-6">
          <div className="h-8 w-48 bg-[#333333] animate-pulse rounded mb-2" />
          <div className="h-4 w-96 bg-[#333333] animate-pulse rounded" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <AdminCardSkeleton key={i} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#1a1a1a] rounded-xl border border-[#333333] overflow-hidden">
            <div className="p-6 border-b border-[#333333] flex items-center justify-between">
              <div className="h-6 w-32 bg-[#333333] animate-pulse rounded" />
              <div className="h-4 w-16 bg-[#333333] animate-pulse rounded" />
            </div>
            <div className="divide-y divide-[#333333]">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-[#333333] animate-pulse rounded-full" />
                      <div>
                        <div className="h-4 w-32 bg-[#333333] animate-pulse rounded mb-2" />
                        <div className="h-3 w-48 bg-[#333333] animate-pulse rounded" />
                      </div>
                    </div>
                    <div className="h-5 w-20 bg-[#333333] animate-pulse rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#1a1a1a] rounded-xl border border-[#333333] overflow-hidden">
            <div className="p-6 border-b border-[#333333] flex items-center justify-between">
              <div className="h-6 w-32 bg-[#333333] animate-pulse rounded" />
              <div className="h-4 w-16 bg-[#333333] animate-pulse rounded" />
            </div>
            <div className="divide-y divide-[#333333]">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 bg-[#333333] animate-pulse rounded-lg" />
                    <div className="flex-1">
                      <div className="h-4 w-full bg-[#333333] animate-pulse rounded mb-2" />
                      <div className="h-3 w-32 bg-[#333333] animate-pulse rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 text-red-400">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Hata</p>
            <p>{error}</p>
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
      color: 'bg-[#3B82F6]',
    },
    {
      name: 'Toplam Blog',
      value: stats?.totalPosts?.toLocaleString('tr-TR') || '0',
      change: '+8%',
      changeType: 'up' as const,
      icon: FileText,
      color: 'bg-[#10B981]',
    },
    {
      name: 'Aktif Kullanıcı',
      value: stats?.activeUsers?.toLocaleString('tr-TR') || '0',
      change: '+5%',
      changeType: 'up' as const,
      icon: Activity,
      color: 'bg-[#F59E0B]',
    },
    {
      name: 'Toplam Token',
      value: stats?.totalTokens?.toLocaleString('tr-TR') || '0',
      change: '+24%',
      changeType: 'up' as const,
      icon: Zap,
      color: 'bg-[#8B5CF6]',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1
          className="text-[24px] font-normal text-white mb-2"
          style={{
            fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
          }}
        >
          Admin Dashboard
        </h1>
        <p
          className="text-sm text-[#ebebeb]"
          style={{
            fontFamily: 'var(--font-sans), "Inter", sans-serif',
          }}
        >
          Sistem genelinde istatistikler ve yönetim paneli
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333333] hover:border-[#3B82F6]/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className={`flex items-center gap-1 text-sm ${
                  stat.changeType === 'up' ? 'text-[#10B981]' : 'text-[#EF4444]'
                }`}>
                  {stat.changeType === 'up' ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  <span>{stat.change}</span>
                </div>
              </div>
              <h3
                className="text-lg font-semibold text-white mb-1"
                style={{
                  fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
                }}
              >
                {stat.value}
              </h3>
              <p
                className="text-xs text-[#ebebeb]"
                style={{
                  fontFamily: 'var(--font-sans), "Inter", sans-serif',
                }}
              >
                {stat.name}
              </p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-[#1a1a1a] rounded-xl border border-[#333333] overflow-hidden"
        >
          <div className="p-6 border-b border-[#333333] flex items-center justify-between">
            <h2
              className="text-base font-medium text-white"
              style={{
                fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
              }}
            >
              Son Kullanıcılar
            </h2>
            <Link
              href="/admin/users"
              className="text-xs text-[#3B82F6] hover:text-[#2563EB] transition-colors"
              style={{
                fontFamily: 'var(--font-sans), "Inter", sans-serif',
              }}
            >
              Tümünü Gör
            </Link>
          </div>
          <div className="divide-y divide-[#333333]">
            {recentUsers.length > 0 ? (
              recentUsers.map((user) => (
                <div key={user.id} className="p-6 hover:bg-[#0f0f0f] transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[#3B82F6] rounded-full flex items-center justify-center text-white font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p
                          className="text-white font-medium"
                          style={{
                            fontFamily: 'var(--font-sans), "Inter", sans-serif',
                          }}
                        >
                          {user.name}
                        </p>
                        <p
                          className="text-xs text-[#ebebeb]"
                          style={{
                            fontFamily: 'var(--font-sans), "Inter", sans-serif',
                          }}
                        >
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className="text-white font-medium"
                        style={{
                          fontFamily: 'var(--font-sans), "Inter", sans-serif',
                        }}
                      >
                        {user.blogsCount} blog
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        user.status === 'active' ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#EF4444]/20 text-[#EF4444]'
                      }`}>
                        {user.status === 'active' ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-[#ebebeb]">
                <p>Henüz kullanıcı yok</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Posts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-[#1a1a1a] rounded-xl border border-[#333333] overflow-hidden"
        >
          <div className="p-6 border-b border-[#333333] flex items-center justify-between">
            <h2
              className="text-base font-medium text-white"
              style={{
                fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
              }}
            >
              Son Bloglar
            </h2>
            <Link
              href="/admin/blogs"
              className="text-xs text-[#3B82F6] hover:text-[#2563EB] transition-colors"
              style={{
                fontFamily: 'var(--font-sans), "Inter", sans-serif',
              }}
            >
              Tümünü Gör
            </Link>
          </div>
          <div className="divide-y divide-[#333333]">
            {recentPosts.length > 0 ? (
              recentPosts.map((post) => (
                <div key={post.id} className="p-6 hover:bg-[#0f0f0f] transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-[#10B981]/20 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-[#10B981]" />
                    </div>
                    <div className="flex-1">
                      <p
                        className="text-white mb-1 line-clamp-1"
                        style={{
                          fontFamily: 'var(--font-sans), "Inter", sans-serif',
                        }}
                      >
                        {post.title}
                      </p>
                      <p
                        className="text-sm text-[#ebebeb]"
                        style={{
                          fontFamily: 'var(--font-sans), "Inter", sans-serif',
                        }}
                      >
                        {new Date(post.createdAt).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-[#ebebeb]">
                <p>Henüz blog yok</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
