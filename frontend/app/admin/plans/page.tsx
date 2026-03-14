'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Edit,
  Trash2,
  Plus,
  Save,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Users,
  Zap,
  Infinity as InfinityIcon,
  FileText,
  Globe,
  Headphones,
  Settings,
  Webhook,
  Palette,
  BarChart3,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getAdminPlans,
  createAdminPlan,
  updateAdminPlan,
  deleteAdminPlan,
  type PlanDefinition,
} from '@/lib/api';

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<PlanDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [editedPlan, setEditedPlan] = useState<PlanDefinition | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlan, setNewPlan] = useState<Partial<PlanDefinition>>({
    name: '',
    level: 'starter',
    price: { monthly: 0, yearly: 0 },
    features: {
      maxBlogs: 0,
      maxTokensPerMonth: 0,
      maxWorkspaces: 1,
      languages: ['tr', 'en'],
      support: 'E-posta desteği',
      apiAccess: false,
      customTraining: false,
      accountManager: false,
      prioritySupport: false,
      webhookAccess: false,
      customBranding: false,
      advancedSeo: false,
      analytics: false,
    },
    popular: false,
    active: true,
    description: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const plansData = await getAdminPlans();
      setPlans(plansData);
    } catch (err) {
      console.error('Error loading plans:', err);
      setError(err instanceof Error ? err.message : 'Planlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan: PlanDefinition) => {
    setEditingPlan(plan.id);
    setEditedPlan({ ...plan });
  };

  const handleSave = async () => {
    if (!editedPlan) return;
    try {
      setError(null);
      await updateAdminPlan(editedPlan.id, editedPlan);
      await loadPlans();
      setEditingPlan(null);
      setEditedPlan(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Plan güncellenirken bir hata oluştu');
    }
  };

  const handleCancel = () => {
    setEditingPlan(null);
    setEditedPlan(null);
    setError(null);
  };

  const handleDelete = async (planId: string) => {
    if (!confirm('Bu planı silmek istediğinizden emin misiniz? Bu planı kullanan kullanıcılar varsa silinemez.')) {
      return;
    }
    try {
      setError(null);
      await deleteAdminPlan(planId);
      await loadPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Plan silinirken bir hata oluştu');
    }
  };

  const handleCreate = async () => {
    try {
      setError(null);
      await createAdminPlan(newPlan as Omit<PlanDefinition, 'id' | 'createdAt' | 'updatedAt'>);
      await loadPlans();
      setShowAddModal(false);
      setNewPlan({
        name: '',
        level: 'starter',
        price: { monthly: 0, yearly: 0 },
        features: {
          maxBlogs: 0,
          maxTokensPerMonth: 0,
          maxWorkspaces: 1,
          languages: ['tr', 'en'],
          support: 'E-posta desteği',
          apiAccess: false,
          customTraining: false,
          accountManager: false,
          prioritySupport: false,
          webhookAccess: false,
          customBranding: false,
          advancedSeo: false,
          analytics: false,
        },
        popular: false,
        active: true,
        description: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Plan oluşturulurken bir hata oluştu');
    }
  };

  const filteredPlans = plans.filter((plan) =>
    plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plan.level.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-2 text-[#3B82F6] animate-spin" />
          <p className="text-xs text-[#999999]">Yükleniyor...</p>
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
        className="flex items-center justify-between"
      >
        <div>
          <h1
            className="text-lg font-medium text-white mb-1"
            style={{
              fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
            }}
          >
            Plan Yönetimi
          </h1>
          <p
            className="text-xs text-[#999999]"
            style={{
              fontFamily: 'var(--font-sans), "Inter", sans-serif',
            }}
          >
            Kullanıcı planlarını ve tarifeleri yönetin
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white px-4 py-2 rounded-lg transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Plan Ekle
        </Button>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333333]"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
          <input
            type="text"
            placeholder="Plan ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#0f0f0f] rounded-lg border border-[#333333] text-white text-sm placeholder:text-[#666666] focus:border-[#3B82F6] focus:outline-none"
          />
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

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredPlans.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-[#1a1a1a] rounded-xl border border-[#333333] p-5 hover:border-[#3B82F6]/50 transition-colors relative"
          >
            {plan.popular && (
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#3B82F6] text-white px-3 py-0.5 rounded-full text-xs">
                Popüler
              </span>
            )}

            {editingPlan === plan.id ? (
              <PlanEditForm
                plan={editedPlan!}
                setPlan={setEditedPlan}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            ) : (
              <PlanDisplay
                plan={plan}
                onEdit={() => handleEdit(plan)}
                onDelete={() => handleDelete(plan.id)}
              />
            )}
          </motion.div>
        ))}
      </div>

      {/* Add Plan Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1a1a1a] rounded-xl border border-[#333333] p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-white">Yeni Plan Ekle</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#666666] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <PlanEditForm
              plan={newPlan as PlanDefinition}
              setPlan={setNewPlan as any}
              onSave={handleCreate}
              onCancel={() => setShowAddModal(false)}
              isNew
            />
          </motion.div>
        </div>
      )}
    </div>
  );
}

function PlanDisplay({
  plan,
  onEdit,
  onDelete,
}: {
  plan: PlanDefinition;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-medium text-white">{plan.name}</h3>
          {!plan.active && (
            <span className="text-xs text-red-400 bg-red-500/20 px-2 py-0.5 rounded">Pasif</span>
          )}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-semibold text-white">${plan.price.monthly}</span>
          <span className="text-xs text-[#666666]">/ay</span>
        </div>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-lg font-medium text-[#666666]">${plan.price.yearly}</span>
          <span className="text-xs text-[#666666]">/yıl</span>
        </div>
        {plan.description && (
          <p className="text-xs text-[#666666] mt-2">{plan.description}</p>
        )}
      </div>

      <div className="space-y-2 mb-4">
        <FeatureItem
          icon={FileText}
          label="Maksimum Blog"
          value={
            plan.features.maxBlogs === 'unlimited' ? (
              <span className="flex items-center gap-1">
                <InfinityIcon className="w-3 h-3" />
                Sınırsız
              </span>
            ) : (
              `Ayda ${typeof plan.features.maxBlogs === 'number' ? plan.features.maxBlogs : String(plan.features.maxBlogs || 0)} blog`
            )
          }
        />
        <FeatureItem
          icon={Zap}
          label="Token Limiti"
          value={
            plan.features.maxTokensPerMonth === 'unlimited' ? (
              <span className="flex items-center gap-1">
                <InfinityIcon className="w-3 h-3" />
                Sınırsız
              </span>
            ) : (
              `${typeof plan.features.maxTokensPerMonth === 'number' ? plan.features.maxTokensPerMonth.toLocaleString() : String(plan.features.maxTokensPerMonth || 0)} token/ay`
            )
          }
        />
        <FeatureItem
          icon={Users}
          label="Workspace"
          value={
            plan.features.maxWorkspaces === 'unlimited' ? (
              <span className="flex items-center gap-1">
                <InfinityIcon className="w-3 h-3" />
                Sınırsız
              </span>
            ) : (
              `${typeof plan.features.maxWorkspaces === 'number' ? plan.features.maxWorkspaces : String(plan.features.maxWorkspaces || 0)} workspace`
            )
          }
        />
        <FeatureItem
          icon={Globe}
          label="Diller"
          value={plan.features.languages[0] === 'all' ? 'Tüm diller' : plan.features.languages.join(', ')}
        />
        <FeatureItem
          icon={Headphones}
          label="Destek"
          value={plan.features.support}
        />
        {plan.features.apiAccess && (
          <FeatureItem icon={Zap} label="API Erişimi" value="Var" />
        )}
        {plan.features.webhookAccess && (
          <FeatureItem icon={Webhook} label="Webhook Erişimi" value="Var" />
        )}
        {plan.features.customTraining && (
          <FeatureItem icon={Settings} label="Özel Eğitim" value="Var" />
        )}
        {plan.features.accountManager && (
          <FeatureItem icon={Users} label="Hesap Yöneticisi" value="Var" />
        )}
        {plan.features.prioritySupport && (
          <FeatureItem icon={Headphones} label="Öncelikli Destek" value="Var" />
        )}
        {plan.features.customBranding && (
          <FeatureItem icon={Palette} label="Özel Markalama" value="Var" />
        )}
        {plan.features.advancedSeo && (
          <FeatureItem icon={BarChart3} label="Gelişmiş SEO" value="Var" />
        )}
        {plan.features.analytics && (
          <FeatureItem icon={BarChart3} label="Analytics" value="Var" />
        )}
      </div>

      <div className="flex items-center gap-2 pt-4 border-t border-[#333333]">
        <Button
          onClick={onEdit}
          size="sm"
          variant="outline"
          className="flex-1 border-[#333333] hover:border-[#3B82F6] text-[#ebebeb] hover:text-[#3B82F6] text-xs"
        >
          <Edit className="w-3 h-3 mr-1 text-[#ebebeb] hover:text-[#3B82F6]" />
          Düzenle
        </Button>
        <Button
          onClick={onDelete}
          size="sm"
          variant="outline"
          className="border-[#333333] hover:border-red-500 text-[#ebebeb] hover:text-red-400 text-xs"
        >
          <Trash2 className="w-3 h-3 text-[#ebebeb] hover:text-red-400" />
        </Button>
      </div>
    </>
  );
}

function PlanEditForm({
  plan,
  setPlan,
  onSave,
  onCancel,
  isNew = false,
}: {
  plan: PlanDefinition;
  setPlan: (plan: PlanDefinition) => void;
  onSave: () => void;
  onCancel: () => void;
  isNew?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-[#999999] mb-1.5 block">Plan Adı</label>
        <input
          type="text"
          value={plan.name}
          onChange={(e) => setPlan({ ...plan, name: e.target.value })}
          className="w-full px-3 py-2 bg-[#0f0f0f] rounded-lg border border-[#333333] text-white text-sm focus:border-[#3B82F6] focus:outline-none"
        />
      </div>

      <div>
        <label className="text-xs text-[#999999] mb-1.5 block">Seviye</label>
        <select
          value={plan.level}
          onChange={(e) => setPlan({ ...plan, level: e.target.value as 'starter' | 'pro' | 'enterprise' })}
          className="w-full px-3 py-2 bg-[#0f0f0f] rounded-lg border border-[#333333] text-white text-sm focus:border-[#3B82F6] focus:outline-none"
        >
          <option value="starter">Başlangıç</option>
          <option value="pro">Profesyonel</option>
          <option value="enterprise">Kurumsal</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-[#999999] mb-1.5 block">Aylık Fiyat ($)</label>
          <input
            type="number"
            value={plan.price.monthly}
            onChange={(e) => setPlan({ ...plan, price: { ...plan.price, monthly: Number(e.target.value) } })}
            className="w-full px-3 py-2 bg-[#0f0f0f] rounded-lg border border-[#333333] text-white text-sm focus:border-[#3B82F6] focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-[#999999] mb-1.5 block">Yıllık Fiyat ($)</label>
          <input
            type="number"
            value={plan.price.yearly}
            onChange={(e) => setPlan({ ...plan, price: { ...plan.price, yearly: Number(e.target.value) } })}
            className="w-full px-3 py-2 bg-[#0f0f0f] rounded-lg border border-[#333333] text-white text-sm focus:border-[#3B82F6] focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-[#999999] mb-1.5 block">Açıklama</label>
        <textarea
          value={plan.description || ''}
          onChange={(e) => setPlan({ ...plan, description: e.target.value })}
          className="w-full px-3 py-2 bg-[#0f0f0f] rounded-lg border border-[#333333] text-white text-sm focus:border-[#3B82F6] focus:outline-none"
          rows={2}
        />
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-white">Özellikler</h4>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-[#999999] mb-1.5 block">Maksimum Blog</label>
            <select
              value={plan.features.maxBlogs === 'unlimited' ? 'unlimited' : 'limited'}
              onChange={(e) =>
                setPlan({
                  ...plan,
                  features: {
                    ...plan.features,
                    maxBlogs: e.target.value === 'unlimited' ? 'unlimited' : plan.features.maxBlogs,
                  },
                })
              }
              className="w-full px-3 py-2 bg-[#0f0f0f] rounded-lg border border-[#333333] text-white text-sm focus:border-[#3B82F6] focus:outline-none"
            >
              <option value="limited">Sınırlı</option>
              <option value="unlimited">Sınırsız</option>
            </select>
          </div>
          {plan.features.maxBlogs !== 'unlimited' && (
            <div>
              <label className="text-xs text-[#999999] mb-1.5 block">Blog Sayısı</label>
              <input
                type="number"
                value={typeof plan.features.maxBlogs === 'number' ? plan.features.maxBlogs : 0}
                onChange={(e) =>
                  setPlan({
                    ...plan,
                    features: { ...plan.features, maxBlogs: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 bg-[#0f0f0f] rounded-lg border border-[#333333] text-white text-sm focus:border-[#3B82F6] focus:outline-none"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-[#999999] mb-1.5 block">Token Limiti</label>
            <select
              value={plan.features.maxTokensPerMonth === 'unlimited' ? 'unlimited' : 'limited'}
              onChange={(e) =>
                setPlan({
                  ...plan,
                  features: {
                    ...plan.features,
                    maxTokensPerMonth: e.target.value === 'unlimited' ? 'unlimited' : plan.features.maxTokensPerMonth,
                  },
                })
              }
              className="w-full px-3 py-2 bg-[#0f0f0f] rounded-lg border border-[#333333] text-white text-sm focus:border-[#3B82F6] focus:outline-none"
            >
              <option value="limited">Sınırlı</option>
              <option value="unlimited">Sınırsız</option>
            </select>
          </div>
          {plan.features.maxTokensPerMonth !== 'unlimited' && (
            <div>
              <label className="text-xs text-[#999999] mb-1.5 block">Token Sayısı</label>
              <input
                type="number"
                value={typeof plan.features.maxTokensPerMonth === 'number' ? plan.features.maxTokensPerMonth : 0}
                onChange={(e) =>
                  setPlan({
                    ...plan,
                    features: { ...plan.features, maxTokensPerMonth: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 bg-[#0f0f0f] rounded-lg border border-[#333333] text-white text-sm focus:border-[#3B82F6] focus:outline-none"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-[#999999] mb-1.5 block">Workspace Limiti</label>
            <select
              value={plan.features.maxWorkspaces === 'unlimited' ? 'unlimited' : 'limited'}
              onChange={(e) =>
                setPlan({
                  ...plan,
                  features: {
                    ...plan.features,
                    maxWorkspaces: e.target.value === 'unlimited' ? 'unlimited' : plan.features.maxWorkspaces,
                  },
                })
              }
              className="w-full px-3 py-2 bg-[#0f0f0f] rounded-lg border border-[#333333] text-white text-sm focus:border-[#3B82F6] focus:outline-none"
            >
              <option value="limited">Sınırlı</option>
              <option value="unlimited">Sınırsız</option>
            </select>
          </div>
          {plan.features.maxWorkspaces !== 'unlimited' && (
            <div>
              <label className="text-xs text-[#999999] mb-1.5 block">Workspace Sayısı</label>
              <input
                type="number"
                value={typeof plan.features.maxWorkspaces === 'number' ? plan.features.maxWorkspaces : 1}
                onChange={(e) =>
                  setPlan({
                    ...plan,
                    features: { ...plan.features, maxWorkspaces: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 bg-[#0f0f0f] rounded-lg border border-[#333333] text-white text-sm focus:border-[#3B82F6] focus:outline-none"
              />
            </div>
          )}
        </div>

        <div>
          <label className="text-xs text-[#999999] mb-1.5 block">Diller (virgülle ayırın, &apos;all&apos; tüm diller için)</label>
          <input
            type="text"
            value={Array.isArray(plan.features.languages) ? plan.features.languages.join(', ') : plan.features.languages}
            onChange={(e) =>
              setPlan({
                ...plan,
                features: {
                  ...plan.features,
                  languages: e.target.value.split(',').map((l) => l.trim()),
                },
              })
            }
            className="w-full px-3 py-2 bg-[#0f0f0f] rounded-lg border border-[#333333] text-white text-sm focus:border-[#3B82F6] focus:outline-none"
            placeholder="tr, en, de, fr"
          />
        </div>

        <div>
          <label className="text-xs text-[#999999] mb-1.5 block">Destek Türü</label>
          <input
            type="text"
            value={plan.features.support}
            onChange={(e) =>
              setPlan({
                ...plan,
                features: { ...plan.features, support: e.target.value },
              })
            }
            className="w-full px-3 py-2 bg-[#0f0f0f] rounded-lg border border-[#333333] text-white text-sm focus:border-[#3B82F6] focus:outline-none"
            placeholder="E-posta desteği"
          />
        </div>

        <div className="space-y-2">
          {[
            { key: 'apiAccess', label: 'API Erişimi' },
            { key: 'webhookAccess', label: 'Webhook Erişimi' },
            { key: 'customTraining', label: 'Özel Eğitim' },
            { key: 'accountManager', label: 'Hesap Yöneticisi' },
            { key: 'prioritySupport', label: 'Öncelikli Destek' },
            { key: 'customBranding', label: 'Özel Markalama' },
            { key: 'advancedSeo', label: 'Gelişmiş SEO' },
            { key: 'analytics', label: 'Analytics' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={plan.features[key as keyof typeof plan.features] as boolean}
                onChange={(e) =>
                  setPlan({
                    ...plan,
                    features: { ...plan.features, [key]: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded border-[#333333] bg-[#0f0f0f] text-[#3B82F6] focus:ring-[#3B82F6]"
              />
              <span className="text-xs text-[#999999]">{label}</span>
            </label>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={plan.popular || false}
              onChange={(e) => setPlan({ ...plan, popular: e.target.checked })}
              className="w-4 h-4 rounded border-[#333333] bg-[#0f0f0f] text-[#3B82F6] focus:ring-[#3B82F6]"
            />
            <span className="text-xs text-[#999999]">Popüler Plan</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={plan.active}
              onChange={(e) => setPlan({ ...plan, active: e.target.checked })}
              className="w-4 h-4 rounded border-[#333333] bg-[#0f0f0f] text-[#3B82F6] focus:ring-[#3B82F6]"
            />
            <span className="text-xs text-[#999999]">Aktif</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button
          onClick={onSave}
          size="sm"
          className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs"
        >
          <Save className="w-3 h-3 mr-1" />
          {isNew ? 'Oluştur' : 'Kaydet'}
        </Button>
        <Button
          onClick={onCancel}
          size="sm"
          variant="outline"
          className="flex-1 border-[#333333] text-white text-xs"
        >
          <X className="w-3 h-3 mr-1" />
          İptal
        </Button>
      </div>
    </div>
  );
}

function FeatureItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-xs text-[#999999]">
      <Icon className="w-3.5 h-3.5" />
      <span className="text-[#666666]">{label}:</span>
      <span>{value}</span>
    </div>
  );
}
