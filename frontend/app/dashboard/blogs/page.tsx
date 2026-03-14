'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { FileText, Search, Filter, MoreVertical, Eye, Edit, Trash2, Download, Copy, Calendar, Loader2, AlertCircle, Grid3x3, List, Globe, FileX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { BlogCardSkeleton, StatsCardSkeleton } from '@/components/ui/skeleton';
import { getPosts, deletePost, getWorkspaces, publishPost, unpublishPost, type Post, type Workspace } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/auth';

interface Blog {
  id: string;
  title: string;
  excerpt?: string;
  tags: Array<{ id: string; name: string; slug: string }>;
  status: string;
  createdAt: string;
  updatedAt: string;
  contentLength?: number;
  format?: string;
  model?: string;
  content?: string; // For preview
  coverImageUrl?: string;
}

function BlogsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | 'Tümü'>('Tümü');
  const [selectedBlog, setSelectedBlog] = useState<string | null>(null);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  // Load workspaces first, then set workspaceId from URL or first workspace
  useEffect(() => {
    const initWorkspaces = async () => {
      await loadWorkspaces();
      const urlWorkspaceId = searchParams.get('workspaceId');
      if (urlWorkspaceId) {
        setWorkspaceId(urlWorkspaceId);
        setSelectedWorkspaceId(urlWorkspaceId);
      } else if (workspaces.length > 0) {
        // If no URL param, use first workspace
        setWorkspaceId(workspaces[0].id);
        setSelectedWorkspaceId(workspaces[0].id);
      }
    };
    initWorkspaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload posts when workspaceId changes
  useEffect(() => {
    if (workspaceId !== null) {
      loadPosts();
      // Update URL without reload
      const newUrl = workspaceId 
        ? `/dashboard/blogs?workspaceId=${workspaceId}`
        : '/dashboard/blogs';
      router.replace(newUrl, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  const loadWorkspaces = async () => {
    try {
      const ws = await getWorkspaces();
      setWorkspaces(ws);
      // If no workspace selected and workspaces exist, select first one
      if (!workspaceId && ws.length > 0) {
        setWorkspaceId(ws[0].id);
        setSelectedWorkspaceId(ws[0].id);
      }
    } catch (err) {
      console.error('Failed to load workspaces:', err);
    }
  };

  // Auto-refresh posts that are queued or generating
  useEffect(() => {
    const hasActivePosts = blogs.some(blog => blog.status === 'queued' || blog.status === 'generating');
    
    if (!hasActivePosts) {
      return;
    }

    const interval = setInterval(() => {
      loadPosts();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blogs]);

  const loadPosts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const posts = await getPosts(workspaceId || undefined);
      
      // Transform posts to Blog format
      const transformedBlogs: Blog[] = posts.map((post: Post) => {
        const latestRevision = post.revisions && post.revisions.length > 0 
          ? post.revisions[post.revisions.length - 1] 
          : null;
        
        return {
          id: post.id,
          title: post.title,
          excerpt: post.excerpt || undefined,
          tags: post.tags || [],
          status: post.status,
          createdAt: new Date(post.createdAt).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          updatedAt: new Date(post.updatedAt).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          contentLength: latestRevision?.content?.length || 0,
          format: latestRevision?.contentFormat || 'markdown',
          model: latestRevision?.model || undefined,
          content: latestRevision?.content || undefined, // For preview
          coverImageUrl: post.coverImageUrl || undefined,
        };
      });
      
      setBlogs(transformedBlogs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bloglar yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (blogId: string) => {
    if (!confirm('Bu blogu silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      await deletePost(blogId);
      // Reload posts to ensure UI is in sync
      await loadPosts();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Blog silinirken bir hata oluştu');
    }
  };

  const handleTogglePublish = async (blogId: string, currentStatus: string) => {
    try {
      if (currentStatus === 'published') {
        await unpublishPost(blogId);
      } else if (currentStatus === 'draft' || currentStatus === 'generated') {
        await publishPost(blogId);
      }
      // Reload posts to reflect the change
      await loadPosts();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Blog durumu değiştirilirken bir hata oluştu');
    }
  };

  // Tüm etiketleri topla
  const allTags = Array.from(
    new Set(blogs.flatMap((blog) => blog.tags.map((tag) => tag.name)))
  ).sort();

  const filteredBlogs = blogs.filter((blog) => {
    const matchesSearch =
      blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (blog.excerpt && blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase())) ||
      blog.tags.some((tag) => tag.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter =
      selectedTag === 'Tümü' || blog.tags.some((tag) => tag.name === selectedTag);
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      queued: { label: 'Kuyruğa Eklendi', color: 'bg-yellow-100 text-yellow-700' },
      generating: { label: 'Üretiliyor...', color: 'bg-blue-100 text-blue-700' },
      generated: { label: 'Hazır', color: 'bg-green-100 text-green-700' },
      failed: { label: 'Başarısız', color: 'bg-red-100 text-red-700' },
      draft: { label: 'Taslak', color: 'bg-gray-100 text-gray-700' },
      published: { label: 'Yayınlandı', color: 'bg-green-100 text-green-700' },
    };

    const statusInfo = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  const getTagColor = (tag: string) => {
    const colors = [
      'bg-blue-100 text-blue-700',
      'bg-green-100 text-green-700',
      'bg-purple-100 text-purple-700',
      'bg-orange-100 text-orange-700',
      'bg-pink-100 text-pink-700',
      'bg-indigo-100 text-indigo-700',
      'bg-yellow-100 text-yellow-700',
      'bg-red-100 text-red-700',
    ];
    const index = tag.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const renderContentPreview = (content: string | undefined, format: string | undefined) => {
    if (!content) return null;

    try {
      const formatLower = format?.toLowerCase() || 'markdown';
      
      // Helper to extract text from markdown/HTML
      const extractText = (text: string): string => {
        // Remove markdown syntax
        let clean = text
          .replace(/^#{1,6}\s+/gm, '') // Headers
          .replace(/\*\*(.+?)\*\*/g, '$1') // Bold
          .replace(/\*(.+?)\*/g, '$1') // Italic
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
          .replace(/`([^`]+)`/g, '$1') // Inline code
          .replace(/```[\s\S]*?```/g, '') // Code blocks
          .replace(/<[^>]*>/g, '') // HTML tags
          .replace(/\n+/g, ' ') // Newlines to spaces
          .trim();
        return clean.substring(0, 200);
      };
      
      if (formatLower === 'json') {
        // Parse JSON and extract preview text
        try {
          const parsed = JSON.parse(content);
          if (typeof parsed === 'object' && parsed !== null) {
            // Try to find text content in JSON structure
            const textContent = parsed.intro || parsed.body || parsed.content || parsed.content_markdown || parsed.content_html || parsed.title || '';
            const preview = typeof textContent === 'string' 
              ? extractText(textContent)
              : (parsed.title || JSON.stringify(parsed, null, 2).substring(0, 200));
            return (
              <div className="text-xs text-[#666666] line-clamp-3 bg-[#f9fafb] p-2 rounded border border-[#e5e5e5]">
                {preview}
              </div>
            );
          }
        } catch {
          // If JSON parsing fails, treat as text
          return (
            <div className="text-xs text-[#666666] line-clamp-3 bg-[#f9fafb] p-2 rounded border border-[#e5e5e5]">
              {extractText(content)}
            </div>
          );
        }
      } else if (formatLower === 'html') {
        // Strip HTML tags for preview
        const textContent = extractText(content);
        return (
          <div className="text-xs text-[#666666] line-clamp-3 bg-[#f9fafb] p-2 rounded border border-[#e5e5e5]">
            {textContent}
          </div>
        );
      } else {
        // Markdown or other text formats
        const preview = extractText(content);
        return (
          <div className="text-xs text-[#666666] line-clamp-3 bg-[#f9fafb] p-2 rounded border border-[#e5e5e5]">
            {preview}
          </div>
        );
      }
    } catch (err) {
      // If parsing fails, show raw content preview
      return (
        <div className="text-xs text-[#666666] line-clamp-3 bg-[#f9fafb] p-2 rounded border border-[#e5e5e5]">
          {content.substring(0, 200)}
        </div>
      );
    }
  };

  return (
    <div className="space-y-5">
      {/* Header with Action Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-4"
      >
        {/* Top Row: Search and Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1 w-full sm:w-auto">
            {/* Search Bar */}
            {workspaceId && (
              <div className="rounded-2xl p-4 border border-[#e5e5e5]">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
                    <input
                      type="text"
                      placeholder="Bloglarımda ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 text-sm bg-[#f5f5f5] rounded-lg border border-transparent focus:border-[#203eec] focus:bg-white focus:outline-none transition-all"
                      style={{
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-[#666666]" />
                    <select
                      value={selectedTag}
                      onChange={(e) => setSelectedTag(e.target.value)}
                      className="px-3 py-2 text-sm bg-[#f5f5f5] rounded-lg border border-transparent focus:border-[#203eec] focus:outline-none transition-all"
                      style={{
                      }}
                    >
                      <option value="Tümü">Tüm Etiketler</option>
                      {allTags.map((tag) => (
                        <option key={tag} value={tag}>
                          {tag}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex-shrink-0">
            <Link href="/dashboard/generate">
              <Button className="bg-[#203eec] hover:bg-[#1a32cc] text-white rounded-full px-6 py-2.5 text-sm font-medium shadow-lg shadow-[#203eec]/20 hover:shadow-xl hover:shadow-[#203eec]/30 transition-all duration-200">
                <FileText className="w-4 h-4 mr-2" />
                Yeni Blog Oluştur
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Workspace Selector */}
      {workspaces.length > 0 && workspaceId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl p-4 border border-[#e5e5e5]"
        >
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-[#666666]" />
            <label className="text-sm font-medium text-[#202020] whitespace-nowrap">Workspace:</label>
            <select
              value={selectedWorkspaceId || ''}
              onChange={(e) => {
                const wsId = e.target.value || null;
                setSelectedWorkspaceId(wsId);
                setWorkspaceId(wsId);
                if (wsId) {
                  router.push(`/dashboard/blogs?workspaceId=${wsId}`);
                }
              }}
              className="flex-1 px-3 py-2 text-sm bg-[#f5f5f5] rounded-lg border border-transparent focus:border-[#203eec] focus:outline-none transition-all"
              style={{
              }}
            >
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name}
                </option>
              ))}
            </select>
          </div>
        </motion.div>
      )}

      {/* Workspace Warning */}
      {workspaces.length === 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="bg-yellow-50 border border-yellow-200 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3
                className="text-sm font-medium text-yellow-900 mb-1"
                style={{
                }}
              >
                Workspace Bulunamadı
              </h3>
              <p
                className="text-xs text-yellow-700 mb-3"
                style={{
                }}
              >
                Blog görüntülemek için önce bir workspace oluşturmanız gerekiyor.
              </p>
              <Link href="/dashboard/workspaces">
                <Button className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs">
                  Workspace Oluştur
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      )}


      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-2xl p-5 border border-[#e5e5e5]"
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
          <p
            className="text-xl font-semibold text-[#202020] mb-1"
            style={{
            }}
          >
            {blogs.length}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-2xl p-5 border border-[#e5e5e5]"
        >
          <div className="flex items-center justify-between mb-3">
            <span
              className="text-xs text-[#666666]"
              style={{
              }}
            >
              Toplam Etiket
            </span>
            <Filter className="w-5 h-5 text-[#10B981]" />
          </div>
          <p
            className="text-xl font-semibold text-[#202020] mb-1"
            style={{
            }}
          >
            {allTags.length}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="rounded-2xl p-5 border border-[#e5e5e5]"
        >
          <div className="flex items-center justify-between mb-3">
            <span
              className="text-xs text-[#666666]"
              style={{
              }}
            >
              Toplam Görüntülenme
            </span>
            <Eye className="w-5 h-5 text-[#203eec]" />
          </div>
          <p
            className="text-xl font-semibold text-[#202020] mb-1"
            style={{
            }}
          >
            -
          </p>
        </motion.div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Hata</p>
            <p>{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={loadPosts}
              className="mt-2 border-red-200 text-red-600 hover:bg-red-100"
            >
              Tekrar Dene
            </Button>
          </div>
        </div>
      )}

      {/* Blog List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="rounded-2xl border border-[#e5e5e5] overflow-hidden"
      >
        {/* View Mode Toggle */}
        {!isLoading && filteredBlogs.length > 0 && (
          <div className="p-3 sm:p-4 border-b border-[#e5e5e5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h2
              className="text-base sm:text-lg font-medium text-[#202020]"
              style={{
              }}
            >
              Bloglarım ({filteredBlogs.length})
            </h2>
            <div className="flex items-center gap-1 border border-[#e5e5e5] rounded-lg p-0.5">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'bg-[#203eec] text-white hover:bg-[#1a32cc]' : 'hover:bg-[#f5f5f5]'}
              >
                <Grid3x3 className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-[#203eec] text-white hover:bg-[#1a32cc]' : 'hover:bg-[#f5f5f5]'}
              >
                <List className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
        {isLoading ? (
          <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[...Array(6)].map((_, i) => (
              <BlogCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="p-10 text-center">
            <FileText className="w-12 h-12 mx-auto mb-3 text-[#999999] opacity-50" />
            <p
              className="text-base text-[#666666] mb-1.5"
              style={{
              }}
            >
              {blogs.length === 0 ? 'Henüz blog oluşturulmamış' : 'Blog bulunamadı'}
            </p>
            <p
              className="text-xs text-[#999999] mb-4"
              style={{
              }}
            >
              {blogs.length === 0
                ? 'İlk blogunu oluşturmak için "Yeni Blog Oluştur" butonuna tıkla'
                : 'Arama kriterlerinizi değiştirip tekrar deneyin'}
            </p>
            {blogs.length === 0 && (
              <Link href="/dashboard/generate">
                <Button className="bg-[#203eec] hover:bg-[#1a32cc] text-white">
                  <FileText className="w-4 h-4 mr-2" />
                  Yeni Blog Oluştur
                </Button>
              </Link>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredBlogs.map((blog, index) => (
              <motion.div
                key={blog.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="group relative bg-white border border-[#e5e5e5] rounded-xl overflow-hidden hover:shadow-lg hover:border-[#203eec] transition-all flex flex-col h-full"
              >
                {/* Cover Image */}
                {blog.coverImageUrl && (
                  <div className="relative w-full h-40 sm:h-48 overflow-hidden">
                    <Image
                      src={blog.coverImageUrl}
                      alt={blog.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="p-4 sm:p-5 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-sm sm:text-base font-semibold text-[#202020] mb-2 sm:mb-3 group-hover:text-[#203eec] transition-colors line-clamp-2"
                      style={{
                      }}
                    >
                      {blog.title}
                    </h3>
                  </div>
                  <div className="relative ml-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-[#f5f5f5]"
                      onClick={() => setSelectedBlog(selectedBlog === blog.id ? null : blog.id)}
                    >
                      <MoreVertical className="w-4 h-4 text-[#666666]" />
                    </Button>
                    {selectedBlog === blog.id && (
                      <div className="absolute right-0 top-full mt-1.5 w-40 sm:w-48 bg-white rounded-lg shadow-lg border border-[#e5e5e5] z-10">
                        <Link
                          href={`/dashboard/blogs/${blog.id}`}
                          className="w-full px-3 py-1.5 text-left text-xs text-[#202020] hover:bg-[#f5f5f5] flex items-center gap-1.5 block"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Görüntüle
                        </Link>
                        {(blog.status === 'draft' || blog.status === 'generated') && (
                          <button
                            onClick={() => {
                              handleTogglePublish(blog.id, blog.status);
                              setSelectedBlog(null);
                            }}
                            className="w-full px-3 py-1.5 text-left text-xs text-green-600 hover:bg-green-50 flex items-center gap-1.5"
                          >
                            <Globe className="w-3.5 h-3.5" />
                            Yayınla
                          </button>
                        )}
                        {blog.status === 'published' && (
                          <button
                            onClick={() => {
                              handleTogglePublish(blog.id, blog.status);
                              setSelectedBlog(null);
                            }}
                            className="w-full px-3 py-1.5 text-left text-xs text-orange-600 hover:bg-orange-50 flex items-center gap-1.5"
                          >
                            <FileX className="w-3.5 h-3.5" />
                            Taslağa Al
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(blog.id)}
                          className="w-full px-3 py-1.5 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Sil
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col justify-between">
                  <div className="space-y-2 mb-4">
                    {/* Content Preview */}
                    {blog.content && blog.status !== 'queued' && blog.status !== 'generating' && (
                      <div className="mb-3">
                        {renderContentPreview(blog.content, blog.format)}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-[#666666]">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{blog.createdAt}</span>
                    </div>
                    {blog.contentLength !== undefined && blog.contentLength > 0 && (
                      <div className="flex items-center gap-2 text-xs text-[#666666]">
                        <FileText className="w-3.5 h-3.5" />
                        <span>{blog.contentLength.toLocaleString('tr-TR')} karakter</span>
                      </div>
                    )}
                    {blog.model && (
                      <div className="flex items-center gap-2 text-xs text-[#666666]">
                        <span className="px-2 py-0.5 rounded-full bg-[#203eec]/10 text-[#203eec] font-medium">
                          {blog.model}
                        </span>
                      </div>
                    )}
                  </div>
                  
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 pt-3 sm:pt-4 border-t border-[#e5e5e5]">
                    <div className="flex items-center gap-1">
                      {getStatusBadge(blog.status)}
                    </div>
                    <Link href={`/dashboard/blogs/${blog.id}`} className="w-full sm:w-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs hover:bg-[#203eec]/10 hover:text-[#203eec] w-full sm:w-auto"
                      >
                        <Eye className="w-3.5 h-3.5 sm:mr-1" />
                        <span className="hidden sm:inline">Görüntüle</span>
                      </Button>
                    </Link>
                  </div>
                </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-[#e5e5e5]">
            {filteredBlogs.map((blog, index) => (
              <motion.div
                key={blog.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="p-5 hover:bg-[#fafafa] transition-colors group relative"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  {blog.coverImageUrl && (
                    <div className="relative w-full sm:w-32 h-32 sm:h-24 rounded-lg overflow-hidden flex-shrink-0 sm:mr-4">
                      <Image
                        src={blog.coverImageUrl}
                        alt={blog.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 128px"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-sm sm:text-base font-medium text-[#202020] mb-2 sm:mb-3 group-hover:text-[#203eec] transition-colors"
                      style={{
                      }}
                    >
                      {blog.title}
                    </h3>
                    
                    {/* Content Preview for List View */}
                    {blog.content && blog.status !== 'queued' && blog.status !== 'generating' && (
                      <div className="mb-2 sm:mb-3">
                        {renderContentPreview(blog.content, blog.format)}
                      </div>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <div className="flex items-center gap-1.5 text-xs text-[#666666]">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{blog.createdAt}</span>
                      </div>
                      {blog.contentLength !== undefined && blog.contentLength > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-[#666666]">
                          <FileText className="w-3.5 h-3.5" />
                          <span>{blog.contentLength.toLocaleString('tr-TR')} karakter</span>
                        </div>
                      )}
                      {blog.model && (
                        <span className="px-2 py-0.5 rounded-full bg-[#203eec]/10 text-[#203eec] font-medium text-xs">
                          {blog.model}
                        </span>
                      )}
                      {getStatusBadge(blog.status)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Link href={`/dashboard/blogs/${blog.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[#e5e5e5] hover:border-[#203eec] hover:text-[#203eec] h-8 w-8 p-0"
                        title="Görüntüle"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                    <Link href={`/dashboard/blogs/${blog.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[#e5e5e5] hover:border-[#203eec] hover:text-[#203eec] h-8 w-8 p-0 hidden sm:flex"
                        title="Düzenle"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                    <div className="relative">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[#e5e5e5] hover:border-[#203eec] hover:text-[#203eec] h-8 w-8 p-0"
                        onClick={() => setSelectedBlog(selectedBlog === blog.id ? null : blog.id)}
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </Button>
                      {selectedBlog === blog.id && (
                        <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-lg shadow-lg border border-[#e5e5e5] z-10">
                          <Link
                            href={`/dashboard/blogs/${blog.id}`}
                            className="w-full px-3 py-1.5 text-left text-xs text-[#202020] hover:bg-[#f5f5f5] flex items-center gap-1.5 block"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Görüntüle
                          </Link>
                          {(blog.status === 'draft' || blog.status === 'generated') && (
                            <button
                              onClick={() => {
                                handleTogglePublish(blog.id, blog.status);
                                setSelectedBlog(null);
                              }}
                              className="w-full px-3 py-1.5 text-left text-xs text-green-600 hover:bg-green-50 flex items-center gap-1.5"
                            >
                              <Globe className="w-3.5 h-3.5" />
                              Yayınla
                            </button>
                          )}
                          {blog.status === 'published' && (
                            <button
                              onClick={() => {
                                handleTogglePublish(blog.id, blog.status);
                                setSelectedBlog(null);
                              }}
                              className="w-full px-3 py-1.5 text-left text-xs text-orange-600 hover:bg-orange-50 flex items-center gap-1.5"
                            >
                              <FileX className="w-3.5 h-3.5" />
                              Taslağa Al
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(blog.id)}
                            className="w-full px-3 py-1.5 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Sil
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function BlogsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--background)] p-8">
        <div className="max-w-7xl mx-auto">
          <BlogCardSkeleton />
        </div>
      </div>
    }>
      <BlogsPageContent />
    </Suspense>
  );
}

