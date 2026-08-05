'use client';

import { useState, useEffect } from 'react';
import {
  AlertCircle,
  BarChart3,
  CreditCard,
  Edit,
  FileText,
  Globe,
  Headphones,
  Infinity as InfinityIcon,
  Loader2,
  Palette,
  Plus,
  Save,
  Search,
  Settings,
  Trash2,
  Users,
  Webhook,
  X,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import {
  getAdminPlans,
  createAdminPlan,
  updateAdminPlan,
  deleteAdminPlan,
  type PlanDefinition,
} from '@/lib/api';

const SELECT_CLASS =
  'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

const CHECKBOX_CLASS =
  'h-4 w-4 shrink-0 rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

const LABEL_CLASS = 'mb-1.5 block text-xs font-medium text-muted-foreground';

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
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plan Yönetimi"
        description="Kullanıcı planlarını ve tarifeleri yönetin"
        actions={
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4" />
            Plan Ekle
          </Button>
        }
      />

      {/* Search */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Plan ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-[var(--destructive-muted)] p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Hata</p>
            <p className="mt-1 text-xs">{error}</p>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      {filteredPlans.length === 0 ? (
        <EmptyState
          icon={<CreditCard />}
          title="Plan bulunamadı"
          description="Arama kriterlerinize uygun bir plan yok. Yeni bir plan ekleyebilirsiniz."
          action={
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4" />
              Plan Ekle
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {filteredPlans.map((plan) => (
            <div
              key={plan.id}
              className="relative rounded-xl border border-border bg-card p-6 shadow-card transition-shadow hover:shadow-card-hover"
            >
              {plan.popular && (
                <Badge
                  variant="primary"
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2 shadow-card"
                >
                  Popüler
                </Badge>
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
            </div>
          ))}
        </div>
      )}

      {/* Add Plan Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-elevated">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Yeni Plan Ekle
              </h2>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Kapat"
                onClick={() => setShowAddModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <PlanEditForm
              plan={newPlan as PlanDefinition}
              setPlan={setNewPlan as any}
              onSave={handleCreate}
              onCancel={() => setShowAddModal(false)}
              isNew
            />
          </div>
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
      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-foreground">{plan.name}</h3>
          {!plan.active && <Badge variant="destructive">Pasif</Badge>}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-semibold tracking-tight text-foreground">
            ${plan.price.monthly}
          </span>
          <span className="text-xs text-muted-foreground">/ay</span>
        </div>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-base font-medium text-muted-foreground">${plan.price.yearly}</span>
          <span className="text-xs text-muted-foreground">/yıl</span>
        </div>
        {plan.description && (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{plan.description}</p>
        )}
      </div>

      <div className="mb-5 space-y-2">
        <FeatureItem
          icon={FileText}
          label="Maksimum Blog"
          value={
            plan.features.maxBlogs === 'unlimited' ? (
              <span className="flex items-center gap-1">
                <InfinityIcon className="h-3 w-3" />
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
                <InfinityIcon className="h-3 w-3" />
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
                <InfinityIcon className="h-3 w-3" />
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

      <div className="flex items-center gap-2 border-t border-border pt-4">
        <Button onClick={onEdit} size="sm" variant="outline" className="flex-1">
          <Edit className="h-3.5 w-3.5" />
          Düzenle
        </Button>
        <Button
          onClick={onDelete}
          size="sm"
          variant="outline"
          aria-label="Planı sil"
          className="text-destructive hover:bg-[var(--destructive-muted)] hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
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
        <label className={LABEL_CLASS}>Plan Adı</label>
        <Input
          type="text"
          value={plan.name}
          onChange={(e) => setPlan({ ...plan, name: e.target.value })}
        />
      </div>

      <div>
        <label className={LABEL_CLASS}>Seviye</label>
        <select
          value={plan.level}
          onChange={(e) => setPlan({ ...plan, level: e.target.value as 'starter' | 'pro' | 'enterprise' })}
          className={SELECT_CLASS}
        >
          <option value="starter">Başlangıç</option>
          <option value="pro">Profesyonel</option>
          <option value="enterprise">Kurumsal</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL_CLASS}>Aylık Fiyat ($)</label>
          <Input
            type="number"
            value={plan.price.monthly}
            onChange={(e) => setPlan({ ...plan, price: { ...plan.price, monthly: Number(e.target.value) } })}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>Yıllık Fiyat ($)</label>
          <Input
            type="number"
            value={plan.price.yearly}
            onChange={(e) => setPlan({ ...plan, price: { ...plan.price, yearly: Number(e.target.value) } })}
          />
        </div>
      </div>

      <div>
        <label className={LABEL_CLASS}>Açıklama</label>
        <Textarea
          value={plan.description || ''}
          onChange={(e) => setPlan({ ...plan, description: e.target.value })}
          rows={2}
        />
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Özellikler</h4>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL_CLASS}>Maksimum Blog</label>
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
              className={SELECT_CLASS}
            >
              <option value="limited">Sınırlı</option>
              <option value="unlimited">Sınırsız</option>
            </select>
          </div>
          {plan.features.maxBlogs !== 'unlimited' && (
            <div>
              <label className={LABEL_CLASS}>Blog Sayısı</label>
              <Input
                type="number"
                value={typeof plan.features.maxBlogs === 'number' ? plan.features.maxBlogs : 0}
                onChange={(e) =>
                  setPlan({
                    ...plan,
                    features: { ...plan.features, maxBlogs: Number(e.target.value) },
                  })
                }
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL_CLASS}>Token Limiti</label>
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
              className={SELECT_CLASS}
            >
              <option value="limited">Sınırlı</option>
              <option value="unlimited">Sınırsız</option>
            </select>
          </div>
          {plan.features.maxTokensPerMonth !== 'unlimited' && (
            <div>
              <label className={LABEL_CLASS}>Token Sayısı</label>
              <Input
                type="number"
                value={typeof plan.features.maxTokensPerMonth === 'number' ? plan.features.maxTokensPerMonth : 0}
                onChange={(e) =>
                  setPlan({
                    ...plan,
                    features: { ...plan.features, maxTokensPerMonth: Number(e.target.value) },
                  })
                }
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL_CLASS}>Workspace Limiti</label>
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
              className={SELECT_CLASS}
            >
              <option value="limited">Sınırlı</option>
              <option value="unlimited">Sınırsız</option>
            </select>
          </div>
          {plan.features.maxWorkspaces !== 'unlimited' && (
            <div>
              <label className={LABEL_CLASS}>Workspace Sayısı</label>
              <Input
                type="number"
                value={typeof plan.features.maxWorkspaces === 'number' ? plan.features.maxWorkspaces : 1}
                onChange={(e) =>
                  setPlan({
                    ...plan,
                    features: { ...plan.features, maxWorkspaces: Number(e.target.value) },
                  })
                }
              />
            </div>
          )}
        </div>

        <div>
          <label className={LABEL_CLASS}>
            Diller (virgülle ayırın, &apos;all&apos; tüm diller için)
          </label>
          <Input
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
            placeholder="tr, en, de, fr"
          />
        </div>

        <div>
          <label className={LABEL_CLASS}>Destek Türü</label>
          <Input
            type="text"
            value={plan.features.support}
            onChange={(e) =>
              setPlan({
                ...plan,
                features: { ...plan.features, support: e.target.value },
              })
            }
            placeholder="E-posta desteği"
          />
        </div>

        <div className="space-y-2 rounded-lg border border-border bg-secondary/60 p-3">
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
            <label key={key} className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={plan.features[key as keyof typeof plan.features] as boolean}
                onChange={(e) =>
                  setPlan({
                    ...plan,
                    features: { ...plan.features, [key]: e.target.checked },
                  })
                }
                className={CHECKBOX_CLASS}
              />
              <span className="text-xs text-foreground">{label}</span>
            </label>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={plan.popular || false}
              onChange={(e) => setPlan({ ...plan, popular: e.target.checked })}
              className={CHECKBOX_CLASS}
            />
            <span className="text-xs text-foreground">Popüler Plan</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={plan.active}
              onChange={(e) => setPlan({ ...plan, active: e.target.checked })}
              className={CHECKBOX_CLASS}
            />
            <span className="text-xs text-foreground">Aktif</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button onClick={onSave} size="sm" className="flex-1">
          <Save className="h-3.5 w-3.5" />
          {isNew ? 'Oluştur' : 'Kaydet'}
        </Button>
        <Button onClick={onCancel} size="sm" variant="outline" className="flex-1">
          <X className="h-3.5 w-3.5" />
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
    <div className="flex items-center gap-2 text-xs text-foreground">
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="text-muted-foreground">{label}:</span>
      <span>{value}</span>
    </div>
  );
}
