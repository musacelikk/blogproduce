'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Search, Filter, Calendar, User, FileText, Shield, Settings, Trash2, Edit, Eye, EyeOff, LogIn, LogOut, UserPlus, Clock } from 'lucide-react';
import { getAdminActivityLogs, type ActivityLog } from '@/lib/api';

export default function AdminActivitiesPage() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'user' | 'blog' | 'system' | 'auth'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'info' | 'warning' | 'error' | 'success'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  useEffect(() => {
    loadActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);
      
      // Backend API'den logları çek
      const logs = await getAdminActivityLogs({
        type: typeFilter !== 'all' ? typeFilter : undefined,
        severity: severityFilter !== 'all' ? severityFilter : undefined,
        limit: 100,
      });
      
      // API'den gelen veriyi frontend formatına çevir
      const formattedLogs: ActivityLog[] = logs.map((log) => ({
        id: log.id,
        type: log.type,
        action: log.action,
        user: log.user,
        target: log.targetType && log.targetId ? {
          type: log.targetType,
          id: log.targetId,
          name: log.targetName || '',
        } : undefined,
        details: log.details,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        timestamp: log.timestamp || log.createdAt || new Date().toISOString(),
        severity: log.severity,
      }));
      
      setActivities(formattedLogs);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
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
    if (action.includes('oluşturuldu') || action.includes('kayıt')) return UserPlus;
    if (action.includes('silindi')) return Trash2;
    if (action.includes('düzenlendi')) return Edit;
    if (action.includes('yayınlandı')) return Eye;
    if (action.includes('taslak')) return EyeOff;
    return Activity;
  };

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch = 
      activity.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.user?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.target?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || activity.type === typeFilter;
    const matchesSeverity = severityFilter === 'all' || activity.severity === severityFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      if (!activity.timestamp) {
        matchesDate = false;
      } else {
        const activityDate = new Date(activity.timestamp);
        const now = new Date();
        if (dateFilter === 'today') {
          matchesDate = activityDate.toDateString() === now.toDateString();
        } else if (dateFilter === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = activityDate >= weekAgo;
        } else if (dateFilter === 'month') {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = activityDate >= monthAgo;
        }
      }
    }
    
    return matchesSearch && matchesType && matchesSeverity && matchesDate;
  });

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

  const stats = {
    total: activities.length,
    today: activities.filter(a => {
      if (!a.timestamp) return false;
      const date = new Date(a.timestamp);
      return date.toDateString() === new Date().toDateString();
    }).length,
    errors: activities.filter(a => a.severity === 'error').length,
    warnings: activities.filter(a => a.severity === 'warning').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1
          className="text-lg font-medium text-white mb-1"
          style={{
            fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
          }}
        >
          Aktivite Logları
        </h1>
        <p
          className="text-xs text-[#ebebeb]"
          style={{
            fontFamily: 'var(--font-sans), "Inter", sans-serif',
          }}
        >
          Sistem genelindeki tüm aktiviteleri ve log kayıtlarını görüntüleyin
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Toplam Aktivite', value: stats.total, color: 'bg-[#3B82F6]' },
          { label: 'Bugün', value: stats.today, color: 'bg-[#10B981]' },
          { label: 'Hatalar', value: stats.errors, color: 'bg-[#EF4444]' },
          { label: 'Uyarılar', value: stats.warnings, color: 'bg-[#F59E0B]' },
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

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333333]"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ebebeb]" />
              <input
                type="text"
                placeholder="Aktivite, kullanıcı veya hedef ile ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#0f0f0f] rounded-lg border border-[#333333] text-white text-sm placeholder:text-[#ebebeb] focus:border-[#3B82F6] focus:outline-none transition-all"
                style={{
                  fontFamily: 'var(--font-sans), "Inter", sans-serif',
                }}
              />
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-[#0f0f0f] rounded-lg border border-[#333333] text-white text-sm focus:border-[#3B82F6] focus:outline-none transition-all"
              style={{
                fontFamily: 'var(--font-sans), "Inter", sans-serif',
              }}
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
              style={{
                fontFamily: 'var(--font-sans), "Inter", sans-serif',
              }}
            >
              <option value="all">Tüm Seviyeler</option>
              <option value="info">Bilgi</option>
              <option value="success">Başarılı</option>
              <option value="warning">Uyarı</option>
              <option value="error">Hata</option>
            </select>
          </div>
        </div>

        {/* Date Filter */}
        <div className="mt-4 flex items-center gap-4">
          <span
            className="text-sm text-[#ebebeb]"
            style={{
              fontFamily: 'var(--font-sans), "Inter", sans-serif',
            }}
          >
            Tarih:
          </span>
          <div className="flex items-center gap-2">
            {(['all', 'today', 'week', 'month'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setDateFilter(period)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                  dateFilter === period
                    ? 'bg-[#3B82F6] text-white'
                    : 'bg-[#0f0f0f] text-[#ebebeb] hover:text-white hover:bg-[#252525]'
                }`}
                style={{
                  fontFamily: 'var(--font-sans), "Inter", sans-serif',
                }}
              >
                {period === 'all' && 'Tümü'}
                {period === 'today' && 'Bugün'}
                {period === 'week' && 'Bu Hafta'}
                {period === 'month' && 'Bu Ay'}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Activities List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="space-y-3"
      >
        {loading ? (
          <div className="bg-[#1a1a1a] rounded-xl p-8 border border-[#333333] text-center text-sm text-[#ebebeb]">
            Yükleniyor...
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="bg-[#1a1a1a] rounded-xl p-8 border border-[#333333] text-center text-sm text-[#ebebeb]">
            Aktivite bulunamadı
          </div>
        ) : (
          filteredActivities.map((activity, index) => {
            const TypeIcon = getActivityIcon(activity.type);
            const ActionIcon = getActionIcon(activity.action);
            
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333333] hover:border-[#3B82F6]/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getTypeColor(activity.type)}`}>
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
                            {activity.action}
                          </p>
                          <span className={`px-2 py-0.5 rounded text-xs border ${getSeverityColor(activity.severity)}`}>
                            {activity.severity}
                          </span>
                        </div>
                        
                        {activity.user && (
                          <div className="flex items-center gap-2 mb-1">
                            <User className="w-3 h-3 text-[#ebebeb]" />
                            <span
                              className="text-xs text-[#ebebeb]"
                              style={{
                                fontFamily: 'var(--font-sans), "Inter", sans-serif',
                              }}
                            >
                              {activity.user.name} ({activity.user.email})
                            </span>
                          </div>
                        )}
                        
                        {activity.target && (
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="w-3 h-3 text-[#ebebeb]" />
                            <span
                              className="text-xs text-[#ebebeb]"
                              style={{
                                fontFamily: 'var(--font-sans), "Inter", sans-serif',
                              }}
                            >
                              {activity.target.type}: {activity.target.name}
                            </span>
                          </div>
                        )}
                        
                        {activity.details && (
                          <div className="mt-2 p-2 bg-[#0f0f0f] rounded-lg">
                            <pre
                              className="text-xs text-[#ebebeb] font-mono"
                              style={{
                                fontFamily: 'var(--font-mono), "JetBrains Mono", monospace',
                              }}
                            >
                              {JSON.stringify(activity.details, null, 2)}
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
                            {activity.timestamp ? new Date(activity.timestamp).toLocaleString('tr-TR') : 'N/A'}
                          </span>
                        </div>
                        {activity.ipAddress && (
                          <p
                            className="text-xs text-[#ebebeb] font-mono"
                            style={{
                              fontFamily: 'var(--font-mono), "JetBrains Mono", monospace',
                            }}
                          >
                            IP: {activity.ipAddress}
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

