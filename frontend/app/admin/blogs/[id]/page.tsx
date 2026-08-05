'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  FileText,
  Calendar,
  User,
  Building2,
  Tag,
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
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { getAdminPostById, type Post } from '@/lib/api';
import { sanitizeHtml } from '@/lib/sanitize';

type StatusVariant = NonNullable<BadgeProps['variant']>;

const statusVariants: Record<string, StatusVariant> = {
  draft: 'outline',
  queued: 'warning',
  generating: 'info',
  generated: 'success',
  failed: 'destructive',
  published: 'primary',
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
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Geri
        </Button>
        <div className="flex items-start gap-3 rounded-xl border border-border bg-[var(--destructive-muted)] p-6">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <h3 className="text-sm font-semibold text-destructive">Hata</h3>
            <p className="mt-1 text-sm text-muted-foreground">{error || 'Blog bulunamadı'}</p>
          </div>
        </div>
      </div>
    );
  }

  const StatusIcon = statusIcons[post.status as keyof typeof statusIcons] || FileText;
  const statusVariant = statusVariants[post.status] || 'outline';
  const isGenerating = post.status === 'generating' || post.status === 'queued';
  const selectedRevision = post.revisions?.[selectedRevisionIndex];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/admin/blogs')}>
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Geri</span>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Blog Detayı</h1>
        </div>
        <Badge variant={statusVariant}>
          <StatusIcon className={isGenerating ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} />
          {post.status}
        </Badge>
      </div>

      {/* Post Info Card */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-card sm:p-6">
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground">{post.title}</h2>

        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Hash className="h-4 w-4 shrink-0" />
            <span>ID: {post.id}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0" />
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
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0" />
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4 shrink-0" />
              <span>
                Yazar: {post.author.name || post.author.email}
                {post.author.id && ` (${post.author.id.substring(0, 8)}...)`}
              </span>
            </div>
          )}
          {post.workspace && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4 shrink-0" />
              <span>
                Workspace: {post.workspace.name}
                {post.workspace.owner && ` (${post.workspace.owner.name})`}
              </span>
            </div>
          )}
          {post.slug && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="h-4 w-4 shrink-0" />
              <span>Slug: {post.slug}</span>
            </div>
          )}
          {post.language && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="h-4 w-4 shrink-0" />
              <span>Dil: {post.language}</span>
            </div>
          )}
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            {post.tags.map((tag) => (
              <Badge key={tag.id} variant="outline">
                {tag.name}
              </Badge>
            ))}
          </div>
        )}

        {post.excerpt && (
          <p className="text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
        )}
      </div>

      {/* Revisions */}
      {post.revisions && post.revisions.length > 0 ? (
        <div className="rounded-xl border border-border bg-card p-5 shadow-card sm:p-6">
          <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-2">
            <h3 className="text-base font-semibold text-foreground">
              Versiyonlar ({post.revisions.length})
            </h3>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyContent}
                className="flex-1 sm:flex-initial"
              >
                <Copy className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Kopyala</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadContent}
                className="flex-1 sm:flex-initial"
              >
                <Download className="h-3.5 w-3.5" />
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
                aria-label="Versiyon seç"
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
            <div className="mb-4 rounded-lg border border-border bg-secondary p-4">
              <div className="grid grid-cols-1 gap-3 text-sm text-muted-foreground md:grid-cols-3">
                {selectedRevision.contentFormat && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0" />
                    <span>Format: {selectedRevision.contentFormat.toUpperCase()}</span>
                  </div>
                )}
                {selectedRevision.model && (
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 shrink-0" />
                    <span>Model: {selectedRevision.model}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 shrink-0" />
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
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">İçerik Önizlemesi</h4>
              <div className="max-h-[600px] overflow-y-auto rounded-lg border border-border bg-background p-4 sm:max-h-[800px] sm:p-6 lg:p-8">
                {selectedRevision.contentFormat === 'html' ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedRevision.content) }}
                    className="max-w-none text-sm leading-relaxed text-foreground"
                  />
                ) : (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(selectedRevision.content
                        .replace(/^### (.*$)/gim, '<h3 class="mt-6 mb-3 text-xl font-semibold text-foreground">$1</h3>')
                        .replace(/^## (.*$)/gim, '<h2 class="mt-8 mb-4 text-2xl font-semibold text-foreground">$1</h2>')
                        .replace(/^# (.*$)/gim, '<h1 class="mt-8 mb-4 text-3xl font-semibold text-foreground">$1</h1>')
                        .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
                        .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
                        .replace(/^- (.*$)/gim, '<li class="ml-4 mb-2 text-foreground">• $1</li>')
                        .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 mb-2 text-foreground">$1</li>')
                        .replace(/\n/g, '<br />'))
                    }}
                    className="max-w-none text-sm leading-relaxed text-foreground"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon={<FileText />}
          title="Henüz versiyon bulunmuyor"
          description="Bu blog için kaydedilmiş bir içerik versiyonu yok."
        />
      )}
    </div>
  );
}
