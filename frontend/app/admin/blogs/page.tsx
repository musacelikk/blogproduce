'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Search,
  Filter,
  Calendar,
  User,
  Eye,
  Trash2,
  Edit,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  MoreVertical,
  Grid3x3,
  List,
  Zap,
  Globe,
  Building2,
  EyeOff,
  Eye as EyeIcon,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getAdminPosts, hideAdminPost, unhideAdminPost, type Post } from '@/lib/api';

const statusColors = {
  draft: 'bg-gray-500/20 text-gray-400',
  queued: 'bg-yellow-500/20 text-yellow-400',
  generating: 'bg-blue-500/20 text-blue-400',
  generated: 'bg-green-500/20 text-green-400',
  failed: 'bg-red-500/20 text-red-400',
  published: 'bg-purple-500/20 text-purple-400',
};

const statusIcons = {
  draft: FileText,
  queued: Clock,
  generating: Loader2,
  generated: CheckCircle2,
  failed: XCircle,
  published: CheckCircle2,
};

export default function AdminBlogsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const postsData = await getAdminPosts();
      
      // Handle both pagination format and array format
      if (postsData && typeof postsData === 'object' && 'data' in postsData && 'pagination' in postsData) {
        // New format with pagination
        setPosts(postsData.data);
      } else if (Array.isArray(postsData)) {
        // Old format (array)
        setPosts(postsData);
      } else {
        setPosts([]);
      }
    } catch (err) {
      console.error('Error loading posts:', err);
      setError(err instanceof Error ? err.message : 'Bloglar yüklenirken bir hata oluştu');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleHidePost = async (postId: string) => {
    if (!confirm('Bu blog\'u gizlemek istediğinizden emin misiniz? Blog taslağa alınacak ve kullanıcı tarafından yayınlanamayacak.')) {
      return;
    }
    try {
      await hideAdminPost(postId);
      await loadPosts();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Blog gizlenirken bir hata oluştu');
    }
  };

  const handleUnhidePost = async (postId: string) => {
    try {
      await unhideAdminPost(postId);
      await loadPosts();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Blog gizleme kaldırılırken bir hata oluştu');
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch = 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-2 text-[#3B82F6] animate-spin" />
          <p className="text-xs text-[#ebebeb]">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1
          className="text-lg font-medium text-white mb-1"
          style={{
            fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
          }}
        >
          Blog Yönetimi
        </h1>
        <p
          className="text-xs text-[#ebebeb]"
          style={{
            fontFamily: 'var(--font-sans), "Inter", sans-serif',
          }}
        >
          Tüm blogları görüntüleyin ve yönetin
        </p>
      </motion.div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 text-red-400">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Hata</p>
              <p>{error}</p>
            </div>
          </div>
      </div>
      )}

      {/* Summary & Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333333]">
          <p className="text-xs text-[#ebebeb] mb-1.5">Toplam Blog</p>
          <p className="text-xl font-semibold text-white">{posts.length}</p>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333333]">
          <p className="text-xs text-[#ebebeb] mb-1.5">Hazır</p>
          <p className="text-xl font-semibold text-green-400">
            {posts.filter((p) => p.status === 'generated').length}
          </p>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333333]">
          <p className="text-xs text-[#ebebeb] mb-1.5">Üretiliyor</p>
          <p className="text-xl font-semibold text-blue-400">
            {posts.filter((p) => p.status === 'generating' || p.status === 'queued').length}
          </p>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333333]">
          <p className="text-xs text-[#ebebeb] mb-1.5">Gösterilen</p>
          <p className="text-xl font-semibold text-white">{filteredPosts.length}</p>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333333]"
      >
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full md:w-auto">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ebebeb]" />
              <input
                type="text"
                placeholder="Blog ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#0f0f0f] rounded-lg border border-[#333333] text-white text-sm placeholder:text-[#ebebeb] focus:border-[#3B82F6] focus:outline-none"
                style={{
                  fontFamily: 'var(--font-sans), "Inter", sans-serif',
                }}
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#0f0f0f] rounded-lg border border-[#333333] text-white text-sm focus:border-[#3B82F6] focus:outline-none"
              style={{
                fontFamily: 'var(--font-sans), "Inter", sans-serif',
              }}
            >
              <option value="all">Tüm Durumlar</option>
              <option value="draft">Taslak</option>
              <option value="queued">Kuyrukta</option>
              <option value="generating">Üretiliyor</option>
              <option value="generated">Hazır</option>
              <option value="published">Yayınlandı</option>
              <option value="failed">Başarısız</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-[#3B82F6] text-white' : 'text-[#ebebeb] hover:text-white'}
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-[#3B82F6] text-white' : 'text-[#ebebeb] hover:text-white'}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Posts View */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPosts.length > 0 ? (
              filteredPosts.map((post, index) => {
                const StatusIcon = statusIcons[post.status as keyof typeof statusIcons] || FileText;
                const statusColor = statusColors[post.status as keyof typeof statusColors] || statusColors.draft;
                const isGenerating = post.status === 'generating' || post.status === 'queued';
                const latestRevision = post.revisions && post.revisions.length > 0 ? post.revisions[0] : null;

                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="bg-[#1a1a1a] rounded-xl border border-[#333333] p-5 hover:border-[#3B82F6]/50 transition-colors flex flex-col"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3
                          className="text-base font-medium text-white mb-2 line-clamp-2"
                          style={{
                            fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
                          }}
                        >
                          {post.title}
                        </h3>
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                            {isGenerating ? (
                              <StatusIcon className="w-3 h-3 animate-spin" />
                            ) : (
                              <StatusIcon className="w-3 h-3" />
                            )}
                            {post.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4 flex-1">
                      <div className="flex items-center gap-2 text-xs text-[#ebebeb]">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(post.createdAt).toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      {post.author && (
                        <div className="flex items-center gap-2 text-xs text-[#ebebeb]">
                          <User className="w-4 h-4" />
                          <span>{post.author.name || post.author.email}</span>
                        </div>
                      )}
                      {post.workspace && (
                        <div className="flex items-center gap-2 text-xs text-[#ebebeb]">
                          <Building2 className="w-4 h-4" />
                          <span>
                            {post.workspace.name}
                            {post.workspace.owner && ` (${post.workspace.owner.name})`}
                          </span>
                        </div>
                      )}
                      {latestRevision && (
                        <>
                          {latestRevision.contentFormat && (
                            <div className="flex items-center gap-2 text-xs text-[#ebebeb]">
                              <FileText className="w-4 h-4" />
                              <span>Format: {latestRevision.contentFormat}</span>
                            </div>
                          )}
                          {latestRevision.model && (
                            <div className="flex items-center gap-2 text-xs text-[#ebebeb]">
                              <Zap className="w-4 h-4" />
                              <span>Model: {latestRevision.model}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-4 border-t border-[#333333]">
                      <Link
                        href={`/admin/blogs/${post.id}`}
                        className="flex-1"
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-[#ebebeb]/80 border-[#ebebeb]/20 hover:border-[#ebebeb]/40 hover:text-[#ebebeb] text-xs"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Görüntüle
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-8 text-sm text-[#ebebeb]">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>Blog bulunamadı</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#1a1a1a] rounded-xl border border-[#333333] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0f0f0f] border-b border-[#333333]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#ebebeb] uppercase tracking-wider">
                      Başlık
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#ebebeb] uppercase tracking-wider">
                      Durum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#ebebeb] uppercase tracking-wider">
                      Yazar
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#ebebeb] uppercase tracking-wider">
                      Workspace
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#ebebeb] uppercase tracking-wider">
                      Format
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#ebebeb] uppercase tracking-wider">
                      Model
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#ebebeb] uppercase tracking-wider">
                      Tarih
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-[#ebebeb] uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#333333]">
                  {filteredPosts.length > 0 ? (
                    filteredPosts.map((post, index) => {
                      const StatusIcon = statusIcons[post.status as keyof typeof statusIcons] || FileText;
                      const statusColor = statusColors[post.status as keyof typeof statusColors] || statusColors.draft;
                      const isGenerating = post.status === 'generating' || post.status === 'queued';
                      const latestRevision = post.revisions && post.revisions.length > 0 ? post.revisions[0] : null;

                      return (
                        <motion.tr
                          key={post.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="hover:bg-[#0f0f0f]/50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <h3
                              className="text-sm font-medium text-white line-clamp-1"
                              style={{
                                fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
                              }}
                            >
                              {post.title}
                            </h3>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                              {isGenerating ? (
                                <StatusIcon className="w-3 h-3 animate-spin" />
                              ) : (
                                <StatusIcon className="w-3 h-3" />
                              )}
                              {post.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-xs text-[#ebebeb]">
                              <User className="w-3.5 h-3.5" />
                              <span>{post.author?.name || post.author?.email || '-'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-xs text-[#ebebeb]">
                              <Building2 className="w-3.5 h-3.5" />
                              <span>
                                {post.workspace?.name || '-'}
                                {post.workspace?.owner && ` (${post.workspace.owner.name})`}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs text-[#ebebeb]">
                              {latestRevision?.contentFormat || '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs text-[#ebebeb]">
                              {latestRevision?.model || '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-xs text-[#ebebeb]">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>
                                {new Date(post.createdAt).toLocaleDateString('tr-TR', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              {post.hiddenByAdmin ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleUnhidePost(post.id)}
                                  className="text-green-400 hover:text-green-300 hover:bg-green-500/10 p-2"
                                  title="Gizlemeyi kaldır"
                                >
                                  <EyeIcon className="w-4 h-4" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleHidePost(post.id)}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2"
                                  title="Blog\'u gizle"
                                >
                                  <EyeOff className="w-4 h-4" />
                                </Button>
                              )}
                              <Link href={`/admin/blogs/${post.id}`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-[#3B82F6] hover:text-[#2563EB] hover:bg-[#3B82F6]/10 p-2"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </Link>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-sm text-[#ebebeb]">
                        <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>Blog bulunamadı</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
