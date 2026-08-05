'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Trash2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  FileText,
  UserPlus,
  XCircle,
  Eye,
  Edit,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  getAdminUsers,
  updateAdminUserRole,
  updateAdminUser,
  deleteAdminUser,
  getAdminUserById,
  getAdminPlans,
  updateAdminUserPlan,
  type AdminUser,
  type PlanDefinition,
} from '@/lib/api';

const selectClass =
  'h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'createdAt' | 'blogsCount'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<{ name: string; email: string; role: 'user' | 'admin'; password?: string; planId?: string | null } | null>(null);
  const [plans, setPlans] = useState<PlanDefinition[]>([]);

  useEffect(() => {
    loadUsers();
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const plansData = await getAdminPlans();
      setPlans(plansData);
    } catch (err) {
      console.error('Error loading plans:', err);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const usersData = await getAdminUsers();
      setUsers(usersData);
    } catch (err) {
      console.error('Error loading users:', err);
      setError(err instanceof Error ? err.message : 'Kullanıcılar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      setActionLoading(userId);
      await updateAdminUserRole(userId, newRole);
      await loadUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Rol güncellenirken bir hata oluştu');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      setActionLoading(userId);
      await deleteAdminUser(userId);
      await loadUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Kullanıcı silinirken bir hata oluştu');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users
    .filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    })
    .sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      if (sortBy === 'createdAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
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
    <div className="space-y-6">
      <PageHeader
        title="Kullanıcı Yönetimi"
        description="Tüm kullanıcıları görüntüleyin ve yönetin"
        actions={
          <Button
            onClick={() => {
              // TODO: Kullanıcı ekleme modalı açılacak
              alert('Kullanıcı ekleme özelliği yakında eklenecek');
            }}
          >
            <UserPlus className="h-4 w-4" />
            Kullanıcı Ekle
          </Button>
        }
      />

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-[var(--destructive-muted)] p-4">
          <div className="flex items-start gap-2 text-destructive">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium">Hata</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Kullanıcı ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-card pl-9"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            aria-label="Rol filtresi"
            className={selectClass}
          >
            <option value="all">Tüm Roller</option>
            <option value="user">Kullanıcı</option>
            <option value="admin">Admin</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            aria-label="Durum filtresi"
            className={selectClass}
          >
            <option value="all">Tüm Durumlar</option>
            <option value="active">Aktif</option>
            <option value="inactive">Pasif</option>
          </select>

          {/* Sort */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field as any);
              setSortOrder(order as any);
            }}
            aria-label="Sıralama"
            className={selectClass}
          >
            <option value="createdAt-desc">Yeni → Eski</option>
            <option value="createdAt-asc">Eski → Yeni</option>
            <option value="name-asc">İsim (A-Z)</option>
            <option value="name-desc">İsim (Z-A)</option>
            <option value="blogsCount-desc">En Çok Blog</option>
            <option value="blogsCount-asc">En Az Blog</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {filteredUsers.length > 0 ? (
        <div className="space-y-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kullanıcı</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Bloglar</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Kayıt Tarihi</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as 'user' | 'admin')}
                      disabled={actionLoading === user.id}
                      aria-label="Kullanıcı rolü"
                      className="h-9 rounded-lg border border-input bg-card px-2.5 text-xs text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="user">Kullanıcı</option>
                      <option value="admin">Admin</option>
                    </select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm text-foreground">{user.blogsCount}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === 'active' ? 'success' : 'destructive'}>
                      {user.status === 'active' ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      {user.status === 'active' ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={async () => {
                          try {
                            const userData = await getAdminUserById(user.id);
                            setEditingUser(userData);
                            setEditFormData({
                              name: userData.name,
                              email: userData.email,
                              role: userData.role as 'user' | 'admin',
                              password: '', // Password is not pre-filled for security
                              planId: (userData as any).planId || null,
                            });
                          } catch (err) {
                            console.error('Error loading user data:', err);
                            setError(err instanceof Error ? err.message : 'Kullanıcı bilgileri yüklenirken bir hata oluştu');
                          }
                        }}
                        aria-label="Düzenle"
                        title="Düzenle"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          window.location.href = `/admin/users/${user.id}/activity`;
                        }}
                        aria-label="Aktiviteleri Görüntüle"
                        title="Aktiviteleri Görüntüle"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={actionLoading === user.id}
                        aria-label="Sil"
                        title="Sil"
                        className="text-destructive hover:bg-[var(--destructive-muted)] hover:text-destructive"
                      >
                        {actionLoading === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Summary */}
          <p className="text-xs text-muted-foreground">
            Toplam {filteredUsers.length} kullanıcı gösteriliyor
          </p>
        </div>
      ) : (
        <EmptyState
          icon={<Users />}
          title="Kullanıcı bulunamadı"
          description="Arama ve filtre kriterlerinize uyan kullanıcı yok."
        />
      )}

      {/* Edit User Modal */}
      {editingUser && editFormData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
          <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-elevated">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-foreground">Kullanıcı Düzenle</h2>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{editingUser.email}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditingUser(null);
                  setEditFormData(null);
                }}
                aria-label="Kapat"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="edit-name" className="block text-sm font-medium text-foreground">
                    İsim
                  </label>
                  <Input
                    id="edit-name"
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="bg-card"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="edit-email" className="block text-sm font-medium text-foreground">
                    E-posta
                  </label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="bg-card"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="edit-role" className="block text-sm font-medium text-foreground">
                    Rol
                  </label>
                  <select
                    id="edit-role"
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as 'user' | 'admin' })}
                    className={selectClass}
                  >
                    <option value="user">Kullanıcı</option>
                    <option value="admin">Yönetici</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="edit-plan" className="block text-sm font-medium text-foreground">
                    Plan
                  </label>
                  <select
                    id="edit-plan"
                    value={editFormData.planId || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, planId: e.target.value || null })}
                    className={selectClass}
                  >
                    <option value="">Plan Yok</option>
                    {plans.filter(p => p.active).map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} (${plan.price.monthly}/ay)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="edit-password" className="block text-sm font-medium text-foreground">
                    Yeni Şifre (Değiştirmek için doldurun)
                  </label>
                  <Input
                    id="edit-password"
                    type="password"
                    value={editFormData.password || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                    placeholder="Şifre değiştirmek istemiyorsanız boş bırakın"
                    className="bg-card"
                  />
                  <p className="text-xs text-muted-foreground">
                    Şifre en az 6 karakter olmalıdır. Şifreler güvenlik için hashlenerek kaydedilir.
                  </p>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={async () => {
                      if (!editFormData) return;
                      try {
                        setActionLoading(editingUser.id);
                        // Only send password if it's provided (not empty)
                        const updateData: { name?: string; email?: string; role?: 'user' | 'admin'; password?: string } = {
                          name: editFormData.name,
                          email: editFormData.email,
                          role: editFormData.role,
                        };
                        if (editFormData.password && editFormData.password.trim().length > 0) {
                          if (editFormData.password.length < 6) {
                            setError('Şifre en az 6 karakter olmalıdır');
                            setActionLoading(null);
                            return;
                          }
                          updateData.password = editFormData.password;
                        }
                        await updateAdminUser(editingUser.id, updateData);

                        // Update user plan separately
                        if (editFormData.planId !== undefined) {
                          await updateAdminUserPlan(editingUser.id, editFormData.planId);
                        }

                        await loadUsers();
                        setEditingUser(null);
                        setEditFormData(null);
                      } catch (err) {
                        setError(err instanceof Error ? err.message : 'Kullanıcı güncellenirken bir hata oluştu');
                      } finally {
                        setActionLoading(null);
                      }
                    }}
                    disabled={actionLoading === editingUser.id}
                    className="w-full"
                  >
                    {actionLoading === editingUser.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Kaydediliyor...
                      </>
                    ) : (
                      'Değişiklikleri Kaydet'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
