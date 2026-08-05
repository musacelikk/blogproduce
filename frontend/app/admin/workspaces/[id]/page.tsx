'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge, type BadgeProps } from '@/components/ui/badge';
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
import { getAdminWorkspaceById, getAdminPosts, type Workspace, type Post } from '@/lib/api';

type StatusVariant = NonNullable<BadgeProps['variant']>;

const statusVariants: Record<string, StatusVariant> = {
  draft: 'outline',
  queued: 'warning',
  generating: 'info',
  generated: 'success',
  failed: 'destructive',
  published: 'primary',
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
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
          <p className="mb-4 text-sm text-destructive">{error || 'Workspace bulunamadı'}</p>
          <Button onClick={() => router.push('/admin/workspaces')} variant="outline">
            <ArrowLeft className="h-4 w-4" />
            Geri Dön
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/workspaces"
          className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Workspace Listesine Dön
        </Link>
        <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-foreground">
          {workspace.color && (
            <span
              className="h-4 w-4 shrink-0 rounded-full"
              style={{ backgroundColor: workspace.color }}
            />
          )}
          {workspace.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Workspace detayları ve içerikleri</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard
          label="Toplam Blog"
          value={workspace.postsCount || posts.length}
          icon={<FileText />}
        />
        <StatCard label="Site Sayısı" value={workspace.sites?.length || 0} icon={<Globe />} />
        <StatCard
          label="Yayınlanan"
          value={posts.filter((p) => p.status === 'published').length}
          icon={<Eye />}
        />
        <StatCard
          label="Taslak"
          value={posts.filter((p) => p.status === 'draft').length}
          icon={<Edit />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Workspace Info */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
              <Building2 className="h-5 w-5 text-accent-foreground" />
              Workspace Bilgileri
            </h2>
            <div className="space-y-4">
              {workspace.description && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Açıklama
                  </p>
                  <p className="mt-1 text-sm text-foreground">{workspace.description}</p>
                </div>
              )}
              {workspace.siteUrl && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Site URL
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <Globe className="h-4 w-4 shrink-0 text-accent-foreground" />
                    <a
                      href={workspace.siteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-sm text-accent-foreground hover:underline"
                      title={workspace.siteUrl}
                    >
                      {workspace.siteUrl}
                    </a>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-accent-foreground" />
                  </div>
                </div>
              )}
              {workspace.owner && (
                <div className="flex items-start gap-2">
                  <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Sahip
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {workspace.owner.name || workspace.owner.email}
                    </p>
                    <p className="text-xs text-muted-foreground">{workspace.owner.email}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2">
                <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Oluşturulma
                  </p>
                  <p className="mt-1 text-sm text-foreground">
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
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Bağlı Siteler
                  </p>
                  <div className="space-y-2">
                    {workspace.sites.map((site) => (
                      <div
                        key={site.id}
                        className="flex items-center gap-2 rounded-lg border border-border bg-secondary p-2"
                      >
                        <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-foreground">{site.name}</p>
                          {site.domain && (
                            <p className="truncate text-xs text-muted-foreground">{site.domain}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Posts List */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-accent-foreground" />
            <h2 className="text-base font-semibold text-foreground">
              Blog İçerikleri ({posts.length})
            </h2>
          </div>
          {posts.length === 0 ? (
            <EmptyState
              icon={<FileText />}
              title={"Bu workspace'te henüz blog içeriği yok"}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Başlık</TableHead>
                  <TableHead className="w-32">Durum</TableHead>
                  <TableHead className="w-36">Tarih</TableHead>
                  <TableHead className="w-20 text-right">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => {
                  const statusVariant = statusVariants[post.status] || 'outline';
                  return (
                    <TableRow key={post.id}>
                      <TableCell className="max-w-[360px]">
                        <p className="line-clamp-1 font-medium text-foreground">{post.title}</p>
                        {post.excerpt && (
                          <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                            {post.excerpt}
                          </p>
                        )}
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {post.author && (
                            <span className="flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 shrink-0" />
                              {post.author.name || post.author.email}
                            </span>
                          )}
                          {post.tags && post.tags.length > 0 && (
                            <span className="flex items-center gap-1.5">
                              <Tag className="h-3.5 w-3.5 shrink-0" />
                              {post.tags.length} etiket
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant}>{post.status}</Badge>
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
                        <div className="flex justify-end">
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-accent-foreground"
                          >
                            <Link
                              href={`/admin/blogs?postId=${post.id}`}
                              aria-label="Blog detayını görüntüle"
                            >
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
          )}
        </div>
      </div>
    </div>
  );
}
