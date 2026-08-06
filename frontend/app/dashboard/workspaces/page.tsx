'use client';

import { useState, useEffect } from 'react';
import { FolderPlus, Folder, Edit, Trash2, Plus, Loader2, AlertCircle, Check, X, FileText, Palette, HelpCircle, Hash, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { getWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace, type Workspace } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function WorkspacesPage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', color: '', siteUrl: '' });
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingWorkspaceId, setDeletingWorkspaceId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showInfoCard, setShowInfoCard] = useState(false);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getWorkspaces();
      setWorkspaces(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Workspace&apos;ler yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Workspace adı gereklidir');
      return;
    }

    try {
      setIsCreating(true);
      setError(null);
      const newWorkspace = await createWorkspace(
        formData.name,
        formData.description || undefined,
        formData.color || undefined,
        formData.siteUrl || undefined
      );
      setWorkspaces([...workspaces, newWorkspace]);
      setFormData({ name: '', description: '', color: '', siteUrl: '' });
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Workspace oluşturulurken bir hata oluştu');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingWorkspace || !formData.name.trim()) {
      setError('Workspace adı gereklidir');
      return;
    }

    try {
      setIsUpdating(true);
      setError(null);
      const updatedWorkspace = await updateWorkspace(
        editingWorkspace.id,
        formData.name,
        formData.description || undefined,
        formData.color || undefined,
        formData.siteUrl || undefined
      );
      setWorkspaces(workspaces.map(ws => ws.id === editingWorkspace.id ? updatedWorkspace : ws));
      setEditingWorkspace(null);
      setFormData({ name: '', description: '', color: '', siteUrl: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Workspace güncellenirken bir hata oluştu');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEdit = (workspace: Workspace) => {
    setEditingWorkspace(workspace);
    setFormData({
      name: workspace.name,
      description: workspace.description || '',
      color: workspace.color || '',
      siteUrl: workspace.siteUrl || '',
    });
    setShowCreateForm(false);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleDelete = async (workspaceId: string, force: boolean = false) => {
    if (!force && !confirm('Bu workspace&apos;i silmek istediğinize emin misiniz? Workspace&apos;te bloglar varsa silinemeyecektir.')) {
      return;
    }

    try {
      setDeletingWorkspaceId(workspaceId);
      setError(null);
      await deleteWorkspace(workspaceId, force);
      setWorkspaces(workspaces.filter((ws) => ws.id !== workspaceId));
      setShowDeleteConfirm(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Workspace silinirken bir hata oluştu';
      setError(errorMessage);

      // If error mentions posts, show force delete option
      if (errorMessage.includes('blog')) {
        setShowDeleteConfirm(workspaceId);
      }
    } finally {
      setDeletingWorkspaceId(null);
    }
  };

  const handleForceDelete = async (workspaceId: string) => {
    if (!confirm('Bu workspace&apos;i ve içindeki TÜM blogları silmek istediğinize emin misiniz? Bu işlem geri alınamaz!')) {
      setShowDeleteConfirm(null);
      return;
    }

    await handleDelete(workspaceId, true);
  };

  // Get initials from workspace name
  const getInitials = (name: string) => {
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Available colors for workspace. Stored `value`s are unchanged — only the rendered
  // swatch is expressed through design tokens so workspaces stay on-palette.
  const workspaceColors = [
    { value: 'blue', label: 'Mavi', class: 'bg-gradient-to-br from-chart-1 to-chart-1-soft' },
    { value: 'purple', label: 'Mor', class: 'bg-gradient-to-br from-chart-4 to-chart-4-soft' },
    { value: 'pink', label: 'Pembe', class: 'bg-gradient-to-br from-chart-4-soft to-destructive' },
    { value: 'indigo', label: 'İndigo', class: 'bg-gradient-to-br from-chart-1-soft to-chart-4' },
    { value: 'green', label: 'Yeşil', class: 'bg-gradient-to-br from-chart-2 to-chart-2-soft' },
    { value: 'yellow', label: 'Sarı', class: 'bg-gradient-to-br from-chart-3 to-chart-3-soft' },
    { value: 'red', label: 'Kırmızı', class: 'bg-gradient-to-br from-destructive to-chart-3' },
    { value: 'teal', label: 'Teal', class: 'bg-gradient-to-br from-chart-2-soft to-brand-secondary' },
    { value: 'orange', label: 'Turuncu', class: 'bg-gradient-to-br from-warning to-chart-3-soft' },
    { value: 'cyan', label: 'Cyan', class: 'bg-gradient-to-br from-brand-secondary to-chart-5-soft' },
    { value: 'gray', label: 'Gri', class: 'bg-gradient-to-br from-muted-foreground to-border' },
    { value: 'black', label: 'Siyah', class: 'bg-gradient-to-br from-foreground-strong to-foreground' },
  ];

  // Generate avatar color based on workspace name or saved color
  const generateAvatarColor = (workspace: Workspace) => {
    if (workspace.color) {
      const colorOption = workspaceColors.find(c => c.value === workspace.color);
      if (colorOption) {
        return colorOption.class;
      }
    }
    // Fallback to hash-based color
    const colors = workspaceColors.map(c => c.class);
    let hash = 0;
    for (let i = 0; i < workspace.name.length; i++) {
      hash = workspace.name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-80" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-10 w-40 rounded-lg" />
          </div>
        </div>
        {/* Skeleton mirrors the workspace card: avatar, name, id row, action pair. */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-card">
              <div className="flex flex-col items-center">
                <Skeleton className="mb-3 h-20 w-20 rounded-full" />
                <Skeleton className="mb-2 h-5 w-32" />
                <Skeleton className="h-4 w-44" />
              </div>
              <div className="mt-4 flex flex-col items-center gap-1.5">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-3 w-32" />
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex gap-2">
                  <Skeleton className="h-9 flex-1 rounded-lg" />
                  <Skeleton className="h-9 flex-1 rounded-lg" />
                </div>
                <Skeleton className="h-9 w-full rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="İçerik"
        title="Workspace&apos;ler"
        description="İçeriklerinizi projelere göre düzenleyin"
        actions={
          <>
            <Button
              onClick={() => setShowInfoCard(!showInfoCard)}
              variant="outline"
              size="icon"
              title="Workspace Nedir?"
              aria-label="Workspace Nedir?"
            >
              <HelpCircle className="text-muted-foreground" />
            </Button>
            <Button onClick={() => setShowCreateForm(!showCreateForm)}>
              <Plus />
              Yeni Workspace
            </Button>
          </>
        }
      />

      {/* Info Card - Collapsible */}
      {showInfoCard && (
        <div className="overflow-hidden rounded-xl border border-border bg-info-muted p-4">
          <div className="flex items-start gap-3">
            <Folder className="mt-0.5 h-5 w-5 shrink-0 text-info" />
            <div className="flex-1">
              <h3 className="mb-1 text-sm font-medium text-info">
                Workspace Nedir?
              </h3>
              <p className="text-xs text-info">
                Workspace, bloglarınızı organize etmek için kullandığınız bir çalışma alanıdır.
                Örneğin: &quot;Kişisel Blog&quot;, &quot;Şirket Blogu&quot;, &quot;Proje Blogu&quot; gibi farklı workspace&apos;ler oluşturabilirsiniz.
                Her workspace&apos;te ayrı bloglar tutabilir ve içeriklerinizi kategorize edebilirsiniz.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInfoCard(false)}
              className="h-6 w-6 shrink-0 p-0"
              aria-label="Kapat"
            >
              <X className="h-3.5 w-3.5 text-info" />
            </Button>
          </div>
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <Card className="p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-foreground">
              Yeni Workspace Oluştur
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowCreateForm(false);
                setFormData({ name: '', description: '', color: '', siteUrl: '' });
                setError(null);
              }}
              className="h-8 w-8 p-0"
              aria-label="Kapat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-foreground">
                Workspace Adı <span className="text-destructive">*</span>
              </label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Örn: Kişisel Blog, Şirket Blogu"
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="mb-2 block text-sm font-medium text-foreground">
                Açıklama (Opsiyonel)
              </label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Bu workspace hakkında kısa bir açıklama..."
                rows={3}
                className="resize-none"
              />
            </div>
            <div>
              <label htmlFor="siteUrl" className="mb-2 block text-sm font-medium text-foreground">
                Site URL (Opsiyonel)
              </label>
              <Input
                id="siteUrl"
                type="url"
                value={formData.siteUrl}
                onChange={(e) => setFormData({ ...formData, siteUrl: e.target.value })}
                placeholder="https://example.com"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                SEO için kullanılacak site URL&apos;si (opsiyonel)
              </p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Renk (Opsiyonel)
              </label>
              <div className="flex items-center gap-2">
                {workspaceColors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`h-6 w-6 rounded-lg border-2 transition-all ${color.class} ${
                      formData.color === color.value
                        ? 'scale-110 border-primary shadow-card-hover ring-2 ring-primary/30'
                        : 'border-transparent hover:scale-105'
                    }`}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <Check />
                    Oluştur
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({ name: '', description: '', color: '', siteUrl: '' });
                  setError(null);
                }}
              >
                İptal
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Edit Form */}
      {editingWorkspace && (
        <Card className="p-6 shadow-elevated">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl shadow-card ${formData.color ? workspaceColors.find(c => c.value === formData.color)?.class || generateAvatarColor(editingWorkspace) : generateAvatarColor(editingWorkspace)}`}>
                <span className="text-xl font-bold text-primary-foreground">
                  {getInitials(formData.name || editingWorkspace.name)}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Workspace Düzenle
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Ayarlarınızı güncelleyin</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditingWorkspace(null);
                setFormData({ name: '', description: '', color: '', siteUrl: '' });
                setError(null);
              }}
              className="h-8 w-8 p-0"
              aria-label="Kapat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleUpdate} className="space-y-5">
            <div>
              <label
                htmlFor="edit-name"
                className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground"
              >
                <Folder className="h-4 w-4 text-primary" />
                Workspace Adı <span className="text-destructive">*</span>
              </label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Örn: Kişisel Blog, Şirket Blogu"
                required
              />
            </div>

            <div>
              <label
                htmlFor="edit-description"
                className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground"
              >
                <FileText className="h-4 w-4 text-primary" />
                Açıklama (Opsiyonel)
              </label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Bu workspace hakkında kısa bir açıklama..."
                rows={3}
                className="resize-none"
              />
            </div>

            <div>
              <label
                htmlFor="edit-siteUrl"
                className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground"
              >
                <FileText className="h-4 w-4 text-primary" />
                Site URL (Opsiyonel)
              </label>
              <Input
                id="edit-siteUrl"
                type="url"
                value={formData.siteUrl}
                onChange={(e) => setFormData({ ...formData, siteUrl: e.target.value })}
                placeholder="https://example.com"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                SEO için kullanılacak site URL&apos;si (opsiyonel)
              </p>
            </div>

            <div>
              <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Palette className="h-4 w-4 text-primary" />
                Renk Seç
              </label>
              <div className="mb-4 flex items-center justify-start gap-2">
                {workspaceColors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`relative h-6 w-6 rounded-lg border-2 shadow-card transition-all ${color.class} ${
                      formData.color === color.value
                        ? 'scale-110 border-primary shadow-card-hover ring-2 ring-primary/30'
                        : 'border-transparent hover:shadow-card-hover'
                    }`}
                    title={color.label}
                  >
                    {formData.color === color.value && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <Check className="h-3.5 w-3.5 text-primary-foreground" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {formData.color && (
                <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <span>Seçili renk:</span>
                  <span className="font-medium text-foreground">
                    {workspaceColors.find(c => c.value === formData.color)?.label}
                  </span>
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={isUpdating} className="flex-1">
                {isUpdating ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Güncelleniyor...
                  </>
                ) : (
                  <>
                    <Check />
                    Değişiklikleri Kaydet
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingWorkspace(null);
                  setFormData({ name: '', description: '', color: '', siteUrl: '' });
                  setError(null);
                }}
              >
                İptal
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-border bg-[var(--destructive-muted)] p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Hata</p>
            <p>{error}</p>
            <Button variant="outline" size="sm" onClick={loadWorkspaces} className="mt-2">
              Tekrar Dene
            </Button>
          </div>
        </div>
      )}

      {/* Workspaces Grid */}
      {workspaces.length === 0 ? (
        <EmptyState
          icon={<Folder />}
          title="Henüz workspace oluşturulmamış"
          description="İlk workspace&apos;inizi oluşturarak blog üretmeye başlayın"
          action={
            <Button onClick={() => setShowCreateForm(true)}>
              <FolderPlus />
              İlk Workspace&apos;i Oluştur
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((workspace) => {
            const initials = getInitials(workspace.name);
            const avatarColor = generateAvatarColor(workspace);

            return (
            <Card key={workspace.id} variant="interactive" className="group relative p-5">
              <div className="absolute right-3 top-3 z-10">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(workspace);
                  }}
                  className="h-7 w-7 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                  title="Düzenle"
                  aria-label="Düzenle"
                >
                  <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>

              <div
                className="mb-4 flex cursor-pointer flex-col items-center text-center"
                onClick={() => router.push(`/dashboard/blogs?workspaceId=${workspace.id}`)}
              >
                <div className={`mb-3 flex h-20 w-20 items-center justify-center rounded-full shadow-card transition-transform group-hover:scale-105 ${avatarColor}`}>
                  <span className="text-2xl font-bold text-primary-foreground">
                    {initials}
                  </span>
                </div>
                <h3 className="mb-1 text-lg font-semibold text-foreground-strong">
                  {workspace.name}
                </h3>
                {workspace.description && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {workspace.description}
                  </p>
                )}
              </div>

              <div className="mb-4 space-y-1">
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <Hash className="h-3 w-3" />
                  <span className="font-mono">{workspace.id}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(workspace.id);
                    }}
                    className="h-4 w-4 p-0"
                    title="ID'yi kopyala"
                    aria-label="ID'yi kopyala"
                  >
                    <Copy className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
                <div className="flex items-center justify-center text-xs text-muted-foreground">
                  <span>Oluşturulma: {formatDate(workspace.createdAt)}</span>
                </div>
              </div>

              <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/dashboard/generate?workspaceId=${workspace.id}`)}
                    className="flex-1 text-xs"
                  >
                    <Plus className="h-3 w-3" />
                    Blog Üret
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/dashboard/blogs?workspaceId=${workspace.id}`)}
                    className="flex-1 text-xs"
                  >
                    Blogları Gör
                  </Button>
                </div>
                {showDeleteConfirm === workspace.id ? (
                  <div className="space-y-2 rounded-lg border border-border bg-[var(--destructive-muted)] p-3">
                    <p className="text-xs font-medium text-destructive">Workspace&apos;te bloglar var!</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleForceDelete(workspace.id)}
                        disabled={deletingWorkspaceId === workspace.id}
                        className="flex-1 text-xs text-destructive"
                      >
                        {deletingWorkspaceId === workspace.id ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Siliniyor...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-3 w-3" />
                            Zorla Sil
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(null)}
                        className="text-xs"
                      >
                        İptal
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(workspace.id)}
                    disabled={deletingWorkspaceId === workspace.id}
                    className="w-full text-xs text-destructive"
                  >
                    {deletingWorkspaceId === workspace.id ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Siliniyor...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-3 w-3" />
                        Workspace&apos;i Sil
                      </>
                    )}
                  </Button>
                )}
              </div>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
