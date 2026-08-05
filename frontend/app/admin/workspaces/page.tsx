'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  Search,
  Filter,
  Calendar,
  User,
  Eye,
  FileText,
  Loader2,
  AlertCircle,
  Globe,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
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
import { getAdminWorkspaces, type Workspace } from '@/lib/api';

export default function AdminWorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      setError(null);
      const workspacesData = await getAdminWorkspaces();
      // Ensure all workspaces have required fields
      const normalizedWorkspaces = workspacesData.map((w: any) => ({
        ...w,
        postsCount: w.postsCount || 0,
        sites: w.sites || [],
        owner: w.owner || null,
      }));
      setWorkspaces(normalizedWorkspaces);
    } catch (err) {
      console.error('Error loading workspaces:', err);
      setError(err instanceof Error ? err.message : 'Workspace&apos;ler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkspaces = workspaces.filter((workspace) => {
    const matchesSearch =
      workspace.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workspace.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workspace.siteUrl?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workspace.owner?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workspace.owner?.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesOwner = ownerFilter === 'all' || workspace.ownerId === ownerFilter;
    return matchesSearch && matchesOwner;
  });

  const uniqueOwners = Array.from(
    new Map(workspaces.map((w) => [w.ownerId, w.owner])).entries()
  ).map(([id, owner]) => ({ id, owner }));

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
        title="Workspace Yönetimi"
        description={"Tüm workspace'leri görüntüleyin ve yönetin"}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Toplam Workspace" value={workspaces.length} icon={<Building2 />} />
        <StatCard
          label="Toplam Blog"
          value={workspaces.reduce((sum, w) => sum + (w.postsCount || 0), 0)}
          icon={<FileText />}
        />
        <StatCard label="Benzersiz Sahipler" value={uniqueOwners.length} icon={<Users />} />
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Workspace, açıklama, site URL veya sahip ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              aria-label="Sahip filtresi"
              className="h-10 w-full appearance-none rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="all">Tüm Sahipler</option>
              {uniqueOwners.map(({ id, owner }) => (
                <option key={id} value={id}>
                  {owner?.name || owner?.email || 'Bilinmeyen'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Workspaces List */}
      {error ? (
        <div className="flex items-start gap-3 rounded-xl border border-border bg-[var(--destructive-muted)] p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-medium text-destructive">Hata</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      ) : filteredWorkspaces.length === 0 ? (
        <EmptyState
          icon={<Building2 />}
          title="Workspace bulunamadı"
          description="Arama veya sahip filtresini değiştirerek tekrar deneyin."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Workspace</TableHead>
              <TableHead>Sahip</TableHead>
              <TableHead className="w-24">Blog</TableHead>
              <TableHead className="w-24">Site</TableHead>
              <TableHead className="w-36">Tarih</TableHead>
              <TableHead className="w-32 text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredWorkspaces.map((workspace) => (
              <TableRow
                key={workspace.id}
                className="cursor-pointer"
                onClick={() => (window.location.href = `/admin/workspaces/${workspace.id}`)}
              >
                <TableCell className="max-w-[360px]">
                  <div className="flex items-center gap-3">
                    {workspace.color && (
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: workspace.color }}
                      />
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{workspace.name}</p>
                      {workspace.description && (
                        <p className="line-clamp-1 text-sm text-muted-foreground">
                          {workspace.description}
                        </p>
                      )}
                      {workspace.siteUrl && (
                        <span className="mt-1 flex items-center gap-1.5 text-xs text-accent-foreground">
                          <Globe className="h-3.5 w-3.5 shrink-0" />
                          <a
                            href={workspace.siteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="truncate hover:underline"
                            title={workspace.siteUrl}
                          >
                            {workspace.siteUrl}
                          </a>
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {workspace.owner ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-3.5 w-3.5 shrink-0" />
                      <span
                        className="truncate"
                        title={workspace.owner.name || workspace.owner.email}
                      >
                        {workspace.owner.name || workspace.owner.email}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-3.5 w-3.5 shrink-0" />
                    <span>{workspace.postsCount || 0}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Globe className="h-3.5 w-3.5 shrink-0" />
                    <span>{workspace.sites?.length ? `${workspace.sites.length} Site` : 'Site Yok'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      {new Date(workspace.createdAt).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/workspaces/${workspace.id}`}>
                        <Eye className="h-4 w-4" />
                        Detaylar
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
