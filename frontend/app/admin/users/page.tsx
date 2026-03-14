'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Shield,
  User,
  Mail,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  FileText,
  UserPlus,
  Activity,
  Clock,
  XCircle,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getAdminUsers,
  updateAdminUserRole,
  updateAdminUser,
  deleteAdminUser,
  getAdminUserById,
  getAdminActivityLogs,
  getAdminPlans,
  updateAdminUserPlan,
  type AdminUser,
  type ActivityLog,
  type PlanDefinition,
} from '@/lib/api';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'createdAt' | 'blogsCount'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
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

  const toggleRowExpansion = (userId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedRows(newExpanded);
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-2 text-[#3B82F6] animate-spin" />
          <p className="text-xs text-[#ebebeb]">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-lg font-medium text-white mb-1"
              style={{
                fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
              }}
            >
              Kullanıcı Yönetimi
            </h1>
            <p
              className="text-xs text-[#ebebeb]"
              style={{
                fontFamily: 'var(--font-sans), "Inter", sans-serif',
              }}
            >
              Tüm kullanıcıları görüntüleyin ve yönetin
            </p>
          </div>
          <Button
            onClick={() => {
              // TODO: Kullanıcı ekleme modalı açılacak
              alert('Kullanıcı ekleme özelliği yakında eklenecek');
            }}
            className="flex items-center gap-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white px-4 py-2 rounded-lg transition-colors text-sm"
          >
            <UserPlus className="w-4 h-4" />
            Kullanıcı Ekle
          </Button>
        </div>
      </motion.div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 text-red-400">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Hata</p>
              <p>{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333333]"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ebebeb]" />
            <input
              type="text"
              placeholder="Kullanıcı ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#0f0f0f] rounded-lg border border-[#333333] text-white text-sm placeholder:text-[#ebebeb] focus:border-[#3B82F6] focus:outline-none"
              style={{
                fontFamily: 'var(--font-sans), "Inter", sans-serif',
              }}
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-[#0f0f0f] rounded-lg border border-[#333333] text-white text-sm focus:border-[#3B82F6] focus:outline-none"
            style={{
              fontFamily: 'var(--font-sans), "Inter", sans-serif',
            }}
          >
            <option value="all">Tüm Roller</option>
            <option value="user">Kullanıcı</option>
            <option value="admin">Admin</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-[#0f0f0f] rounded-lg border border-[#333333] text-white text-sm focus:border-[#3B82F6] focus:outline-none"
            style={{
              fontFamily: 'var(--font-sans), "Inter", sans-serif',
            }}
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
            className="px-3 py-1.5 bg-[#0f0f0f] rounded-lg border border-[#333333] text-white text-sm focus:border-[#3B82F6] focus:outline-none"
            style={{
              fontFamily: 'var(--font-sans), "Inter", sans-serif',
            }}
          >
            <option value="createdAt-desc">Yeni → Eski</option>
            <option value="createdAt-asc">Eski → Yeni</option>
            <option value="name-asc">İsim (A-Z)</option>
            <option value="name-desc">İsim (Z-A)</option>
            <option value="blogsCount-desc">En Çok Blog</option>
            <option value="blogsCount-asc">En Az Blog</option>
          </select>
        </div>
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-[#1a1a1a] rounded-xl border border-[#333333] overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0f0f0f] border-b border-[#333333]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#ebebeb]">Kullanıcı</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#ebebeb]">Rol</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#ebebeb]">Bloglar</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#ebebeb]">Durum</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#ebebeb]">Kayıt Tarihi</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-[#ebebeb]">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#333333]">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-[#0f0f0f] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#3B82F6] rounded-full flex items-center justify-center text-white font-medium text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p
                            className="text-white font-medium text-sm"
                            style={{
                              fontFamily: 'var(--font-sans), "Inter", sans-serif',
                            }}
                          >
                            {user.name}
                          </p>
                          <p
                            className="text-xs text-[#ebebeb]"
                            style={{
                              fontFamily: 'var(--font-sans), "Inter", sans-serif',
                            }}
                          >
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as 'user' | 'admin')}
                        disabled={actionLoading === user.id}
                        className="px-3 py-1.5 bg-[#0f0f0f] rounded-lg border border-[#333333] text-white text-xs focus:border-[#3B82F6] focus:outline-none disabled:opacity-50"
                        style={{
                          fontFamily: 'var(--font-sans), "Inter", sans-serif',
                        }}
                      >
                        <option value="user">Kullanıcı</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-[#ebebeb]" />
                        <span className="text-white text-sm">{user.blogsCount}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.status === 'active'
                          ? 'bg-[#10B981]/20 text-[#10B981]'
                          : 'bg-[#EF4444]/20 text-[#EF4444]'
                      }`}>
                        {user.status === 'active' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {user.status === 'active' ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p
                        className="text-xs text-[#ebebeb]"
                        style={{
                          fontFamily: 'var(--font-sans), "Inter", sans-serif',
                        }}
                      >
                        {new Date(user.createdAt).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
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
                          className="text-[#3B82F6] hover:text-[#2563EB] hover:bg-[#3B82F6]/10 p-2"
                          title="Düzenle"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            window.location.href = `/admin/users/${user.id}/activity`;
                          }}
                          className="text-[#10B981] hover:text-[#059669] hover:bg-[#10B981]/10 p-2"
                          title="Aktiviteleri Görüntüle"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={actionLoading === user.id}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2"
                          title="Sil"
                        >
                          {actionLoading === user.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#ebebeb]">
                    <p>Kullanıcı bulunamadı</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="px-6 py-3 bg-[#0f0f0f] border-t border-[#333333]">
          <p
            className="text-xs text-[#ebebeb]"
            style={{
              fontFamily: 'var(--font-sans), "Inter", sans-serif',
            }}
          >
            Toplam {filteredUsers.length} kullanıcı gösteriliyor
          </p>
        </div>
      </motion.div>

      {/* Edit User Modal */}
      {editingUser && editFormData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#1a1a1a] rounded-xl border border-[#333333] w-full max-w-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#333333] flex items-center justify-between">
              <div>
                <h2
                  className="text-lg font-medium text-white"
                  style={{
                    fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
                  }}
                >
                  Kullanıcı Düzenle
                </h2>
                <p
                  className="text-xs text-[#ebebeb] mt-1"
                  style={{
                    fontFamily: 'var(--font-sans), "Inter", sans-serif',
                  }}
                >
                  {editingUser.email}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingUser(null);
                  setEditFormData(null);
                }}
                className="text-[#ebebeb] hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  <label
                    className="text-xs text-[#ebebeb] mb-1.5 block"
                    style={{
                      fontFamily: 'var(--font-sans), "Inter", sans-serif',
                    }}
                  >
                    İsim
                  </label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f0f0f] rounded-lg border border-[#333333] text-white text-sm focus:border-[#3B82F6] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    className="text-xs text-[#ebebeb] mb-1.5 block"
                    style={{
                      fontFamily: 'var(--font-sans), "Inter", sans-serif',
                    }}
                  >
                    E-posta
                  </label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f0f0f] rounded-lg border border-[#333333] text-white text-sm focus:border-[#3B82F6] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    className="text-xs text-[#ebebeb] mb-1.5 block"
                    style={{
                      fontFamily: 'var(--font-sans), "Inter", sans-serif',
                    }}
                  >
                    Rol
                  </label>
                  <select
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as 'user' | 'admin' })}
                    className="w-full px-3 py-2 bg-[#0f0f0f] rounded-lg border border-[#333333] text-white text-sm focus:border-[#3B82F6] focus:outline-none"
                  >
                    <option value="user">Kullanıcı</option>
                    <option value="admin">Yönetici</option>
                  </select>
                </div>

                <div>
                  <label
                    className="text-xs text-[#ebebeb] mb-1.5 block"
                    style={{
                      fontFamily: 'var(--font-sans), "Inter", sans-serif',
                    }}
                  >
                    Plan
                  </label>
                  <select
                    value={editFormData.planId || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, planId: e.target.value || null })}
                    className="w-full px-3 py-2 bg-[#0f0f0f] rounded-lg border border-[#333333] text-white text-sm focus:border-[#3B82F6] focus:outline-none"
                  >
                    <option value="">Plan Yok</option>
                    {plans.filter(p => p.active).map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} (${plan.price.monthly}/ay)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    className="text-xs text-[#ebebeb] mb-1.5 block"
                    style={{
                      fontFamily: 'var(--font-sans), "Inter", sans-serif',
                    }}
                  >
                    Yeni Şifre (Değiştirmek için doldurun)
                  </label>
                  <input
                    type="password"
                    value={editFormData.password || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                    placeholder="Şifre değiştirmek istemiyorsanız boş bırakın"
                    className="w-full px-3 py-2 bg-[#0f0f0f] rounded-lg border border-[#333333] text-white text-sm focus:border-[#3B82F6] focus:outline-none placeholder:text-[#ebebeb]"
                  />
                  <p
                    className="text-xs text-[#ebebeb] mt-1.5"
                    style={{
                      fontFamily: 'var(--font-sans), "Inter", sans-serif',
                    }}
                  >
                    Şifre en az 6 karakter olmalıdır. Şifreler güvenlik için hashlenerek kaydedilir.
                  </p>
                </div>

                <div className="pt-4">
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
                    className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white text-sm"
                  >
                    {actionLoading === editingUser.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Kaydediliyor...
                      </>
                    ) : (
                      'Değişiklikleri Kaydet'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

