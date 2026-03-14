'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
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
        <h1
          className="text-lg font-medium text-white mb-1"
          style={{
            fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
          }}
        >
          Workspace Yönetimi
        </h1>
        <p className="text-xs text-[#ebebeb]">
          Tüm workspace&apos;leri görüntüleyin ve yönetin
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333333]"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#ebebeb] mb-1">Toplam Workspace</p>
              <p className="text-lg font-semibold text-white">{workspaces.length}</p>
            </div>
            <Building2 className="w-8 h-8 text-[#3B82F6] opacity-50" />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333333]"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#ebebeb] mb-1">Toplam Blog</p>
              <p className="text-lg font-semibold text-white">
                {workspaces.reduce((sum, w) => sum + (w.postsCount || 0), 0)}
              </p>
            </div>
            <FileText className="w-8 h-8 text-[#10B981] opacity-50" />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333333]"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#ebebeb] mb-1">Benzersiz Sahipler</p>
              <p className="text-lg font-semibold text-white">{uniqueOwners.length}</p>
            </div>
            <Users className="w-8 h-8 text-[#8B5CF6] opacity-50" />
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333333]"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ebebeb]" />
            <input
              type="text"
              placeholder="Workspace, açıklama, site URL veya sahip ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#0f0f0f] rounded-lg border border-[#333333] text-white text-sm placeholder:text-[#ebebeb] focus:border-[#3B82F6] focus:outline-none"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ebebeb]" />
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#0f0f0f] rounded-lg border border-[#333333] text-white text-sm focus:border-[#3B82F6] focus:outline-none appearance-none"
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
      </motion.div>

      {/* Workspaces List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="space-y-3"
      >
        {error ? (
          <div className="bg-[#1a1a1a] rounded-xl p-8 border border-[#333333] text-center">
            <AlertCircle className="w-10 h-10 mx-auto mb-2 text-red-500" />
            <p className="text-sm text-[#ebebeb]">{error}</p>
          </div>
        ) : filteredWorkspaces.length === 0 ? (
          <div className="bg-[#1a1a1a] rounded-xl p-12 border border-[#333333] text-center text-[#ebebeb]">
            <Building2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>Workspace bulunamadı</p>
          </div>
        ) : (
          filteredWorkspaces.map((workspace, index) => (
            <motion.div
              key={workspace.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="bg-[#1a1a1a] rounded-xl p-5 border border-[#333333] hover:border-[#3B82F6]/50 transition-all cursor-pointer group"
              onClick={() => window.location.href = `/admin/workspaces/${workspace.id}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    {workspace.color && (
                      <div
                        className="w-5 h-5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: workspace.color }}
                      />
                    )}
                    <h3
                      className="text-base font-medium text-white group-hover:text-[#3B82F6] transition-colors truncate"
                      style={{
                        fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
                      }}
                    >
                      {workspace.name}
                    </h3>
                  </div>
                  {workspace.description && (
                    <p className="text-xs text-[#ebebeb] mb-3 line-clamp-2">
                      {workspace.description}
                    </p>
                  )}
                  {workspace.siteUrl && (
                    <div className="flex items-center gap-2 text-xs text-[#3B82F6] mb-3">
                      <Globe className="w-3.5 h-3.5 flex-shrink-0" />
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
                    </div>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    {workspace.owner && (
                      <div className="flex items-center gap-2 text-xs text-[#ebebeb] min-w-0">
                        <User className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate" title={workspace.owner.name || workspace.owner.email}>
                          {workspace.owner.name || workspace.owner.email}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-[#ebebeb]">
                      <FileText className="w-4 h-4 flex-shrink-0" />
                      <span>{workspace.postsCount || 0} Blog</span>
                    </div>
                    {workspace.sites && workspace.sites.length > 0 ? (
                      <div className="flex items-center gap-2 text-xs text-[#ebebeb]">
                        <Globe className="w-4 h-4 flex-shrink-0" />
                        <span>{workspace.sites.length} Site</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-[#ebebeb]">
                        <Globe className="w-4 h-4 flex-shrink-0 opacity-30" />
                        <span className="text-[#555555]">Site Yok</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-[#ebebeb]">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">
                        {new Date(workspace.createdAt).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Link href={`/admin/workspaces/${workspace.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-white/80 border-[#333333] hover:border-[#3B82F6] hover:text-[#3B82F6] text-xs"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Detaylar
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
}

