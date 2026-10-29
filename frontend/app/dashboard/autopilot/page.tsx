'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  Globe,
  Loader2,
  ListPlus,
  Plus,
  Save,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, fieldClasses } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  getWorkspaces,
  getSites,
  createSite,
  getAutopilotConfig,
  saveAutopilotConfig,
  getAutopilotTiers,
  getAutopilotTopics,
  planAutopilotTopics,
  rejectAutopilotTopic,
  type Workspace,
  type Site,
  type AutopilotConfig,
  type AutopilotConfigInput,
  type AutopilotTier,
  type TopicIdea,
} from '@/lib/api';

/** Weeks per month, for turning a weekly cadence into a monthly projection. */
const WEEKS_PER_MONTH = 52 / 12;

const DEFAULTS: AutopilotConfigInput = {
  enabled: false,
  postsPerWeek: 2,
  maxPostsPerMonth: 10,
  tier: 'standard',
  language: 'tr',
  tone: 'professional',
  length: 'medium',
  seoMode: true,
  autoPublish: false,
  niche: '',
  targetAudience: '',
  keywords: '',
  excludedTopics: '',
};

/**
 * Cadence presets, in articles per week — the unit the backend spaces runs by
 * (7 / postsPerWeek days apart). Offered as presets because "every 3.5 days" is
 * not how anyone decides how often to publish.
 */
const CADENCE_PRESETS = [
  { postsPerWeek: 14, label: 'Günde 2', perMonth: 60 },
  { postsPerWeek: 7, label: 'Günde 1', perMonth: 30 },
  { postsPerWeek: 3, label: 'Haftada 3', perMonth: 13 },
  { postsPerWeek: 2, label: 'Haftada 2', perMonth: 9 },
  { postsPerWeek: 1, label: 'Haftada 1', perMonth: 4 },
] as const;

const PUBLISH_MODES = [
  {
    autoPublish: false,
    label: 'Taslağa al, ben onaylayayım',
    hint: 'Makale DRAFT olarak bekler. Yayına yalnızca siz onayladığınızda çıkar.',
  },
  {
    autoPublish: true,
    label: 'Doğrudan yayınla',
    hint: 'Üretim biter, makale otomatik yayına girer. İnsan kontrolü olmaz.',
  },
] as const;

const STATUS_LABELS: Record<TopicIdea['status'], { label: string; variant: 'default' | 'success' | 'warning' }> = {
  planned: { label: 'Sırada', variant: 'default' },
  used: { label: 'Üretildi', variant: 'success' },
  rejected: { label: 'Atlandı', variant: 'warning' },
};

export default function AutopilotPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [workspaceId, setWorkspaceId] = useState('');
  const [siteId, setSiteId] = useState('');

  const [form, setForm] = useState<AutopilotConfigInput>(DEFAULTS);
  const [config, setConfig] = useState<AutopilotConfig | null>(null);
  const [tiers, setTiers] = useState<AutopilotTier[]>([]);
  const [topics, setTopics] = useState<TopicIdea[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingSite, setLoadingSite] = useState(false);
  const [saving, setSaving] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [showNewSite, setShowNewSite] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteDomain, setNewSiteDomain] = useState('');

  // --------------------------------------------------------------- bootstrap

  useEffect(() => {
    (async () => {
      try {
        const [ws, tierList] = await Promise.all([getWorkspaces(), getAutopilotTiers()]);
        setWorkspaces(ws);
        setTiers(tierList);
        if (ws.length > 0) setWorkspaceId(ws[0].id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Veriler yüklenemedi.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!workspaceId) return;
    (async () => {
      try {
        const list = await getSites(workspaceId);
        setSites(list);
        setSiteId(list.length > 0 ? list[0].id : '');
        if (list.length === 0) setShowNewSite(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Siteler yüklenemedi.');
      }
    })();
  }, [workspaceId]);

  const loadSiteState = useCallback(async (id: string) => {
    setLoadingSite(true);
    setError('');
    try {
      const [cfg, topicList] = await Promise.all([
        getAutopilotConfig(id),
        getAutopilotTopics(id),
      ]);
      setConfig(cfg);
      setTopics(topicList);
      // A site with no config yet starts from the defaults rather than an empty form.
      setForm(cfg ? pickInput(cfg) : DEFAULTS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Otopilot ayarı yüklenemedi.');
    } finally {
      setLoadingSite(false);
    }
  }, []);

  useEffect(() => {
    if (siteId) void loadSiteState(siteId);
  }, [siteId, loadSiteState]);

  // ------------------------------------------------------------- projections

  const selectedTier = useMemo(
    () => tiers.find((t) => t.tier === form.tier) ?? null,
    [tiers, form.tier],
  );

  /**
   * What this cadence will actually cost per month. The monthly cap is applied
   * here too, because that cap — not the cadence — is the real ceiling.
   */
  const projection = useMemo(() => {
    if (!selectedTier) return null;
    const fromCadence = (form.postsPerWeek ?? 0) * WEEKS_PER_MONTH;
    const articles = Math.min(fromCadence, form.maxPostsPerMonth ?? fromCadence);
    return {
      articles: Math.round(articles),
      capped: fromCadence > (form.maxPostsPerMonth ?? Infinity),
      monthlyUsd: articles * selectedTier.estimatedCostPerArticleUsd,
    };
  }, [selectedTier, form.postsPerWeek, form.maxPostsPerMonth]);

  // ----------------------------------------------------------------- actions

  function set<K extends keyof AutopilotConfigInput>(key: K, value: AutopilotConfigInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setNotice('');
  }

  async function handleSave() {
    if (!siteId) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const saved = await saveAutopilotConfig(siteId, form);
      setConfig(saved);
      setForm(pickInput(saved));
      setNotice(
        saved.enabled
          ? 'Kaydedildi. Otopilot açık — ilk makale bir saat içinde üretime girer.'
          : 'Kaydedildi. Otopilot şu an kapalı.',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  }

  async function handlePlanTopics() {
    if (!siteId) return;
    setPlanning(true);
    setError('');
    setNotice('');
    try {
      const { added } = await planAutopilotTopics(siteId);
      setTopics(await getAutopilotTopics(siteId));
      setNotice(
        added > 0
          ? `${added} yeni konu planlandı.`
          : 'Yeni konu eklenmedi — üretilen başlıkların tümü sitede zaten var.',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Konu planlanamadı.');
    } finally {
      setPlanning(false);
    }
  }

  async function handleRejectTopic(topicId: string) {
    setError('');
    // Optimistic: the row is a queue entry, and a failed reject is re-read below.
    setTopics((prev) =>
      prev.map((t) => (t.id === topicId ? { ...t, status: 'rejected' as const } : t)),
    );
    try {
      await rejectAutopilotTopic(topicId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Konu atlanamadı.');
      if (siteId) setTopics(await getAutopilotTopics(siteId));
    }
  }

  async function handleCreateSite() {
    if (!newSiteName.trim() || !workspaceId) return;
    setError('');
    try {
      const site = await createSite({
        name: newSiteName.trim(),
        workspaceId,
        domain: newSiteDomain.trim() || undefined,
      });
      setSites((prev) => [...prev, site]);
      setSiteId(site.id);
      setShowNewSite(false);
      setNewSiteName('');
      setNewSiteDomain('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Site oluşturulamadı.');
    }
  }

  // -------------------------------------------------------------------- view

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <>
        <PageHeader eyebrow="Otomasyon" title="Otopilot" />
        <EmptyState
          icon={<Bot />}
          title="Önce bir workspace oluşturun"
          description="Otopilot bir siteye bağlanır, site de bir workspace'e. Workspace'ler sayfasından başlayın."
          action={
            <Button asChild>
              <a href="/dashboard/workspaces">{"Workspace'lere git"}</a>
            </Button>
          }
        />
      </>
    );
  }

  const planned = topics.filter((t) => t.status === 'planned');

  return (
    <>
      <PageHeader
        eyebrow="Otomasyon"
        title="Otopilot"
        description="Siteyi tanıyıp konu planlar, makaleyi yazar ve yayına alır. Konular toplu planlanır, bu yüzden planlama maliyeti makale başına kuruşun altında kalır."
        actions={
          <Button onClick={handleSave} disabled={saving || !siteId || loadingSite}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />}
            Kaydet
          </Button>
        }
      />

      {/* Status region — announced to screen readers, since saving and planning
          both finish without any visual movement on the page. */}
      <div aria-live="polite" className="sr-only">
        {error || notice}
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive-muted px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {notice && (
        <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-success/30 bg-success-muted px-4 py-3 text-sm text-success">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* ---------------------------------------------------- site picker */}
          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold text-foreground-strong">Site</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Workspace
                </span>
                <select
                  value={workspaceId}
                  onChange={(e) => setWorkspaceId(e.target.value)}
                  className={cn(fieldClasses, 'h-10')}
                >
                  {workspaces.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Site
                </span>
                <div className="flex gap-2">
                  <select
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                    disabled={sites.length === 0}
                    className={cn(fieldClasses, 'h-10')}
                  >
                    {sites.length === 0 && <option value="">Site yok</option>}
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowNewSite((v) => !v)}
                    aria-label="Yeni site ekle"
                  >
                    <Plus />
                  </Button>
                </div>
              </label>
            </div>

            {showNewSite && (
              <div className="mt-4 grid gap-3 rounded-lg border border-dashed border-border bg-surface-sunken p-4 sm:grid-cols-[1fr_1fr_auto]">
                <Input
                  placeholder="Site adı"
                  value={newSiteName}
                  onChange={(e) => setNewSiteName(e.target.value)}
                />
                <Input
                  placeholder="alanadi.com (opsiyonel)"
                  value={newSiteDomain}
                  onChange={(e) => setNewSiteDomain(e.target.value)}
                />
                <Button type="button" onClick={handleCreateSite} disabled={!newSiteName.trim()}>
                  Ekle
                </Button>
              </div>
            )}
          </Card>

          {!siteId ? (
            <EmptyState
              icon={<Globe />}
              title="Bu workspace'te site yok"
              description="Otopilot bir siteye bağlanır. Yukarıdan bir site ekleyin."
            />
          ) : loadingSite ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <>
              {/* ------------------------------------------------- site context */}
              <Card className="p-5">
                <h2 className="text-sm font-semibold text-foreground-strong">Site bağlamı</h2>
                <p className="mb-4 mt-1 text-xs leading-relaxed text-muted-foreground">
                  Konu planlayıcının okuduğu yer. Burayı boş bırakırsanız planlayıcının elinde
                  yalnızca site adı kalır ve konular genelleşir.
                </p>
                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Sektör / alan
                    </span>
                    <Input
                      placeholder="örn. KOBİ'ler için e-ticaret yazılımı"
                      value={form.niche ?? ''}
                      onChange={(e) => set('niche', e.target.value)}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Hedef kitle
                    </span>
                    <Input
                      placeholder="örn. teknik olmayan mağaza sahipleri"
                      value={form.targetAudience ?? ''}
                      onChange={(e) => set('targetAudience', e.target.value)}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Anahtar kelimeler
                      <span className="ml-1 font-normal text-muted-foreground/70">
                        (virgülle ayırın)
                      </span>
                    </span>
                    <Textarea
                      rows={2}
                      placeholder="e-ticaret seo, ürün açıklaması, kargo entegrasyonu"
                      value={form.keywords ?? ''}
                      onChange={(e) => set('keywords', e.target.value)}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Hariç tutulacak konular
                      <span className="ml-1 font-normal text-muted-foreground/70">
                        (virgülle ayırın)
                      </span>
                    </span>
                    <Textarea
                      rows={2}
                      placeholder="kripto, rakip markalar"
                      value={form.excludedTopics ?? ''}
                      onChange={(e) => set('excludedTopics', e.target.value)}
                    />
                  </label>
                </div>
              </Card>

              {/* ----------------------------------------------- topic queue */}
              <Card className="p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground-strong">Konu kuyruğu</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {planned.length} konu sırada. Kuyruk azaldığında otomatik dolar.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handlePlanTopics}
                    disabled={planning}
                  >
                    {planning ? <Loader2 className="animate-spin" /> : <ListPlus />}
                    Şimdi planla
                  </Button>
                </div>

                {topics.length === 0 ? (
                  <EmptyState
                    icon={<Sparkles />}
                    title="Henüz konu planlanmadı"
                    description="Site bağlamını doldurup kaydedin, sonra 'Şimdi planla' ile ilk partiyi üretin."
                    className="py-10"
                  />
                ) : (
                  <ul className="divide-y divide-border">
                    {topics.map((topic) => {
                      const status = STATUS_LABELS[topic.status];
                      return (
                        <li key={topic.id} className="flex items-start gap-3 py-3">
                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                'text-sm font-medium text-foreground',
                                topic.status === 'rejected' && 'text-muted-foreground line-through',
                              )}
                            >
                              {topic.title}
                            </p>
                            {topic.angle && (
                              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                                {topic.angle}
                              </p>
                            )}
                            {topic.primaryKeyword && (
                              <p className="mt-1 text-[11px] text-muted-foreground/80">
                                {topic.primaryKeyword}
                              </p>
                            )}
                          </div>
                          <Badge variant={status.variant}>{status.label}</Badge>
                          {topic.status === 'planned' && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleRejectTopic(topic.id)}
                              aria-label={`"${topic.title}" konusunu atla`}
                            >
                              <Trash2 />
                            </Button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            </>
          )}
        </div>

        {/* ------------------------------------------------------- right rail */}
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold text-foreground-strong">Çalışma ayarları</h2>

            <ToggleRow
              label="Otopilot açık"
              hint="Kapalıyken hiçbir şey üretilmez."
              checked={!!form.enabled}
              onChange={(v) => set('enabled', v)}
            />
            <ToggleRow
              label="SEO modu"
              hint="Meta başlık, açıklama ve SSS üretir."
              checked={!!form.seoMode}
              onChange={(v) => set('seoMode', v)}
            />

            {/* Publish mode is a two-way choice, not a toggle: "off" does not
                describe what happens to the article, and this is the decision
                with the largest consequence on the page. */}
            <fieldset className="mt-4 border-t border-border pt-4">
              <legend className="mb-2 text-xs font-medium text-muted-foreground">
                Makale bittiğinde
              </legend>
              <div className="space-y-2">
                {PUBLISH_MODES.map((mode) => (
                  <RadioCard
                    key={String(mode.autoPublish)}
                    name="publishMode"
                    label={mode.label}
                    hint={mode.hint}
                    checked={!!form.autoPublish === mode.autoPublish}
                    onSelect={() => set('autoPublish', mode.autoPublish)}
                  />
                ))}
              </div>
            </fieldset>

            <div className="mt-4 space-y-4 border-t border-border pt-4">
              <div>
                <span className="mb-2 block text-xs font-medium text-muted-foreground">
                  Üretim temposu
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {CADENCE_PRESETS.map((preset) => {
                    const active = (form.postsPerWeek ?? 2) === preset.postsPerWeek;
                    return (
                      <button
                        key={preset.postsPerWeek}
                        type="button"
                        aria-pressed={active}
                        onClick={() => set('postsPerWeek', preset.postsPerWeek)}
                        className={cn(
                          'rounded-lg border px-3 py-2 text-left text-xs transition-colors duration-fast ease-out-quart',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20',
                          active
                            ? 'border-primary bg-accent font-semibold text-accent-foreground'
                            : 'border-border bg-card text-foreground hover:border-strong',
                        )}
                      >
                        <span className="block">{preset.label}</span>
                        <span
                          className={cn(
                            'mt-0.5 block text-[10px] font-normal',
                            active ? 'text-accent-foreground/70' : 'text-muted-foreground',
                          )}
                        >
                          ~{preset.perMonth} / ay
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Aylık üst sınır
                </span>
                <Input
                  type="number"
                  min={1}
                  max={200}
                  value={form.maxPostsPerMonth ?? 10}
                  onChange={(e) => set('maxPostsPerMonth', clampInt(e.target.value, 1, 200))}
                />
                <span className="mt-1.5 block text-[11px] leading-relaxed text-muted-foreground">
                  Tempodan bağımsız sert tavan. Harcamayı sınırlayan asıl ayar bu.
                </span>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Kalite seviyesi
                </span>
                <select
                  value={form.tier ?? 'standard'}
                  onChange={(e) => set('tier', e.target.value)}
                  className={cn(fieldClasses, 'h-10')}
                >
                  {tiers.map((t) => (
                    <option key={t.tier} value={t.tier}>
                      {t.label} — ${t.estimatedCostPerArticleUsd.toFixed(4)}/makale
                    </option>
                  ))}
                </select>
                {selectedTier && (
                  <span className="mt-1.5 block text-[11px] leading-relaxed text-muted-foreground">
                    {selectedTier.description}
                  </span>
                )}
              </label>
            </div>
          </Card>

          {/* Cost projection — the number that makes the cadence decision concrete. */}
          {projection && (
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-foreground-strong">Tahmini maliyet</h2>
              <p className="mt-3 text-2xl font-semibold tabular-nums text-foreground-strong">
                ${projection.monthlyUsd.toFixed(2)}
                <span className="ml-1.5 text-sm font-normal text-muted-foreground">/ ay</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Ayda ~{projection.articles} makale
                {projection.capped && ' (aylık üst sınıra kırpıldı)'}
              </p>
              <p className="mt-3 border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground">
                Bu, sağlayıcıya ödenen ham token maliyetidir — planınızın token kotasından düşer.
                Konu planlaması ayda bir kuruşun altında kaldığı için buraya dahil değildir.
              </p>
            </Card>
          )}

          {config && (
            <Card className="p-5">
              <h2 className="mb-3 text-sm font-semibold text-foreground-strong">Durum</h2>
              <dl className="space-y-2.5 text-xs">
                <Row label="Bu ay üretilen">
                  {config.postsThisMonth} / {config.maxPostsPerMonth}
                </Row>
                <Row label="Son çalışma">
                  {config.lastRunAt
                    ? new Date(config.lastRunAt).toLocaleString('tr-TR')
                    : 'Henüz çalışmadı'}
                </Row>
                <Row label="Son konu planı">
                  {config.topicsPlannedAt
                    ? new Date(config.topicsPlannedAt).toLocaleDateString('tr-TR')
                    : '—'}
                </Row>
              </dl>
              {config.lastError && (
                <p className="mt-3 rounded-md bg-warning-muted px-3 py-2 text-[11px] leading-relaxed text-warning">
                  {config.lastError}
                </p>
              )}
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

// ------------------------------------------------------------------ helpers

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium tabular-nums text-foreground">{children}</dd>
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 py-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-border text-primary focus-visible:ring-2 focus-visible:ring-primary/20"
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-foreground">{label}</span>
        <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">
          {hint}
        </span>
      </span>
    </label>
  );
}

function clampInt(raw: string, min: number, max: number): number {
  const n = parseInt(raw, 10);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

/** Strips the server-owned fields so a save never tries to write them back. */
function pickInput(config: AutopilotConfig): AutopilotConfigInput {
  return {
    enabled: config.enabled,
    postsPerWeek: config.postsPerWeek,
    maxPostsPerMonth: config.maxPostsPerMonth,
    tier: config.tier,
    language: config.language,
    tone: config.tone,
    length: config.length,
    seoMode: config.seoMode,
    autoPublish: config.autoPublish,
    niche: config.niche ?? '',
    targetAudience: config.targetAudience ?? '',
    keywords: config.keywords ?? '',
    excludedTopics: config.excludedTopics ?? '',
  };
}

function RadioCard({
  name,
  label,
  hint,
  checked,
  onSelect,
}: {
  name: string;
  label: string;
  hint: string;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 transition-colors duration-fast ease-out-quart',
        checked ? 'border-primary bg-accent' : 'border-border bg-card hover:border-strong',
      )}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onSelect}
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer border-border text-primary focus-visible:ring-2 focus-visible:ring-primary/20"
      />
      <span className="min-w-0">
        <span
          className={cn(
            'block text-sm font-medium',
            checked ? 'text-accent-foreground' : 'text-foreground',
          )}
        >
          {label}
        </span>
        <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">
          {hint}
        </span>
      </span>
    </label>
  );
}
