'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FolderPlus, Folder, Edit, Trash2, Plus, Loader2, AlertCircle, Check, X, FileText, Palette, HelpCircle, Hash, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CardSkeleton } from '@/components/ui/skeleton';
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

  // Available colors for workspace
  const workspaceColors = [
    { value: 'blue', label: 'Mavi', class: 'bg-gradient-to-br from-blue-500 to-blue-600' },
    { value: 'purple', label: 'Mor', class: 'bg-gradient-to-br from-purple-500 to-purple-600' },
    { value: 'pink', label: 'Pembe', class: 'bg-gradient-to-br from-pink-500 to-pink-600' },
    { value: 'indigo', label: 'İndigo', class: 'bg-gradient-to-br from-indigo-500 to-indigo-600' },
    { value: 'green', label: 'Yeşil', class: 'bg-gradient-to-br from-green-500 to-green-600' },
    { value: 'yellow', label: 'Sarı', class: 'bg-gradient-to-br from-yellow-500 to-yellow-600' },
    { value: 'red', label: 'Kırmızı', class: 'bg-gradient-to-br from-red-500 to-red-600' },
    { value: 'teal', label: 'Teal', class: 'bg-gradient-to-br from-teal-500 to-teal-600' },
    { value: 'orange', label: 'Turuncu', class: 'bg-gradient-to-br from-orange-500 to-orange-600' },
    { value: 'cyan', label: 'Cyan', class: 'bg-gradient-to-br from-cyan-500 to-cyan-600' },
    { value: 'gray', label: 'Gri', class: 'bg-gradient-to-br from-gray-500 to-gray-600' },
    { value: 'black', label: 'Siyah', class: 'bg-gradient-to-br from-black to-black' },
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
      <div className="space-y-5">
        <div className="mb-6">
          <div className="h-8 w-64 bg-[var(--border)] animate-pulse rounded mb-2" />
          <div className="h-4 w-96 bg-[var(--border)] animate-pulse rounded" />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="h-4 w-32 bg-blue-200/50 animate-pulse rounded mb-2" />
          <div className="h-3 w-full bg-blue-200/50 animate-pulse rounded" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
               style={{ background: 'linear-gradient(135deg,#203eec,#00d4ff)' }}>
            <Folder className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Workspace&apos;ler</h1>
            <p className="text-sm text-muted-foreground">İçeriklerinizi projelere göre düzenleyin</p>
          </div>
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">
          <Button
            onClick={() => setShowInfoCard(!showInfoCard)}
            variant="outline"
            size="sm"
            className="rounded-full px-3 py-2.5 border-[var(--border)] hover:bg-[var(--secondary)] hover:border-[#203eec] transition-all duration-200"
            title="Workspace Nedir?"
          >
            <HelpCircle className="w-4 h-4 text-muted-foreground" />
          </Button>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg,#203eec,#00d4ff)' }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni Workspace
          </Button>
        </div>
      </motion.div>

      {/* Info Card - Collapsible */}
      {showInfoCard && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-blue-50 border border-blue-200 rounded-xl p-4 overflow-hidden"
        >
          <div className="flex items-start gap-3">
            <Folder className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3
                className="text-sm font-medium text-blue-900 mb-1"
                style={{
                }}
              >
                Workspace Nedir?
              </h3>
              <p
                className="text-xs text-blue-700"
                style={{
                }}
              >
                Workspace, bloglarınızı organize etmek için kullandığınız bir çalışma alanıdır. 
                Örneğin: &quot;Kişisel Blog&quot;, &quot;Şirket Blogu&quot;, &quot;Proje Blogu&quot; gibi farklı workspace&apos;ler oluşturabilirsiniz. 
                Her workspace&apos;te ayrı bloglar tutabilir ve içeriklerinizi kategorize edebilirsiniz.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInfoCard(false)}
              className="h-6 w-6 p-0 flex-shrink-0"
            >
              <X className="w-3.5 h-3.5 text-blue-600" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl p-5"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-lg font-medium text-foreground"
              style={{
              }}
            >
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
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label
                htmlFor="name"
                className="text-sm font-medium text-foreground mb-2 block"
                style={{
                }}
              >
                Workspace Adı <span className="text-red-500">*</span>
              </label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Örn: Kişisel Blog, Şirket Blogu"
                className="border-[var(--border)] focus:border-[#203eec]"
                required
              />
            </div>
            <div>
              <label
                htmlFor="description"
                className="text-sm font-medium text-foreground mb-2 block"
                style={{
                }}
              >
                Açıklama (Opsiyonel)
              </label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Bu workspace hakkında kısa bir açıklama..."
                rows={3}
                className="border-[var(--border)] focus:border-[#203eec]"
              />
            </div>
            <div>
              <label
                htmlFor="siteUrl"
                className="text-sm font-medium text-foreground mb-2 block"
                style={{
                }}
              >
                Site URL (Opsiyonel)
              </label>
              <Input
                id="siteUrl"
                type="url"
                value={formData.siteUrl}
                onChange={(e) => setFormData({ ...formData, siteUrl: e.target.value })}
                placeholder="https://example.com"
                className="border-[var(--border)] focus:border-[#203eec]"
              />
              <p className="text-xs text-muted-foreground mt-1">
                SEO için kullanılacak site URL&apos;si (opsiyonel)
              </p>
            </div>
            <div>
              <label
                className="text-sm font-medium text-foreground mb-2 block"
                style={{
                }}
              >
                Renk (Opsiyonel)
              </label>
              <div className="flex items-center gap-2">
                {workspaceColors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`w-6 h-6 rounded-lg ${color.class} border-2 transition-all ${
                      formData.color === color.value
                        ? 'border-[#203eec] scale-110 shadow-lg ring-2 ring-[#203eec]/30'
                        : 'border-transparent hover:scale-105'
                    }`}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="submit"
                disabled={isCreating}
                className="bg-[#203eec] hover:bg-[#1a32cc] text-white"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
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
                className="border-[var(--border)] hover:border-[#203eec]"
              >
                İptal
              </Button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Edit Form */}
      {editingWorkspace && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
          className="relative bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 rounded-xl p-6 border-2 border-[var(--border)] shadow-xl backdrop-blur-sm overflow-hidden"
        >
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-pink-200/20 to-orange-200/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 ${formData.color ? workspaceColors.find(c => c.value === formData.color)?.class || generateAvatarColor(editingWorkspace) : generateAvatarColor(editingWorkspace)} rounded-xl flex items-center justify-center shadow-lg`}>
                  <span
                    className="text-xl font-bold text-white"
                    style={{
                    }}
                  >
                    {getInitials(formData.name || editingWorkspace.name)}
                  </span>
                </div>
                <div>
                  <h2
                    className="text-xl font-semibold text-foreground"
                    style={{
                    }}
                  >
                    Workspace Düzenle
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Ayarlarınızı güncelleyin</p>
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
                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-5">
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-[var(--border)]/50">
                <label
                  htmlFor="edit-name"
                  className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2"
                  style={{
                  }}
                >
                  <Folder className="w-4 h-4 text-[#203eec]" />
                  Workspace Adı <span className="text-red-500">*</span>
                </label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Örn: Kişisel Blog, Şirket Blogu"
                  className="border-[var(--border)] focus:border-[#203eec] focus:ring-2 focus:ring-[#203eec]/20 bg-white"
                  required
                />
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-[var(--border)]/50">
                <label
                  htmlFor="edit-description"
                  className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2"
                  style={{
                  }}
                >
                  <FileText className="w-4 h-4 text-[#203eec]" />
                  Açıklama (Opsiyonel)
                </label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Bu workspace hakkında kısa bir açıklama..."
                  rows={3}
                  className="border-[var(--border)] focus:border-[#203eec] focus:ring-2 focus:ring-[#203eec]/20 bg-white resize-none"
                />
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-[var(--border)]/50">
                <label
                  htmlFor="edit-siteUrl"
                  className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2"
                  style={{
                  }}
                >
                  <FileText className="w-4 h-4 text-[#203eec]" />
                  Site URL (Opsiyonel)
                </label>
                <Input
                  id="edit-siteUrl"
                  type="url"
                  value={formData.siteUrl}
                  onChange={(e) => setFormData({ ...formData, siteUrl: e.target.value })}
                  placeholder="https://example.com"
                  className="border-[var(--border)] focus:border-[#203eec] focus:ring-2 focus:ring-[#203eec]/20 bg-white"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  SEO için kullanılacak site URL&apos;si (opsiyonel)
                </p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-[var(--border)]/50">
                <label
                  className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"
                  style={{
                  }}
                >
                  <Palette className="w-4 h-4 text-[#203eec]" />
                  Renk Seç
                </label>
                <div className="flex items-center gap-2 mb-4 justify-start">
                  {workspaceColors.map((color) => (
                    <motion.button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      className={`relative w-6 h-6 rounded-lg ${color.class} border-2 transition-all shadow-sm ${
                        formData.color === color.value
                          ? 'border-[#203eec] scale-110 shadow-md ring-2 ring-[#203eec]/30'
                          : 'border-transparent hover:shadow-md'
                      }`}
                      title={color.label}
                    >
                      {formData.color === color.value && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <Check className="w-3.5 h-3.5 text-white drop-shadow-md" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
                {formData.color && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-muted-foreground mt-2 flex items-center gap-1"
                  >
                    <span>Seçili renk:</span>
                    <span className="font-medium text-foreground">
                      {workspaceColors.find(c => c.value === formData.color)?.label}
                    </span>
                  </motion.p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 bg-gradient-to-r from-[#203eec] to-[#1a32cc] hover:from-[#1a32cc] hover:to-[#1d4ed8] text-white shadow-lg hover:shadow-xl transition-all"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Güncelleniyor...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
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
                  className="border-[var(--border)] hover:border-[#666666] hover:bg-[var(--secondary)] transition-colors"
                >
                  İptal
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      )}

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
              onClick={loadWorkspaces}
              className="mt-2 border-red-200 text-red-600 hover:bg-red-100"
            >
              Tekrar Dene
            </Button>
          </div>
        </div>
      )}

      {/* Workspaces Grid */}
      {workspaces.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-xl p-10 border border-[var(--border)] text-center"
        >
          <Folder className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3
            className="text-lg font-medium text-foreground mb-2"
            style={{
            }}
          >
            Henüz workspace oluşturulmamış
          </h3>
          <p
            className="text-sm text-muted-foreground mb-4"
            style={{
            }}
          >
            İlk workspace&apos;inizi oluşturarak blog üretmeye başlayın
          </p>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-[#203eec] hover:bg-[#1a32cc] text-white"
          >
            <FolderPlus className="w-4 h-4 mr-2" />
            İlk Workspace&apos;i Oluştur
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((workspace, index) => {
            const initials = getInitials(workspace.name);
            const avatarColor = generateAvatarColor(workspace);
            
            return (
            <motion.div
              key={workspace.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="rounded-2xl p-5 hover:shadow-lg hover:border-[#203eec] transition-all group relative"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <div className="absolute top-3 right-3 z-10">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(workspace);
                  }}
                  className="h-7 w-7 p-0 hover:bg-[var(--secondary)] opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Düzenle"
                >
                  <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
              </div>
              
              <div 
                className="flex flex-col items-center text-center mb-4 cursor-pointer"
                onClick={() => router.push(`/dashboard/blogs?workspaceId=${workspace.id}`)}
              >
                <div className={`w-20 h-20 ${avatarColor} rounded-full flex items-center justify-center mb-3 shadow-md group-hover:scale-105 transition-transform`}>
                  <span
                    className="text-2xl font-bold text-white"
                    style={{
                    }}
                  >
                    {initials}
                  </span>
                </div>
                <h3
                  className="text-lg font-semibold text-foreground mb-1"
                  style={{
                  }}
                >
                  {workspace.name}
                </h3>
                {workspace.description && (
                  <p
                    className="text-sm text-muted-foreground line-clamp-2"
                    style={{
                    }}
                  >
                    {workspace.description}
                  </p>
                )}
              </div>
              
              <div className="space-y-1 mb-4">
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <Hash className="w-3 h-3" />
                  <span className="font-mono">{workspace.id}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(workspace.id);
                    }}
                    className="h-4 w-4 p-0 hover:bg-[var(--secondary)]"
                    title="ID'yi kopyala"
                  >
                    <Copy className="w-3 h-3 text-muted-foreground" />
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
                    className="flex-1 border-[var(--border)] hover:border-[#203eec] hover:text-[#203eec] hover:bg-[#203eec]/5 text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Blog Üret
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/dashboard/blogs?workspaceId=${workspace.id}`)}
                    className="flex-1 border-[var(--border)] hover:border-[#203eec] hover:text-[#203eec] hover:bg-[#203eec]/5 text-xs"
                  >
                    Blogları Gör
                  </Button>
                </div>
                {showDeleteConfirm === workspace.id ? (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-2">
                    <p className="text-xs text-red-700 font-medium">Workspace&apos;te bloglar var!</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleForceDelete(workspace.id)}
                        disabled={deletingWorkspaceId === workspace.id}
                        className="flex-1 border-red-300 text-red-700 hover:bg-red-100 text-xs"
                      >
                        {deletingWorkspaceId === workspace.id ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Siliniyor...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-3 h-3 mr-1" />
                            Zorla Sil
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(null)}
                        className="border-[var(--border)] text-xs"
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
                    className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 text-xs"
                  >
                    {deletingWorkspaceId === workspace.id ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Siliniyor...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3 h-3 mr-1" />
                        Workspace&apos;i Sil
                      </>
                    )}
                  </Button>
                )}
              </div>
            </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

