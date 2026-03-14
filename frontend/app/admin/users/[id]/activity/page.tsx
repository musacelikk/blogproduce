'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Activity,
  Clock,
  User,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  FileText,
  Shield,
  Settings,
  LogIn,
  LogOut,
  Trash2,
  Edit,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getAdminUserById,
  getAdminActivityLogs,
  type AdminUser,
  type ActivityLog,
} from '@/lib/api';

export default function UserActivityPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<AdminUser | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'user' | 'blog' | 'system' | 'auth'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'info' | 'warning' | 'error' | 'success'>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      loadUserData();
      loadUserLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await getAdminUserById(userId);
      setUser(userData);
    } catch (err) {
      console.error('Error loading user:', err);
      setError(err instanceof Error ? err.message : 'Kullanıcı bilgileri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const loadUserLogs = async () => {
    try {
      setLoadingLogs(true);
      const userLogs = await getAdminActivityLogs({
        userId,
        limit: 200,
      });
      setLogs(userLogs);
    } catch (err) {
      console.error('Error loading logs:', err);
      setError(err instanceof Error ? err.message : 'Loglar yüklenirken bir hata oluştu');
    } finally {
      setLoadingLogs(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user':
        return User;
      case 'blog':
        return FileText;
      case 'auth':
        return Shield;
      case 'system':
        return Settings;
      default:
        return Activity;
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('Giriş')) return LogIn;
    if (action.includes('Çıkış')) return LogOut;
    if (action.includes('oluşturuldu') || action.includes('kayıt')) return User;
    if (action.includes('silindi')) return Trash2;
    if (action.includes('düzenlendi')) return Edit;
    if (action.includes('yayınlandı')) return Eye;
    return Activity;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'success':
        return 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/50';
      case 'warning':
        return 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/50';
      case 'error':
        return 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/50';
      default:
        return 'bg-[#3B82F6]/20 text-[#3B82F6] border-[#3B82F6]/50';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'user':
        return 'bg-[#3B82F6]/20 text-[#3B82F6]';
      case 'blog':
        return 'bg-[#10B981]/20 text-[#10B981]';
      case 'auth':
        return 'bg-[#F59E0B]/20 text-[#F59E0B]';
      case 'system':
        return 'bg-[#8B5CF6]/20 text-[#8B5CF6]';
      default:
        return 'bg-[#666666]/20 text-[#ebebeb]';
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.targetName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || log.type === typeFilter;
    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
    return matchesSearch && matchesType && matchesSeverity;
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

  if (error && !user) {
    return (
      <div className="space-y-6">
        <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 text-red-400">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Hata</p>
              <p className="text-xs">{error}</p>
            </div>
          </div>
        </div>
        <Button
          onClick={() => router.push('/admin/users')}
          variant="outline"
          className="border-[#333333] text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Geri Dön
        </Button>
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
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.push('/admin/users')}
            variant="ghost"
            size="sm"
            className="text-[#ebebeb] hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri Dön
          </Button>
          <div>
            <h1
              className="text-lg font-medium text-white mb-1"
              style={{
                fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
              }}
            >
              Kullanıcı Aktiviteleri
            </h1>
            {user && (
              <p
                className="text-xs text-[#ebebeb]"
                style={{
                  fontFamily: 'var(--font-sans), "Inter", sans-serif',
                }}
              >
                {user.name} ({user.email})
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 text-red-400">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Hata</p>
              <p className="text-xs">{error}</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ebebeb]" />
              <input
                type="text"
                placeholder="Aktivite veya hedef ile ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#0f0f0f] rounded-lg border border-[#333333] text-white text-sm placeholder:text-[#ebebeb] focus:border-[#3B82F6] focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-[#0f0f0f] rounded-lg border border-[#333333] text-white text-sm focus:border-[#3B82F6] focus:outline-none transition-all"
            >
              <option value="all">Tüm Tipler</option>
              <option value="user">Kullanıcı</option>
              <option value="blog">Blog</option>
              <option value="auth">Kimlik Doğrulama</option>
              <option value="system">Sistem</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-[#0f0f0f] rounded-lg border border-[#333333] text-white text-sm focus:border-[#3B82F6] focus:outline-none transition-all"
            >
              <option value="all">Tüm Seviyeler</option>
              <option value="info">Bilgi</option>
              <option value="success">Başarılı</option>
              <option value="warning">Uyarı</option>
              <option value="error">Hata</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Toplam Aktivite', value: logs.length, color: 'bg-[#3B82F6]' },
          { label: 'Hatalar', value: logs.filter((l) => l.severity === 'error').length, color: 'bg-[#EF4444]' },
          { label: 'Uyarılar', value: logs.filter((l) => l.severity === 'warning').length, color: 'bg-[#F59E0B]' },
          { label: 'Başarılı', value: logs.filter((l) => l.severity === 'success').length, color: 'bg-[#10B981]' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333333]"
          >
            <p
              className="text-xs text-[#ebebeb] mb-1.5"
              style={{
                fontFamily: 'var(--font-sans), "Inter", sans-serif',
              }}
            >
              {stat.label}
            </p>
            <p
              className="text-2xl font-semibold text-white"
              style={{
                fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
              }}
            >
              {stat.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Logs List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="space-y-3"
      >
        {loadingLogs ? (
          <div className="bg-[#1a1a1a] rounded-xl p-8 border border-[#333333] text-center text-sm text-[#ebebeb]">
            <Loader2 className="w-6 h-6 mx-auto mb-2 text-[#3B82F6] animate-spin" />
            <p>Loglar yükleniyor...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="bg-[#1a1a1a] rounded-xl p-8 border border-[#333333] text-center text-sm text-[#ebebeb]">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Aktivite bulunamadı</p>
          </div>
        ) : (
          filteredLogs.map((log, index) => {
            const TypeIcon = getActivityIcon(log.type);
            const ActionIcon = getActionIcon(log.action);

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333333] hover:border-[#3B82F6]/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getTypeColor(log.type)}`}>
                    <TypeIcon className="w-5 h-5" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <ActionIcon className="w-4 h-4 text-[#ebebeb]" />
                          <p
                            className="text-white font-medium text-sm"
                            style={{
                              fontFamily: 'var(--font-sans), "Inter", sans-serif',
                            }}
                          >
                            {log.action}
                          </p>
                          <span className={`px-2 py-0.5 rounded text-xs border ${getSeverityColor(log.severity)}`}>
                            {log.severity}
                          </span>
                        </div>

                        {log.targetName && (
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="w-3 h-3 text-[#ebebeb]" />
                            <span
                              className="text-xs text-[#ebebeb]"
                              style={{
                                fontFamily: 'var(--font-sans), "Inter", sans-serif',
                              }}
                            >
                              {log.targetType}: {log.targetName}
                            </span>
                          </div>
                        )}

                        {log.details && (
                          <div className="mt-2 p-2 bg-[#0f0f0f] rounded-lg">
                            <pre
                              className="text-xs text-[#ebebeb] font-mono"
                              style={{
                                fontFamily: 'var(--font-mono), "JetBrains Mono", monospace',
                              }}
                            >
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-2 text-xs text-[#ebebeb] mb-2">
                          <Clock className="w-4 h-4" />
                          <span
                            style={{
                              fontFamily: 'var(--font-sans), "Inter", sans-serif',
                            }}
                          >
                            {new Date(log.timestamp || log.createdAt || '').toLocaleString('tr-TR')}
                          </span>
                        </div>
                        {log.ipAddress && (
                          <p
                            className="text-xs text-[#ebebeb] font-mono"
                            style={{
                              fontFamily: 'var(--font-mono), "JetBrains Mono", monospace',
                            }}
                          >
                            IP: {log.ipAddress}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>
    </div>
  );
}

