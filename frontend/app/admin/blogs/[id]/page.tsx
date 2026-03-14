'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  FileText,
  Calendar,
  User,
  Building2,
  Tag,
  Eye,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Globe,
  Zap,
  Copy,
  Download,
  Hash,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAdminPostById, type Post } from '@/lib/api';

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

export default function AdminBlogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRevisionIndex, setSelectedRevisionIndex] = useState<number>(0);

  useEffect(() => {
    if (postId) {
      loadPost();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const loadPost = async () => {
    try {
      setLoading(true);
      setError(null);
      const postData = await getAdminPostById(postId);
      setPost(postData);
      // En son revision'ı seç
      if (postData.revisions && postData.revisions.length > 0) {
        setSelectedRevisionIndex(0);
      }
    } catch (err) {
      console.error('Error loading post:', err);
      setError(err instanceof Error ? err.message : 'Blog yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyContent = () => {
    const selectedRevision = post?.revisions?.[selectedRevisionIndex];
    if (selectedRevision?.content) {
      navigator.clipboard.writeText(selectedRevision.content);
      // Toast notification could be added here
    }
  };

  const handleDownloadContent = () => {
    const selectedRevision = post?.revisions?.[selectedRevisionIndex];
    if (selectedRevision?.content) {
      const blob = new Blob([selectedRevision.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${post?.title || 'blog'}-${selectedRevisionIndex + 1}.${selectedRevision.contentFormat || 'txt'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
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

  if (error || !post) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-[#ebebeb]/80 hover:text-[#ebebeb]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-400 mb-1">Hata</h3>
              <p className="text-xs text-[#ebebeb]">{error || 'Blog bulunamadı'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const StatusIcon = statusIcons[post.status as keyof typeof statusIcons] || FileText;
  const statusColor = statusColors[post.status as keyof typeof statusColors] || statusColors.draft;
  const isGenerating = post.status === 'generating' || post.status === 'queued';
  const selectedRevision = post.revisions?.[selectedRevisionIndex];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/blogs')}
            className="text-[#ebebeb]/80 hover:text-[#ebebeb]"
          >
            <ArrowLeft className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Geri</span>
          </Button>
          <h1
            className="text-lg sm:text-xl font-medium text-white"
            style={{
              fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
            }}
          >
            Blog Detayı
          </h1>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium ${statusColor}`}>
            {isGenerating ? (
              <StatusIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
            ) : (
              <StatusIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            )}
            <span className="hidden sm:inline">{post.status}</span>
            <span className="sm:hidden">{post.status.substring(0, 4)}</span>
          </span>
        </div>
      </motion.div>

      {/* Post Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-[#1a1a1a] rounded-xl border border-[#333333] p-4 sm:p-6"
      >
        <h2
          className="text-base sm:text-lg font-medium text-white mb-4"
          style={{
            fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
          }}
        >
          {post.title}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
          <div className="flex items-center gap-2 text-xs text-[#ebebeb]">
            <Hash className="w-4 h-4" />
            <span>ID: {post.id}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#ebebeb]">
            <Calendar className="w-4 h-4" />
            <span>
              Oluşturulma: {new Date(post.createdAt).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#ebebeb]">
            <Calendar className="w-4 h-4" />
            <span>
              Güncellenme: {new Date(post.updatedAt).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          {post.author && (
            <div className="flex items-center gap-2 text-xs text-[#ebebeb]">
              <User className="w-4 h-4" />
              <span>
                Yazar: {post.author.name || post.author.email}
                {post.author.id && ` (${post.author.id.substring(0, 8)}...)`}
              </span>
            </div>
          )}
          {post.workspace && (
            <div className="flex items-center gap-2 text-xs text-[#ebebeb]">
              <Building2 className="w-4 h-4" />
              <span>
                Workspace: {post.workspace.name}
                {post.workspace.owner && ` (${post.workspace.owner.name})`}
              </span>
            </div>
          )}
          {post.slug && (
            <div className="flex items-center gap-2 text-xs text-[#ebebeb]">
              <Globe className="w-4 h-4" />
              <span>Slug: {post.slug}</span>
            </div>
          )}
          {post.language && (
            <div className="flex items-center gap-2 text-xs text-[#ebebeb]">
              <Globe className="w-4 h-4" />
              <span>Dil: {post.language}</span>
            </div>
          )}
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Tag className="w-4 h-4 text-[#ebebeb]" />
            {post.tags.map((tag) => (
              <span
                key={tag.id}
                className="px-2.5 py-1 rounded-full text-xs bg-[#333333] text-[#ebebeb]/80"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {post.excerpt && (
          <div className="mb-4">
            <p className="text-sm text-[#ebebeb]/80 leading-relaxed">{post.excerpt}</p>
          </div>
        )}
      </motion.div>

      {/* Revisions */}
      {post.revisions && post.revisions.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-[#1a1a1a] rounded-xl border border-[#333333] p-6"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-2 mb-4">
            <h3
              className="text-sm sm:text-base font-medium text-white"
              style={{
                fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
              }}
            >
              Versiyonlar ({post.revisions.length})
            </h3>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyContent}
                className="text-[#ebebeb]/80 border-[#ebebeb]/20 hover:border-[#ebebeb]/40 hover:text-[#ebebeb] text-xs flex-1 sm:flex-initial"
              >
                <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline">Kopyala</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadContent}
                className="text-[#ebebeb]/80 border-[#ebebeb]/20 hover:border-[#ebebeb]/40 hover:text-[#ebebeb] text-xs flex-1 sm:flex-initial"
              >
                <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline">İndir</span>
              </Button>
            </div>
          </div>

          {/* Revision Selector */}
          {post.revisions.length > 1 && (
            <div className="mb-4">
              <select
                value={selectedRevisionIndex}
                onChange={(e) => setSelectedRevisionIndex(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#0f0f0f] rounded-lg border border-[#333333] text-white text-sm focus:border-[#3B82F6] focus:outline-none"
              >
                {post.revisions?.map((revision, index) => {
                  // Versiyon numarasını hesapla (en yeni versiyon v1, en eski vN)
                  const versionNumber = (post.revisions?.length || 0) - index;
                  return (
                    <option key={revision.id} value={index}>
                      v{versionNumber} - {new Date(revision.createdAt).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {revision.contentFormat && ` (${revision.contentFormat.toUpperCase()})`}
                      {revision.model && ` - ${revision.model}`}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Selected Revision Info */}
          {selectedRevision && (
            <div className="mb-4 p-4 bg-[#0f0f0f] rounded-lg border border-[#333333]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-[#ebebeb]">
                {selectedRevision.contentFormat && (
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>Format: {selectedRevision.contentFormat.toUpperCase()}</span>
                  </div>
                )}
                {selectedRevision.model && (
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    <span>Model: {selectedRevision.model}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(selectedRevision.createdAt).toLocaleDateString('tr-TR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Content Display */}
          {selectedRevision && selectedRevision.content && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-white">İçerik Önizlemesi</h4>
              <div className="bg-[#0f0f0f] rounded-lg border border-[#333333] p-4 sm:p-6 lg:p-8 max-h-[600px] sm:max-h-[800px] overflow-y-auto">
                <div className="prose prose-invert prose-lg max-w-none">
                  {selectedRevision.contentFormat === 'html' ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: selectedRevision.content }}
                      className="text-[#ebebeb]/90 leading-relaxed"
                      style={{
                        fontFamily: 'var(--font-sans), "Inter", sans-serif',
                      }}
                    />
                  ) : (
                    <div
                      dangerouslySetInnerHTML={{ 
                        __html: selectedRevision.content
                          .replace(/^### (.*$)/gim, '<h3 class="text-2xl font-semibold mt-6 mb-3 text-[#ebebeb]">$1</h3>')
                          .replace(/^## (.*$)/gim, '<h2 class="text-3xl font-semibold mt-8 mb-4 text-[#ebebeb]">$1</h2>')
                          .replace(/^# (.*$)/gim, '<h1 class="text-4xl font-bold mt-8 mb-4 text-[#ebebeb]">$1</h1>')
                          .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
                          .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
                          .replace(/^- (.*$)/gim, '<li class="ml-4 mb-2 text-[#ebebeb]">• $1</li>')
                          .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 mb-2 text-[#ebebeb]">$1</li>')
                          .replace(/\n/g, '<br />')
                      }}
                      className="text-[#ebebeb]/90 leading-relaxed"
                      style={{
                        fontFamily: 'var(--font-sans), "Inter", sans-serif',
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-[#1a1a1a] rounded-xl border border-[#333333] p-6"
        >
          <div className="text-center py-8">
            <FileText className="w-12 h-12 mx-auto mb-3 text-[#ebebeb]" />
            <p className="text-sm text-[#ebebeb]">Henüz versiyon bulunmuyor</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

