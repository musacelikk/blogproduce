'use client';

import { useState, useEffect, Suspense } from 'react';
import { FileText, Search, Filter, MoreVertical, Eye, Edit, Trash2, Calendar, AlertCircle, Grid3x3, List, Globe, FileX, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input, fieldClasses } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { getPosts, deletePost, getWorkspaces, publishPost, unpublishPost, type Post, type Workspace } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';

interface Blog {
  id: string;
  title: string;
  excerpt?: string;
  tags: Array<{ id: string; name: string; slug: string }>;
  status: string;
  createdAt: string;
  updatedAt: string;
  scheduledAt?: string;
  publishedAt?: string;
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
          ? [...post.revisions].sort((a, b) => b.version - a.version)[0]
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
          scheduledAt: post.scheduledAt || undefined,
          publishedAt: post.publishedAt || undefined,
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
      } else if (currentStatus === 'draft' || currentStatus === 'generated' || currentStatus === 'scheduled') {
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


  const statusMap: Record<string, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'destructive' | 'info' | 'outline' }> = {
    queued:     { label: 'Kuyruğa Eklendi', variant: 'warning' },
    generating: { label: 'Üretiliyor...',   variant: 'info' },
    generated:  { label: 'Hazır',           variant: 'success' },
    failed:     { label: 'Başarısız',       variant: 'destructive' },
    draft:      { label: 'Taslak',          variant: 'outline' },
    published:  { label: 'Yayınlandı',      variant: 'primary' },
    scheduled:  { label: 'Zamanlandı',      variant: 'default' },
  };

  const getStatusBadge = (status: string, scheduledAt?: string) => {
    const statusInfo = statusMap[status] || { label: status, variant: 'outline' as const };
    const isScheduled = status === 'scheduled' && scheduledAt;
    return (
      <Badge variant={statusInfo.variant} className={isScheduled ? 'flex-col items-start' : undefined}>
        {statusInfo.label}
        {isScheduled && (
          <span className="text-[10px] font-normal opacity-80">
            {new Date(scheduledAt).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </Badge>
    );
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
              <div className="line-clamp-3 rounded-lg border border-border bg-surface-sunken p-2.5 text-xs leading-relaxed text-muted-foreground">
                {preview}
              </div>
            );
          }
        } catch {
          // If JSON parsing fails, treat as text
          return (
            <div className="line-clamp-3 rounded-lg border border-border bg-surface-sunken p-2.5 text-xs leading-relaxed text-muted-foreground">
              {extractText(content)}
            </div>
          );
        }
      } else if (formatLower === 'html') {
        // Strip HTML tags for preview
        const textContent = extractText(content);
        return (
          <div className="line-clamp-3 rounded-lg border border-border bg-surface-sunken p-2.5 text-xs leading-relaxed text-muted-foreground">
            {textContent}
          </div>
        );
      } else {
        // Markdown or other text formats
        const preview = extractText(content);
        return (
          <div className="line-clamp-3 rounded-lg border border-border bg-surface-sunken p-2.5 text-xs leading-relaxed text-muted-foreground">
            {preview}
          </div>
        );
      }
    } catch (err) {
      // If parsing fails, show raw content preview
      return (
        <div className="line-clamp-3 rounded-lg border border-border bg-secondary p-2 text-xs text-muted-foreground">
          {content.substring(0, 200)}
        </div>
      );
    }
  };

  const dropdownItemClass =
    'flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors';

  const renderActionsMenu = (blog: Blog) => (
    <div className="absolute right-0 top-full z-20 mt-1.5 w-44 overflow-hidden rounded-lg border border-border bg-card shadow-elevated">
      <Link
        href={`/dashboard/blogs/${blog.id}`}
        className={`${dropdownItemClass} text-foreground hover:bg-secondary`}
      >
        <Eye className="h-3.5 w-3.5" />
        Görüntüle
      </Link>
      {(blog.status === 'draft' || blog.status === 'generated' || blog.status === 'scheduled') && (
        <button
          onClick={() => {
            handleTogglePublish(blog.id, blog.status);
            setSelectedBlog(null);
          }}
          className={`${dropdownItemClass} text-success hover:bg-success-muted`}
        >
          <Globe className="h-3.5 w-3.5" />
          {blog.status === 'scheduled' ? 'Şimdi Yayınla' : 'Yayınla'}
        </button>
      )}
      {blog.status === 'published' && (
        <button
          onClick={() => {
            handleTogglePublish(blog.id, blog.status);
            setSelectedBlog(null);
          }}
          className={`${dropdownItemClass} text-warning hover:bg-warning-muted`}
        >
          <FileX className="h-3.5 w-3.5" />
          Taslağa Al
        </button>
      )}
      <button
        onClick={() => handleDelete(blog.id)}
        className={`${dropdownItemClass} text-destructive hover:bg-[var(--destructive-muted)]`}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Sil
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="İçerik"
        title="Bloglarım"
        description="Tüm blog içeriklerinizi buradan yönetin"
        actions={
          <Button asChild>
            <Link href="/dashboard/generate">
              <Sparkles />
              Yeni Blog Üret
            </Link>
          </Button>
        }
      />

      {/* Filters */}
      {workspaceId && (
        <Card className="p-4 shadow-card">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            {workspaces.length > 0 && (
              <div className="flex items-center gap-2 lg:w-64">
                <label htmlFor="workspaceFilter" className="whitespace-nowrap text-sm font-medium text-foreground">
                  Workspace
                </label>
                <select
                  id="workspaceFilter"
                  value={selectedWorkspaceId || ''}
                  onChange={(e) => {
                    const wsId = e.target.value || null;
                    setSelectedWorkspaceId(wsId);
                    setWorkspaceId(wsId);
                    if (wsId) {
                      router.push(`/dashboard/blogs?workspaceId=${wsId}`);
                    }
                  }}
                  className={cn(fieldClasses, 'block h-10 flex-1')}
                >
                  {workspaces.map((ws) => (
                    <option key={ws.id} value={ws.id}>
                      {ws.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Bloglarımda ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                aria-label="Bloglarımda ara"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                aria-label="Etikete göre filtrele"
                className={cn(fieldClasses, 'block h-10 w-auto')}
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
        </Card>
      )}

      {/* Workspace Warning */}
      {workspaces.length === 0 && !isLoading && (
        <div className="rounded-xl border border-border bg-warning-muted p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
            <div>
              <h3 className="mb-1 text-sm font-semibold text-foreground">Workspace Bulunamadı</h3>
              <p className="mb-3 text-xs text-muted-foreground">
                Blog görüntülemek için önce bir workspace oluşturmanız gerekiyor.
              </p>
              <Button asChild size="sm">
                <Link href="/dashboard/workspaces">Workspace Oluştur</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <StatCard
          label="Toplam Blog"
          value={blogs.length}
          icon={<FileText />}
          hint={`${blogs.filter((b) => b.status === 'published').length} yayında`}
        />
        <StatCard
          label="Toplam Etiket"
          value={allTags.length}
          icon={<Filter />}
          hint="benzersiz etiket"
        />
        <StatCard
          label="Yayınlanan"
          value={blogs.filter((b) => b.status === 'published').length}
          icon={<Eye />}
          hint="aktif yayın"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-border bg-[var(--destructive-muted)] p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Hata</p>
            <p>{error}</p>
            <Button variant="outline" size="sm" onClick={loadPosts} className="mt-2">
              Tekrar Dene
            </Button>
          </div>
        </div>
      )}

      {/* Blog List */}
      <Card className="overflow-hidden shadow-card">
        {/* View Mode Toggle */}
        {!isLoading && filteredBlogs.length > 0 && (
          <div className="flex flex-col items-start justify-between gap-3 border-b border-border bg-surface-raised px-5 py-4 sm:flex-row sm:items-center">
            <h2 className="text-base font-semibold tracking-tight text-foreground-strong">
              Bloglarım{' '}
              <span className="font-normal text-muted-foreground tabular-nums">
                ({filteredBlogs.length})
              </span>
            </h2>
            <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-0.5">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                aria-label="Izgara görünümü"
                aria-pressed={viewMode === 'grid'}
              >
                <Grid3x3 />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                aria-label="Liste görünümü"
                aria-pressed={viewMode === 'list'}
              >
                <List />
              </Button>
            </div>
          </div>
        )}
        {isLoading ? (
          /* Skeleton mirrors the real card: cover, two-line title, meta rows, status/action footer. */
          <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-border">
                <Skeleton className="h-40 w-full rounded-none sm:h-44" />
                <div className="p-5">
                  <div className="mb-4 flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                    <Skeleton className="h-7 w-7 shrink-0 rounded-lg" />
                  </div>
                  <Skeleton className="mb-4 h-12 w-full rounded-lg" />
                  <div className="mb-4 space-y-2">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-4">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-8 w-24 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredBlogs.length === 0 ? (
          <EmptyState
            className="rounded-none border-0"
            icon={blogs.length === 0 ? <FileText /> : <Search />}
            title={blogs.length === 0 ? 'Henüz blog oluşturulmamış' : 'Eşleşen blog bulunamadı'}
            description={
              blogs.length === 0
                ? 'Bir konu başlığı verin, yapay zekâ SEO uyumlu blog içeriğinizi dakikalar içinde hazırlasın.'
                : 'Aramanız veya seçtiğiniz etiket bu workspace’teki hiçbir blogla eşleşmedi. Filtreleri temizleyip tekrar deneyin.'
            }
            action={
              blogs.length === 0 ? (
                <Button asChild size="lg">
                  <Link href="/dashboard/generate">
                    <Sparkles />
                    İlk Blogunu Üret
                  </Link>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedTag('Tümü');
                  }}
                >
                  <Filter />
                  Filtreleri Temizle
                </Button>
              )
            }
          />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBlogs.map((blog) => (
              <div
                key={blog.id}
                className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition-[box-shadow,border-color,transform] duration-base ease-out-quart hover:-translate-y-0.5 hover:border-strong hover:shadow-card-hover"
              >
                {/* Cover Image */}
                {blog.coverImageUrl && (
                  <div className="relative h-40 w-full overflow-hidden sm:h-44">
                    <Image
                      src={blog.coverImageUrl}
                      alt={blog.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-4 flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 min-w-0 flex-1 text-base font-semibold text-foreground-strong transition-colors group-hover:text-accent-foreground">
                      {blog.title}
                    </h3>
                    <div className="relative shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        aria-label="Blog işlemleri"
                        onClick={() => setSelectedBlog(selectedBlog === blog.id ? null : blog.id)}
                      >
                        <MoreVertical className="text-muted-foreground" />
                      </Button>
                      {selectedBlog === blog.id && renderActionsMenu(blog)}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col justify-between">
                    <div className="mb-4 space-y-2">
                      {/* Content Preview */}
                      {blog.content && blog.status !== 'queued' && blog.status !== 'generating' && (
                        <div className="mb-3">{renderContentPreview(blog.content, blog.format)}</div>
                      )}

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{blog.createdAt}</span>
                      </div>
                      {blog.contentLength !== undefined && blog.contentLength > 0 && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <FileText className="h-3.5 w-3.5" />
                          <span className="tabular-nums">
                            {blog.contentLength.toLocaleString('tr-TR')} karakter
                          </span>
                        </div>
                      )}
                      {blog.model && (
                        <Badge variant="outline" className="font-mono text-[11px]">
                          {blog.model}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
                      {getStatusBadge(blog.status, blog.scheduledAt)}
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/dashboard/blogs/${blog.id}`}>
                          <Eye />
                          <span className="hidden sm:inline">Görüntüle</span>
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredBlogs.map((blog) => (
              <div
                key={blog.id}
                className="group relative p-5 transition-colors duration-fast ease-out-quart hover:bg-surface-raised"
              >
                <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                  {blog.coverImageUrl && (
                    <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-lg sm:mr-4 sm:h-24 sm:w-32">
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
                  <div className="min-w-0 flex-1">
                    <h3 className="mb-2 text-base font-semibold text-foreground-strong transition-colors group-hover:text-accent-foreground">
                      {blog.title}
                    </h3>

                    {/* Content Preview for List View */}
                    {blog.content && blog.status !== 'queued' && blog.status !== 'generating' && (
                      <div className="mb-3">{renderContentPreview(blog.content, blog.format)}</div>
                    )}

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{blog.createdAt}</span>
                      </div>
                      {blog.contentLength !== undefined && blog.contentLength > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <FileText className="h-3.5 w-3.5" />
                          <span className="tabular-nums">
                            {blog.contentLength.toLocaleString('tr-TR')} karakter
                          </span>
                        </div>
                      )}
                      {blog.model && (
                        <Badge variant="outline" className="font-mono text-[11px]">
                          {blog.model}
                        </Badge>
                      )}
                      {getStatusBadge(blog.status, blog.scheduledAt)}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Button asChild variant="outline" size="sm" className="h-9 w-9 p-0" title="Görüntüle">
                      <Link href={`/dashboard/blogs/${blog.id}`} aria-label="Görüntüle">
                        <Eye />
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="hidden h-9 w-9 p-0 sm:inline-flex"
                      title="Düzenle"
                    >
                      <Link href={`/dashboard/blogs/${blog.id}`} aria-label="Düzenle">
                        <Edit />
                      </Link>
                    </Button>
                    <div className="relative">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 w-9 p-0"
                        aria-label="Blog işlemleri"
                        onClick={() => setSelectedBlog(selectedBlog === blog.id ? null : blog.id)}
                      >
                        <MoreVertical />
                      </Button>
                      {selectedBlog === blog.id && renderActionsMenu(blog)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export default function BlogsPage() {
  return (
    <Suspense
      fallback={
        /* Mirrors the loaded layout: header, filter bar, three stat tiles, card grid. */
        <div className="space-y-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-72" />
            </div>
            <Skeleton className="h-10 w-40 rounded-lg" />
          </div>
          <Skeleton className="h-[74px] w-full rounded-xl" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-[118px] rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-xl" />
            ))}
          </div>
        </div>
      }
    >
      <BlogsPageContent />
    </Suspense>
  );
}
