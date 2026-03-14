'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Eye, FileText, Calendar, Download, Filter, Zap, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCurrentUsage, getUsageHistory, getPosts, type UsageLedger, type Post } from '@/lib/api';

const MONTHS_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<'7days' | '30days' | '90days' | 'all'>('30days');
  const [currentUsage, setCurrentUsage] = useState<UsageLedger | null>(null);
  const [usageHistory, setUsageHistory] = useState<UsageLedger[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingUsage, setIsLoadingUsage] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [usageError, setUsageError] = useState<string | null>(null);
  const [postsError, setPostsError] = useState<string | null>(null);

  // Token limiti (varsayılan - gerçek limit API'den alınabilir)
  const TOKEN_LIMIT = 100000; // Aylık limit

  useEffect(() => {
    loadUsageData();
    loadPostsData();
  }, []);

  const loadUsageData = async () => {
    try {
      setIsLoadingUsage(true);
      setUsageError(null);
      const [current, history] = await Promise.all([
        getCurrentUsage().catch(() => null),
        getUsageHistory().catch(() => []),
      ]);
      setCurrentUsage(current);
      setUsageHistory(Array.isArray(history) ? history : []);
    } catch (err) {
      setUsageError(err instanceof Error ? err.message : 'Kullanım verileri yüklenirken bir hata oluştu');
    } finally {
      setIsLoadingUsage(false);
    }
  };

  const loadPostsData = async () => {
    try {
      setIsLoadingPosts(true);
      setPostsError(null);
      const postsData = await getPosts();
      setPosts(Array.isArray(postsData) ? postsData : []);
    } catch (err) {
      setPostsError(err instanceof Error ? err.message : 'Blog verileri yüklenirken bir hata oluştu');
    } finally {
      setIsLoadingPosts(false);
    }
  };

  // Filtrelenmiş post'lar (seçilen periyoda göre)
  const filteredPosts = useMemo(() => {
    if (selectedPeriod === 'all') return posts;
    
    const now = new Date();
    const periodDays = selectedPeriod === '7days' ? 7 : selectedPeriod === '30days' ? 30 : 90;
    const cutoffDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
    
    return posts.filter(post => {
      const postDate = new Date(post.createdAt);
      return postDate >= cutoffDate;
    });
  }, [posts, selectedPeriod]);

  // Aylık veriler
  const monthlyData = useMemo(() => {
    const monthlyMap = new Map<string, { blogs: number; generated: number }>();
    
    filteredPosts.forEach(post => {
      const date = new Date(post.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = MONTHS_TR[date.getMonth()];
      const year = date.getFullYear();
      const displayKey = `${monthName} ${year}`;
      
      if (!monthlyMap.has(displayKey)) {
        monthlyMap.set(displayKey, { blogs: 0, generated: 0 });
      }
      
      const data = monthlyMap.get(displayKey)!;
      data.generated += 1;
      if (post.status === 'published') {
        data.blogs += 1;
      }
    });
    
    // Map'i array'e çevir ve sırala
    const data = Array.from(monthlyMap.entries())
      .map(([month, values]) => ({
        month,
        blogs: values.blogs,
        generated: values.generated,
        views: 0, // Görüntülenme sayısı backend'de yok, şimdilik 0
      }))
      .sort((a, b) => {
        // Ay isimlerine göre sıralama (basit sıralama)
        const monthIndexA = MONTHS_TR.indexOf(a.month.split(' ')[0]);
        const monthIndexB = MONTHS_TR.indexOf(b.month.split(' ')[0]);
        return monthIndexB - monthIndexA;
      })
      .slice(0, 6); // Son 6 ay
    
    return data;
  }, [filteredPosts]);

  // En popüler bloglar (published olanlar, tarihe göre sıralı)
  const topBlogs = useMemo(() => {
    return filteredPosts
      .filter(post => post.status === 'published')
      .sort((a, b) => {
        const dateA = new Date(a.publishedAt || a.createdAt);
        const dateB = new Date(b.publishedAt || b.createdAt);
        return dateB.getTime() - dateA.getTime(); // En yeni önce
      })
      .slice(0, 5)
      .map((post, index) => ({
        id: post.id,
        title: post.title,
        views: 0, // Görüntülenme sayısı backend'de yok, şimdilik 0
        tags: post.tags?.map(tag => tag.name) || [],
      }));
  }, [filteredPosts]);

  // İstatistikler
  const stats = useMemo(() => {
    const publishedPosts = filteredPosts.filter(post => post.status === 'published');
    const totalBlogs = publishedPosts.length;
    const totalGenerated = filteredPosts.length;
    const totalViews = 0; // Görüntülenme sayısı backend'de yok
    const avgViews = totalBlogs > 0 ? Math.round(totalViews / totalBlogs) : 0;
    
    // Önceki periyod ile karşılaştırma (basit hesaplama)
    const previousPeriodDays = selectedPeriod === '7days' ? 7 : selectedPeriod === '30days' ? 30 : 90;
    const previousCutoff = new Date(new Date().getTime() - previousPeriodDays * 2 * 24 * 60 * 60 * 1000);
    const previousPosts = posts.filter(post => {
      const postDate = new Date(post.createdAt);
      return postDate >= previousCutoff && postDate < new Date(new Date().getTime() - previousPeriodDays * 24 * 60 * 60 * 1000);
    });
    const previousPublished = previousPosts.filter(post => post.status === 'published').length;
    const previousGenerated = previousPosts.length;
    
    const blogsGrowth = previousPublished > 0 
      ? Math.round(((totalBlogs - previousPublished) / previousPublished) * 100)
      : totalBlogs > 0 ? 100 : 0;
    const generatedGrowth = previousGenerated > 0
      ? Math.round(((totalGenerated - previousGenerated) / previousGenerated) * 100)
      : totalGenerated > 0 ? 100 : 0;
    
    return {
      totalBlogs,
      totalViews,
      avgViews,
      totalGenerated,
      blogsGrowth,
      generatedGrowth,
      viewsGrowth: 0, // Görüntülenme sayısı yok
    };
  }, [filteredPosts, posts, selectedPeriod]);

  const totalTokensUsed = currentUsage 
    ? (currentUsage.tokensIn || 0) + (currentUsage.tokensOut || 0)
    : 0;
  const totalTokensIn = currentUsage?.tokensIn || 0;
  const totalTokensOut = currentUsage?.tokensOut || 0;
  const tokenUsagePercent = TOKEN_LIMIT > 0 ? Math.min((totalTokensUsed / TOKEN_LIMIT) * 100, 100) : 0;

  const maxViews = Math.max(...monthlyData.map(d => d.views), 1);

  const isLoading = isLoadingUsage || isLoadingPosts;

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center md:justify-end gap-3"
      >
        <div className="flex items-center gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as typeof selectedPeriod)}
            className="px-3 py-1.5 text-sm bg-white border border-[#e5e5e5] rounded-lg focus:border-[#203eec] focus:outline-none"
            style={{
            }}
          >
            <option value="7days">Son 7 Gün</option>
            <option value="30days">Son 30 Gün</option>
            <option value="90days">Son 90 Gün</option>
            <option value="all">Tüm Zamanlar</option>
          </select>
          <Button variant="outline" size="sm" className="border-[#e5e5e5] hover:border-[#203eec] hover:text-[#203eec]">
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export
          </Button>
        </div>
      </motion.div>

      {/* Error Messages */}
      {(postsError || usageError) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Hata</p>
              {postsError && <p className="text-sm">{postsError}</p>}
              {usageError && <p className="text-sm">{usageError}</p>}
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-xl p-5 border border-[#e5e5e5]"
        >
          <div className="flex items-center justify-between mb-3">
            <span
              className="text-xs text-[#666666]"
              style={{
              }}
            >
              Toplam Blog
            </span>
            <FileText className="w-5 h-5 text-[#203eec]" />
          </div>
          {isLoadingPosts ? (
            <Loader2 className="w-5 h-5 text-[#203eec] animate-spin" />
          ) : (
            <>
              <p
                className="text-xl font-semibold text-[#202020] mb-1"
                style={{
                }}
              >
                {stats.totalBlogs}
              </p>
              {stats.blogsGrowth !== 0 && (
                <p
                  className={`text-[10px] ${stats.blogsGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}
                  style={{
                  }}
                >
                  {stats.blogsGrowth > 0 ? '+' : ''}{stats.blogsGrowth}% {stats.blogsGrowth > 0 ? 'artış' : 'azalış'}
                </p>
              )}
            </>
          )}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-xl p-5 border border-[#e5e5e5]"
        >
          <div className="flex items-center justify-between mb-3">
            <span
              className="text-xs text-[#666666]"
              style={{
              }}
            >
              Toplam Görüntülenme
            </span>
            <Eye className="w-5 h-5 text-[#10B981]" />
          </div>
          {isLoadingPosts ? (
            <Loader2 className="w-5 h-5 text-[#10B981] animate-spin" />
          ) : (
            <>
              <p
                className="text-xl font-semibold text-[#202020] mb-1"
                style={{
                }}
              >
                {stats.totalViews.toLocaleString()}
              </p>
              <p
                className="text-[10px] text-[#666666]"
                style={{
                }}
              >
                Görüntülenme takibi yakında
              </p>
            </>
          )}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-xl p-5 border border-[#e5e5e5]"
        >
          <div className="flex items-center justify-between mb-3">
            <span
              className="text-xs text-[#666666]"
              style={{
              }}
            >
              Ortalama Görüntülenme
            </span>
            <TrendingUp className="w-5 h-5 text-[#F59E0B]" />
          </div>
          {isLoadingPosts ? (
            <Loader2 className="w-5 h-5 text-[#F59E0B] animate-spin" />
          ) : (
            <>
              <p
                className="text-xl font-semibold text-[#202020] mb-1"
                style={{
                }}
              >
                {stats.avgViews}
              </p>
              <p
                className="text-[10px] text-[#666666]"
                style={{
                }}
              >
                Görüntülenme takibi yakında
              </p>
            </>
          )}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-xl p-5 border border-[#e5e5e5]"
        >
          <div className="flex items-center justify-between mb-3">
            <span
              className="text-xs text-[#666666]"
              style={{
              }}
            >
              Üretilen Blog
            </span>
            <BarChart3 className="w-5 h-5 text-[#8B5CF6]" />
          </div>
          {isLoadingPosts ? (
            <Loader2 className="w-5 h-5 text-[#8B5CF6] animate-spin" />
          ) : (
            <>
              <p
                className="text-xl font-semibold text-[#202020] mb-1"
                style={{
                }}
              >
                {stats.totalGenerated}
              </p>
              {stats.generatedGrowth !== 0 && (
                <p
                  className={`text-[10px] ${stats.generatedGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}
                  style={{
                  }}
                >
                  {stats.generatedGrowth > 0 ? '+' : ''}{stats.generatedGrowth}% {stats.generatedGrowth > 0 ? 'artış' : 'azalış'}
                </p>
              )}
            </>
          )}
        </motion.div>
      </div>

      {/* Token Usage Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="bg-white rounded-xl p-5 border border-[#e5e5e5]"
      >
        <div className="flex items-center justify-between mb-5">
          <h2
            className="text-lg font-medium text-[#202020]"
            style={{
            }}
          >
            Token Kullanımı ve Limitler
          </h2>
        </div>
        {isLoadingUsage ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-[#203eec] animate-spin" />
          </div>
        ) : usageError ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Hata</p>
                <p className="text-sm">{usageError}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Token Usage Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#F59E0B]" />
                  <span
                    className="text-sm font-medium text-[#202020]"
                    style={{
                    }}
                  >
                    Aylık Token Kullanımı
                  </span>
                </div>
                <span
                  className={`text-sm font-semibold ${tokenUsagePercent > 80 ? 'text-red-600' : tokenUsagePercent > 50 ? 'text-yellow-600' : 'text-green-600'}`}
                  style={{
                  }}
                >
                  {totalTokensUsed.toLocaleString('tr-TR')} / {TOKEN_LIMIT.toLocaleString('tr-TR')}
                </span>
              </div>
              <div className="w-full bg-[#f5f5f5] rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    tokenUsagePercent > 80 ? 'bg-red-500' : tokenUsagePercent > 50 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${tokenUsagePercent}%` }}
                />
              </div>
              <p
                className="text-xs text-[#666666] mt-1"
                style={{
                }}
              >
                {tokenUsagePercent.toFixed(1)}% kullanıldı
              </p>
            </div>

            {/* Token Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-xs font-medium text-blue-600 uppercase tracking-wide"
                    style={{
                    }}
                  >
                    Input Tokens
                  </span>
                  <Zap className="w-4 h-4 text-blue-600" />
                </div>
                <p
                  className="text-2xl font-bold text-blue-700"
                  style={{
                  }}
                >
                  {totalTokensIn.toLocaleString('tr-TR')}
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-xs font-medium text-green-600 uppercase tracking-wide"
                    style={{
                    }}
                  >
                    Output Tokens
                  </span>
                  <Zap className="w-4 h-4 text-green-600" />
                </div>
                <p
                  className="text-2xl font-bold text-green-700"
                  style={{
                  }}
                >
                  {totalTokensOut.toLocaleString('tr-TR')}
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-xs font-medium text-purple-600 uppercase tracking-wide"
                    style={{
                    }}
                  >
                    Toplam
                  </span>
                  <Zap className="w-4 h-4 text-purple-600" />
                </div>
                <p
                  className="text-2xl font-bold text-purple-700"
                  style={{
                  }}
                >
                  {totalTokensUsed.toLocaleString('tr-TR')}
                </p>
              </div>
            </div>

            {/* Usage History */}
            {usageHistory.length > 0 && (
              <div className="mt-5 pt-5 border-t border-[#e5e5e5]">
                <h3
                  className="text-sm font-medium text-[#202020] mb-3"
                  style={{
                  }}
                >
                  Geçmiş Kullanım
                </h3>
                <div className="space-y-2">
                  {usageHistory.slice(0, 5).map((usage) => {
                    const usageTotal = (usage.tokensIn || 0) + (usage.tokensOut || 0);
                    return (
                      <div key={usage.id} className="flex items-center justify-between p-3 bg-[#fafafa] rounded-lg">
                        <div>
                          <p
                            className="text-sm font-medium text-[#202020]"
                            style={{
                            }}
                          >
                            {usage.month}
                          </p>
                          <p
                            className="text-xs text-[#666666]"
                            style={{
                            }}
                          >
                            {usage.tokensIn || 0} in / {usage.tokensOut || 0} out
                          </p>
                        </div>
                        <span
                          className="text-sm font-semibold text-[#202020]"
                          style={{
                          }}
                        >
                          {usageTotal.toLocaleString('tr-TR')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Chart */}
      {monthlyData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-white rounded-xl p-5 border border-[#e5e5e5]"
        >
          <div className="flex items-center justify-between mb-5">
            <h2
              className="text-lg font-medium text-[#202020]"
              style={{
              }}
            >
              Aylık Blog Üretim Trendi
            </h2>
          </div>
          {isLoadingPosts ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-6 h-6 text-[#203eec] animate-spin" />
            </div>
          ) : (
            <div className="flex items-end justify-between gap-3 h-64">
              {monthlyData.map((data, index) => (
                <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col justify-end h-full">
                    <div
                      className="w-full bg-[#203eec] rounded-t-lg transition-all hover:opacity-80"
                      style={{
                        height: `${Math.max((data.generated / Math.max(...monthlyData.map(d => d.generated), 1)) * 100, 5)}%`,
                        minHeight: '8px',
                      }}
                      title={`${data.generated} üretim`}
                    />
                  </div>
                  <span
                    className="text-[10px] text-[#666666] text-center"
                    style={{
                    }}
                  >
                    {data.month.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Top Blogs */}
      {topBlogs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-white rounded-xl border border-[#e5e5e5] overflow-hidden"
        >
          <div className="p-5 border-b border-[#e5e5e5]">
            <h2
              className="text-lg font-medium text-[#202020]"
              style={{
              }}
            >
              Son Yayınlanan Bloglar
            </h2>
          </div>
          {isLoadingPosts ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-[#203eec] animate-spin" />
            </div>
          ) : (
            <div className="divide-y divide-[#e5e5e5]">
              {topBlogs.map((blog, index) => (
                <div key={blog.id} className="p-5 hover:bg-[#fafafa] transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-8 h-8 bg-[#203eec]/10 rounded-lg flex items-center justify-center">
                        <span
                          className="text-sm font-semibold text-[#203eec]"
                          style={{
                          }}
                        >
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3
                          className="text-sm font-medium text-[#202020] mb-1"
                          style={{
                          }}
                        >
                          {blog.title}
                        </h3>
                        {blog.tags.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap">
                            {blog.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 bg-[#f5f5f5] rounded text-[10px] text-[#666666]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#666666]" />
                      <span
                        className="text-xs text-[#666666]"
                        style={{
                        }}
                      >
                        Yayınlandı
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {!isLoadingPosts && posts.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-12 border border-[#e5e5e5] text-center"
        >
          <FileText className="w-12 h-12 text-[#666666] mx-auto mb-4" />
          <h3
            className="text-lg font-medium text-[#202020] mb-2"
            style={{
            }}
          >
            Henüz blog içeriği yok
          </h3>
          <p
            className="text-sm text-[#666666]"
            style={{
            }}
          >
            İlk blog içeriğinizi oluşturduğunuzda raporlar burada görünecek.
          </p>
        </motion.div>
      )}
    </div>
  );
}
