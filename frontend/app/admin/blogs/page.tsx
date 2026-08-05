'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Calendar,
  User,
  Eye,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Grid3x3,
  List,
  Zap,
  Building2,
  EyeOff,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { getAdminPosts, hideAdminPost, unhideAdminPost, type Post } from '@/lib/api';

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
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Blog Yönetimi"
        description="Tüm blogları görüntüleyin ve yönetin"
      />

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-border bg-[var(--destructive-muted)] p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-medium text-destructive">Hata</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      )}

      {/* Summary & Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="Toplam Blog" value={posts.length} icon={<FileText />} />
        <StatCard
          label="Hazır"
          value={posts.filter((p) => p.status === 'generated').length}
          icon={<CheckCircle2 />}
        />
        <StatCard
          label="Üretiliyor"
          value={posts.filter((p) => p.status === 'generating' || p.status === 'queued').length}
          icon={<Clock />}
        />
        <StatCard label="Gösterilen" value={filteredPosts.length} icon={<Eye />} />
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="grid w-full flex-1 grid-cols-1 gap-4 md:w-auto md:grid-cols-2">
            {/* Search */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Blog ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Durum filtresi"
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
              aria-label="Kart görünümü"
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
              aria-label="Liste görünümü"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Posts View */}
      {viewMode === 'grid' ? (
        filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => {
              const StatusIcon = statusIcons[post.status as keyof typeof statusIcons] || FileText;
              const statusVariant = statusVariants[post.status] || 'outline';
              const isGenerating = post.status === 'generating' || post.status === 'queued';
              const latestRevision = post.revisions && post.revisions.length > 0 ? post.revisions[0] : null;

              return (
                <div
                  key={post.id}
                  className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-card transition-shadow hover:shadow-card-hover"
                >
                  <h3 className="line-clamp-2 text-base font-semibold text-foreground">
                    {post.title}
                  </h3>
                  <div className="mt-2">
                    <Badge variant={statusVariant}>
                      <StatusIcon className={isGenerating ? 'h-3 w-3 animate-spin' : 'h-3 w-3'} />
                      {post.status}
                    </Badge>
                  </div>

                  <div className="mt-4 flex-1 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-4 w-4 shrink-0" />
                      <span>
                        {new Date(post.createdAt).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    {post.author && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <User className="h-4 w-4 shrink-0" />
                        <span>{post.author.name || post.author.email}</span>
                      </div>
                    )}
                    {post.workspace && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Building2 className="h-4 w-4 shrink-0" />
                        <span>
                          {post.workspace.name}
                          {post.workspace.owner && ` (${post.workspace.owner.name})`}
                        </span>
                      </div>
                    )}
                    {latestRevision && (
                      <>
                        {latestRevision.contentFormat && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <FileText className="h-4 w-4 shrink-0" />
                            <span>Format: {latestRevision.contentFormat}</span>
                          </div>
                        )}
                        {latestRevision.model && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Zap className="h-4 w-4 shrink-0" />
                            <span>Model: {latestRevision.model}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="mt-4 border-t border-border pt-4">
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link href={`/admin/blogs/${post.id}`}>
                        <Eye className="h-4 w-4" />
                        Görüntüle
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<FileText />}
            title="Blog bulunamadı"
            description="Arama veya durum filtresini değiştirerek tekrar deneyin."
          />
        )
      ) : filteredPosts.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Başlık</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Yazar</TableHead>
              <TableHead>Workspace</TableHead>
              <TableHead>Format</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPosts.map((post) => {
              const StatusIcon = statusIcons[post.status as keyof typeof statusIcons] || FileText;
              const statusVariant = statusVariants[post.status] || 'outline';
              const isGenerating = post.status === 'generating' || post.status === 'queued';
              const latestRevision = post.revisions && post.revisions.length > 0 ? post.revisions[0] : null;

              return (
                <TableRow key={post.id}>
                  <TableCell className="max-w-[280px]">
                    <span className="line-clamp-1 font-medium text-foreground">{post.title}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant}>
                      <StatusIcon className={isGenerating ? 'h-3 w-3 animate-spin' : 'h-3 w-3'} />
                      {post.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-3.5 w-3.5 shrink-0" />
                      <span>{post.author?.name || post.author?.email || '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {post.workspace?.name || '-'}
                        {post.workspace?.owner && ` (${post.workspace.owner.name})`}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {latestRevision?.contentFormat || '-'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {latestRevision?.model || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {new Date(post.createdAt).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {post.hiddenByAdmin ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleUnhidePost(post.id)}
                          className="h-9 w-9 text-success"
                          title="Gizlemeyi kaldır"
                          aria-label="Gizlemeyi kaldır"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleHidePost(post.id)}
                          className="h-9 w-9 text-destructive"
                          title="Blog'u gizle"
                          aria-label="Blog'u gizle"
                        >
                          <EyeOff className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-accent-foreground"
                      >
                        <Link href={`/admin/blogs/${post.id}`} aria-label="Blog detayını görüntüle">
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <EmptyState
          icon={<FileText />}
          title="Blog bulunamadı"
          description="Arama veya durum filtresini değiştirerek tekrar deneyin."
        />
      )}
    </div>
  );
}
