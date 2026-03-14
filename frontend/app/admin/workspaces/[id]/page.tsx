'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Building2,
  ArrowLeft,
  Calendar,
  User,
  FileText,
  Globe,
  Loader2,
  AlertCircle,
  ExternalLink,
  Tag,
  Eye,
  Edit,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getAdminWorkspaceById, getAdminPosts, type Workspace, type Post } from '@/lib/api';

const statusColors = {
  draft: 'bg-gray-500/20 text-gray-400',
  queued: 'bg-yellow-500/20 text-yellow-400',
  generating: 'bg-blue-500/20 text-blue-400',
  generated: 'bg-green-500/20 text-green-400',
  failed: 'bg-red-500/20 text-red-400',
  published: 'bg-purple-500/20 text-purple-400',
};

export default function AdminWorkspaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.id as string;
  
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (workspaceId) {
      loadWorkspaceData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  const loadWorkspaceData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [workspaceData, postsData] = await Promise.all([
        getAdminWorkspaceById(workspaceId),
        getAdminPosts({ workspaceId }),
      ]);
      setWorkspace(workspaceData);
      
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
      console.error('Error loading workspace:', err);
      setError(err instanceof Error ? err.message : 'Workspace yüklenirken bir hata oluştu');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

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

  if (error || !workspace) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p className="text-red-400 mb-4">{error || 'Workspace bulunamadı'}</p>
          <Button
            onClick={() => router.push('/admin/workspaces')}
            variant="outline"
            className="text-white/80 border-[#333333] hover:border-[#3B82F6] hover:text-[#3B82F6]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri Dön
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/workspaces"
            className="inline-flex items-center gap-2 text-xs text-[#ebebeb] hover:text-white transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Workspace Listesine Dön
          </Link>
          <h1
            className="text-lg font-medium text-white mb-1 flex items-center gap-3"
            style={{
              fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
            }}
          >
            {workspace.color && (
              <div
                className="w-5 h-5 rounded-full"
                style={{ backgroundColor: workspace.color }}
              />
            )}
            {workspace.name}
          </h1>
          <p className="text-xs text-[#ebebeb]">
            Workspace detayları ve içerikleri
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333333]"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#ebebeb] mb-1">Toplam Blog</p>
              <p className="text-xl font-semibold text-white">{workspace.postsCount || posts.length}</p>
            </div>
            <FileText className="w-8 h-8 text-[#10B981] opacity-50" />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333333]"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#ebebeb] mb-1">Site Sayısı</p>
              <p className="text-xl font-semibold text-white">{workspace.sites?.length || 0}</p>
            </div>
            <Globe className="w-8 h-8 text-[#3B82F6] opacity-50" />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333333]"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#ebebeb] mb-1">Yayınlanan</p>
              <p className="text-xl font-semibold text-green-400">
                {posts.filter((p) => p.status === 'published').length}
              </p>
            </div>
            <Eye className="w-8 h-8 text-green-400 opacity-50" />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333333]"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#ebebeb] mb-1">Taslak</p>
              <p className="text-xl font-semibold text-gray-400">
                {posts.filter((p) => p.status === 'draft').length}
              </p>
            </div>
            <Edit className="w-8 h-8 text-gray-400 opacity-50" />
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workspace Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="lg:col-span-1 space-y-4"
        >
          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333333]">
            <h2
              className="text-base font-medium text-white mb-4 flex items-center gap-2"
              style={{
                fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
              }}
            >
              <Building2 className="w-5 h-5 text-[#3B82F6]" />
              Workspace Bilgileri
            </h2>
            <div className="space-y-4">
              {workspace.description && (
                <div>
                  <p className="text-xs text-[#ebebeb] mb-1">Açıklama</p>
                  <p className="text-sm text-white">{workspace.description}</p>
                </div>
              )}
              {workspace.siteUrl && (
                <div>
                  <p className="text-xs text-[#ebebeb] mb-1">Site URL</p>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#3B82F6] flex-shrink-0" />
                    <a
                      href={workspace.siteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#3B82F6] hover:text-[#2563EB] hover:underline truncate"
                      title={workspace.siteUrl}
                    >
                      {workspace.siteUrl}
                    </a>
                    <ExternalLink className="w-3.5 h-3.5 text-[#3B82F6] flex-shrink-0" />
                  </div>
                </div>
              )}
              {workspace.owner && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#ebebeb]" />
                  <div>
                    <p className="text-xs text-[#ebebeb]">Sahip</p>
                    <p className="text-sm text-white">{workspace.owner.name || workspace.owner.email}</p>
                    <p className="text-xs text-[#ebebeb]">{workspace.owner.email}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#ebebeb]" />
                <div>
                  <p className="text-xs text-[#ebebeb]">Oluşturulma</p>
                  <p className="text-sm text-white">
                    {new Date(workspace.createdAt).toLocaleDateString('tr-TR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              {workspace.sites && workspace.sites.length > 0 && (
                <div>
                  <p className="text-xs text-[#ebebeb] mb-2">Bağlı Siteler</p>
                  <div className="space-y-2">
                    {workspace.sites.map((site) => (
                      <div
                        key={site.id}
                        className="flex items-center gap-2 p-2 bg-[#0f0f0f] rounded-lg border border-[#333333]"
                      >
                        <Globe className="w-4 h-4 text-[#ebebeb]" />
                        <div className="flex-1">
                          <p className="text-sm text-white">{site.name}</p>
                          {site.domain && (
                            <p className="text-xs text-[#ebebeb]">{site.domain}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Posts List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="lg:col-span-2"
        >
          <div className="bg-[#1a1a1a] rounded-xl border border-[#333333] overflow-hidden">
            <div className="p-6 border-b border-[#333333]">
              <h2
                className="text-base font-medium text-white flex items-center gap-2"
                style={{
                  fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
                }}
              >
                <FileText className="w-5 h-5 text-[#3B82F6]" />
                Blog İçerikleri ({posts.length})
              </h2>
            </div>
            <div className="divide-y divide-[#333333]">
              {posts.length === 0 ? (
                <div className="p-12 text-center text-[#ebebeb]">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Bu workspace&apos;te henüz blog içeriği yok</p>
                </div>
              ) : (
                posts.map((post, index) => {
                  const statusColor = statusColors[post.status as keyof typeof statusColors] || statusColors.draft;
                  return (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="p-4 hover:bg-[#0f0f0f]/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                              {post.status}
                            </span>
                          </div>
                          <h3
                            className="text-sm font-medium text-white mb-1 line-clamp-1"
                            style={{
                              fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
                            }}
                          >
                            {post.title}
                          </h3>
                          {post.excerpt && (
                            <p className="text-xs text-[#ebebeb] mb-2 line-clamp-2">
                              {post.excerpt}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-[#ebebeb]">
                            {post.author && (
                              <div className="flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5" />
                                <span>{post.author.name || post.author.email}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>
                                {new Date(post.createdAt).toLocaleDateString('tr-TR', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>
                            {post.tags && post.tags.length > 0 && (
                              <div className="flex items-center gap-1.5">
                                <Tag className="w-3.5 h-3.5" />
                                <span>{post.tags.length} etiket</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Link href={`/admin/blogs?postId=${post.id}`} className="ml-4 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[#3B82F6] hover:text-[#2563EB] hover:bg-[#3B82F6]/10 p-2"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

