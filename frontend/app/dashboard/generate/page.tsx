'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, Loader2, Download, Copy, Check, AlertCircle, Briefcase, Users, PartyPopper, BookOpen, Settings, Sparkles as SparklesIcon, Book, Search, Rocket, Zap, Gem, RefreshCw, ExternalLink, X, Lock, ArrowUpRight, Coins } from 'lucide-react';
import Link from 'next/link';
import {
  generatePost,
  getPost,
  getWorkspaces,
  createWorkspace,
  searchUnsplashPhotos,
  triggerUnsplashDownload,
  getEntitlement,
  getModelTiers,
  type UnsplashPhoto,
  type Entitlement,
  type TierInfo,
  type ModelTier,
} from '@/lib/api';
import { trackBlogGeneration, trackFormSubmit, trackButtonClick, trackCustomEvent } from '@/lib/analytics';
import { sanitizeHtml } from '@/lib/sanitize';

/** Workspace avatar identity colors — index order must match the workspaces screen. */
const WORKSPACE_COLORS = [
  { value: 'blue',   class: 'bg-blue-600' },
  { value: 'purple', class: 'bg-violet-600' },
  { value: 'pink',   class: 'bg-pink-600' },
  { value: 'indigo', class: 'bg-indigo-600' },
  { value: 'green',  class: 'bg-emerald-600' },
  { value: 'yellow', class: 'bg-amber-500' },
  { value: 'red',    class: 'bg-red-600' },
  { value: 'teal',   class: 'bg-teal-600' },
  { value: 'orange', class: 'bg-orange-600' },
  { value: 'cyan',   class: 'bg-cyan-600' },
  { value: 'gray',   class: 'bg-muted-foreground' },
  { value: 'black',  class: 'bg-foreground' },
];

/** Kalite seviyeleri her zaman bu sırayla gösterilir — plan dışı olanlar da dahil. */
const TIER_ORDER: ModelTier[] = ['standard', 'pro', 'premium'];

/** Görsel kimlik + API erişilemezse kullanılacak yedek metinler. */
const TIER_META: Record<ModelTier, { label: string; description: string; Icon: typeof Rocket }> = {
  standard: {
    label: 'Standart',
    description: 'Günlük içerik ve yüksek hacimli üretim için hızlı ve ekonomik.',
    Icon: Rocket,
  },
  pro: {
    label: 'Pro',
    description: 'SEO odaklı bloglar için daha derin akıl yürütme ve akıcı dil.',
    Icon: Zap,
  },
  premium: {
    label: 'Premium',
    description: 'Rehber ve pillar içerikler için en yüksek kalite.',
    Icon: Gem,
  },
};

/** Bir blog için kabaca harcanan token — seviye başına yaklaşık değer. */
const TIER_TOKEN_ESTIMATE: Record<ModelTier, number> = {
  standard: 6000,
  pro: 12000,
  premium: 20000,
};

/** Uzunluk seçimi tahmini token maliyetini ölçekler. */
const LENGTH_TOKEN_FACTOR: Record<string, number> = {
  kısa: 0.6,
  orta: 1,
  uzun: 1.6,
};

/** Seçili seviye ve uzunluk için yuvarlanmış token tahmini. */
function estimateTokens(tier: ModelTier, contentLength?: string): number {
  const factor = LENGTH_TOKEN_FACTOR[contentLength || 'orta'] ?? 1;
  return Math.round((TIER_TOKEN_ESTIMATE[tier] * factor) / 500) * 500;
}

/** Consistent form field label used across this screen. */
function FieldLabel({
  htmlFor,
  children,
  hint,
  required,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  hint?: string;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-sm font-medium text-foreground">
      {children}
      {required && <span className="ml-0.5 text-destructive">*</span>}
      {hint && <span className="ml-2 text-xs font-normal text-muted-foreground">{hint}</span>}
    </label>
  );
}

const selectClass =
  'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

const checkboxClass =
  'h-4 w-4 rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

const blogSchema = z.object({
  workspaceId: z.string().uuid('Geçerli bir workspace seçin'),
  topic: z.string()
    .min(5, 'Konu en az 5 karakter olmalı')
    .max(200, 'Konu en fazla 200 karakter olabilir'),
  additionalContext: z.string()
    .max(1000, 'Ek bağlam en fazla 1000 karakter olabilir')
    .optional()
    .or(z.literal('')),
  tone: z.string()
    .max(100, 'Ton en fazla 100 karakter olabilir')
    .optional()
    .or(z.literal('')),
  targetAudience: z.string()
    .max(100, 'Hedef kitle en fazla 100 karakter olabilir')
    .optional()
    .or(z.literal('')),
  contentLength: z.enum(['kısa', 'orta', 'uzun']).optional(),
  seoMode: z.boolean().optional(),
  language: z.enum(['tr', 'en']).optional(),
  model: z.enum(['standard', 'pro', 'premium']).optional(),
});

type BlogFormData = z.infer<typeof blogSchema>;

function GenerateBlogPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [generatedBlog, setGeneratedBlog] = useState<{
    title: string;
    content: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [postId, setPostId] = useState<string | null>(null);
  const [postStatus, setPostStatus] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [targetAudienceTags, setTargetAudienceTags] = useState<string[]>([]);
  const [targetAudienceInput, setTargetAudienceInput] = useState('');
  const [selectedTones, setSelectedTones] = useState<string[]>([]);
  const [customToneInput, setCustomToneInput] = useState('');
  const [showImageSearch, setShowImageSearch] = useState(false);
  const [imageSearchQuery, setImageSearchQuery] = useState('');
  const [unsplashPhotos, setUnsplashPhotos] = useState<UnsplashPhoto[]>([]);
  const [selectedImage, setSelectedImage] = useState<UnsplashPhoto | null>(null);
  const [isSearchingImages, setIsSearchingImages] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [postFormat, setPostFormat] = useState<string>('md'); // Track post format for preview
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [tierInfos, setTierInfos] = useState<TierInfo[]>([]);
  const [isEntitlementLoading, setIsEntitlementLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<BlogFormData>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      contentLength: 'orta',
      seoMode: false,
      language: 'tr',
      model: 'standard', // Entitlement yüklenince defaultTier ile güncellenir
    },
  });

  // Kalite seviyeleri ve plan hakları
  useEffect(() => {
    let cancelled = false;
    const loadEntitlement = async () => {
      try {
        const [ent, tiers] = await Promise.all([getEntitlement(), getModelTiers()]);
        if (cancelled) return;
        setEntitlement(ent);
        setTierInfos(tiers);
        if (ent?.defaultTier) {
          setValue('model', ent.defaultTier);
        }
      } catch (err) {
        console.error('Failed to load entitlement:', err);
      } finally {
        if (!cancelled) setIsEntitlementLoading(false);
      }
    };
    loadEntitlement();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load workspaces on mount
  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        const ws = await getWorkspaces();
        setWorkspaces(ws);
        
        // Check URL for workspaceId parameter
        const urlWorkspaceId = searchParams.get('workspaceId') || searchParams.get('workspaceld'); // Handle typo
        
        // If no workspace exists, create a default one
        if (ws.length === 0) {
          try {
            const newWorkspace = await createDefaultWorkspace();
            setWorkspaces([newWorkspace]);
            setValue('workspaceId', newWorkspace.id);
          } catch (createErr) {
            console.error('Failed to create default workspace:', createErr);
            setError('Workspace oluşturulamadı. Lütfen manuel olarak oluşturun.');
          }
        } else {
          // Use URL parameter if available, otherwise use first workspace
          const selectedWorkspaceId = urlWorkspaceId || ws[0].id;
          if (selectedWorkspaceId && ws.some(w => w.id === selectedWorkspaceId)) {
            setValue('workspaceId', selectedWorkspaceId);
          } else {
            const currentWorkspaceId = watch('workspaceId');
            if (!currentWorkspaceId) {
              setValue('workspaceId', ws[0].id);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load workspaces:', err);
        setError('Workspace\'ler yüklenemedi. Lütfen sayfayı yenileyin veya bir workspace oluşturun.');
      }
    };
    loadWorkspaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createDefaultWorkspace = async () => {
    return await createWorkspace('Ana Workspace', 'Varsayılan çalışma alanı');
  };

  // Poll post status when postId is set
  useEffect(() => {
    if (!postId || !isPolling) return;

    let pollCount = 0;
    const maxPolls = 300; // Max 10 minutes (300 * 2 seconds)
    
    const pollInterval = setInterval(async () => {
      try {
        pollCount++;
        
        // Safety check: stop polling after max attempts
        if (pollCount > maxPolls) {
          setIsPolling(false);
          setIsLoading(false);
          setError('Blog üretimi çok uzun sürüyor. Lütfen sayfayı yenileyip durumu kontrol edin.');
          return;
        }

        const post = await getPost(postId);
        if (!post) {
          throw new Error('Post bulunamadı');
        }

        setPostStatus(post.status);

        if (post.status === 'generated' || post.status === 'draft') {
          setIsPolling(false);
          setIsLoading(false);
          // Get latest revision content
          const latestRevision = post.revisions && post.revisions.length > 0
            ? post.revisions.sort((a, b) => b.version - a.version)[0]
            : null;
          
          if (latestRevision) {
            setPostFormat(latestRevision.contentFormat || 'json');
            setGeneratedBlog({
              title: post.title,
              content: latestRevision.content,
            });
            // Track successful blog generation completion
            trackCustomEvent('blog_generation_completed', {
              post_id: post.id,
              title: post.title,
              format: latestRevision.contentFormat || 'json',
            });
          } else {
            setError('Blog içeriği bulunamadı. Lütfen tekrar deneyin.');
          }
        } else if (post.status === 'failed') {
          setIsPolling(false);
          setIsLoading(false);
          setError(post.lastError || 'Blog üretimi başarısız oldu');
        }
        // Continue polling for: queued, generating, etc.
      } catch (err) {
        console.error('Failed to poll post status:', err);
        // Don't stop polling on network errors, but log them
        if (pollCount > 10) {
          // After 10 failed attempts, stop polling
          setIsPolling(false);
          setIsLoading(false);
          setError('Blog durumu kontrol edilemedi. Lütfen sayfayı yenileyin.');
        }
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [postId, isPolling]);

  const onSubmit = async (data: BlogFormData) => {
    console.log('Form submitted with data:', data);
    
    // Validation check
    if (!data.workspaceId) {
      setError('Lütfen bir workspace seçin.');
      return;
    }

    if (!data.topic || data.topic.trim().length < 5) {
      setError('Konu en az 5 karakter olmalı.');
      return;
    }

    // Check if image search is enabled but no image is selected
    if (showImageSearch && !selectedImage) {
      setError('Lütfen bir kapak fotoğrafı seçin veya "Kapak Fotoğrafı Ekle" seçeneğini kaldırın.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedBlog(null);
    setPostId(null);
    setPostStatus(null);
    setIsPolling(false);

    try {
      // Map frontend form data to backend format
      const lengthMap: Record<string, string> = {
        kısa: 'short',
        orta: 'medium',
        uzun: 'long',
      };

      const requestData = {
        workspaceId: data.workspaceId,
        topic: data.topic,
        language: data.language || 'tr',
        tone: (() => {
          // Exclude "Diğer" from selected tones and include custom tone if "Diğer" is selected
          const tonesWithoutOther = selectedTones.filter((t) => t !== 'Diğer');
          const allTones = customToneInput.trim() && selectedTones.includes('Diğer')
            ? [...tonesWithoutOther, customToneInput.trim()].filter(Boolean)
            : tonesWithoutOther;
          return allTones.length > 0 ? allTones.join(', ') : (data.tone && data.tone.trim()) || 'professional';
        })(),
        length: lengthMap[data.contentLength || 'orta'] || 'medium',
        seoMode: data.seoMode || false,
        model: (() => {
          // Kullanıcının seçtiği kalite seviyesi; plan dışıysa plana geri düş.
          const requested = data.model || entitlement?.defaultTier || 'standard';
          if (!entitlement) return requested;
          return entitlement.allowedTiers.includes(requested)
            ? requested
            : entitlement.defaultTier;
        })(),
        // Only include optional fields if they have values
        ...(data.additionalContext && data.additionalContext.trim() && { additionalContext: data.additionalContext }),
        ...(targetAudienceTags.length > 0 && { targetAudience: targetAudienceTags.join(', ') }),
        ...(selectedImage && {
          coverImageUrl: selectedImage.urls.regular,
          coverImageCreditJson: JSON.stringify({
            name: selectedImage.user.name,
            photographerUrl: selectedImage.user.links.html,
            photoUrl: selectedImage.links.html,
          }),
        }),
      };

      console.log('Sending request to API:', requestData);

      const response = await generatePost(requestData);

      console.log('API response:', response);

      // Backend returns {jobId, postId, status}
      const postId = response?.postId || response?.id;
      if (!response || !postId) {
        throw new Error('Geçersiz API yanıtı. Lütfen tekrar deneyin.');
      }

      // Track blog generation
      trackBlogGeneration(data.topic);
      trackFormSubmit('blog_generation', true);
      trackButtonClick('generate_blog', '/dashboard/generate');

      // Preview artık her zaman canonical JSON'dan çözümleniyor
      setPostFormat('json');

      // Set post ID and status, start polling
      setPostId(postId);
      setPostStatus(response.status || 'queued');
      setIsLoading(false); // Stop loading, start polling
      setIsPolling(true);
      
      // Clear selected tones and target audience tags after successful submission
      setSelectedTones([]);
      setCustomToneInput('');
      setTargetAudienceTags([]);
      setTargetAudienceInput('');
      setSelectedImage(null);
      setUnsplashPhotos([]);
      setImageSearchQuery('');
      setShowImageSearch(false);
      
      // Trigger download tracking for selected image
      if (selectedImage) {
        triggerUnsplashDownload(selectedImage.id).catch(console.error);
      }
      
      // Don't reset form yet, wait for generation to complete
    } catch (err) {
      console.error('Error generating post:', err);
      const errorMessage = err instanceof Error ? err.message : 'Blog üretilirken bir hata oluştu. Lütfen tekrar deneyin.';
      trackFormSubmit('blog_generation', false);
      setError(errorMessage);
      setIsLoading(false);
      setIsPolling(false);
      setPostId(null);
      setPostStatus(null);
      setGeneratedBlog(null);
    }
  };

  const handleImageSearch = async (page: number = 1) => {
    if (!imageSearchQuery.trim()) {
      setError('Lütfen arama terimi girin');
      return;
    }

    try {
      setIsSearchingImages(true);
      setError(null);
      console.log('Searching for images with query:', imageSearchQuery.trim(), 'page:', page);
      const photos = await searchUnsplashPhotos(imageSearchQuery.trim(), 8, page);
      console.log('Received photos:', photos);
      setUnsplashPhotos(photos);
      setCurrentPage(page);
      if (photos.length === 0) {
        setError('Arama sonucu bulunamadı. Farklı bir terim deneyin.');
      }
    } catch (err) {
      console.error('Error searching images:', err);
      const errorMessage = err instanceof Error ? err.message : 'Resim arama sırasında bir hata oluştu';
      setError(errorMessage);
      alert(`Resim arama hatası: ${errorMessage}`);
    } finally {
      setIsSearchingImages(false);
    }
  };

  const handleRefreshImages = async () => {
    if (!imageSearchQuery.trim()) {
      setError('Lütfen önce bir arama terimi girin');
      return;
    }
    // Get next page to get different results
    const nextPage = currentPage + 1;
    // Clear current photos and search with next page
    setUnsplashPhotos([]);
    setSelectedImage(null);
    await handleImageSearch(nextPage);
  };

  const handleCopy = () => {
    if (generatedBlog) {
      navigator.clipboard.writeText(generatedBlog.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (generatedBlog) {
      const blob = new Blob([generatedBlog.content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${generatedBlog.title.replace(/\s+/g, '-')}.md`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Strip ````` code fences (```json ... ```) if present
  const stripCodeFences = (raw: string): string => {
    if (!raw || typeof raw !== 'string') return '';
    let text = raw.trim();

    if (text.startsWith('```')) {
      // Remove first line (``` or ```json)
      const firstNewline = text.indexOf('\n');
      if (firstNewline !== -1) {
        text = text.slice(firstNewline + 1);
      }
      // Remove trailing ```
      const lastFence = text.lastIndexOf('```');
      if (lastFence !== -1) {
        text = text.slice(0, lastFence);
      }
    }

    return text.trim();
  };

  // Format markdown to HTML for preview (same as blog detail page)
  const formatMarkdownToHtml = (md: string): string => {
    const source = stripCodeFences(md);
    if (!source || typeof source !== 'string') return '';
    
    let html = source
      .replace(/^### (.*$)/gim, '<h3 class="text-2xl font-semibold mt-6 mb-3 text-foreground">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-3xl font-semibold mt-8 mb-4 text-foreground">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-4xl font-bold mt-8 mb-4 text-foreground">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
      .replace(/^- (.*$)/gim, '<li class="ml-4 mb-2">• $1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 mb-2">$1</li>');
    
    // Paragrafları düzgün ayır
    const paragraphs = html.split(/\n\n+/).filter(p => p.trim());
    html = paragraphs.map(p => {
      const trimmed = p.trim();
      if (trimmed.startsWith('<h') || trimmed.startsWith('<li')) {
        return trimmed;
      }
      return `<p class="mb-4 text-muted-foreground leading-relaxed">${trimmed.replace(/\n/g, '<br />')}</p>`;
    }).join('');
    
    return html;
  };

  // ── Kalite seviyesi + token bakiyesi ────────────────────────────────────
  const allowedTiers = entitlement?.allowedTiers ?? TIER_ORDER;
  const requestedTier = (watch('model') || entitlement?.defaultTier || 'standard') as ModelTier;
  // Plan dışı bir seviye seçili kalmışsa plana geri düş.
  const selectedTier = allowedTiers.includes(requestedTier)
    ? requestedTier
    : entitlement?.defaultTier || allowedTiers[0] || 'standard';
  const estimatedCost = estimateTokens(selectedTier, watch('contentLength'));
  const isPlanExpired = entitlement?.isExpired ?? false;
  const hasEnoughTokens = entitlement ? entitlement.totalTokensRemaining >= estimatedCost : true;
  const isBlockedByPlan = isPlanExpired || !hasEnoughTokens;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Yeni Blog Üret"
        description="Konu, ton ve hedef kitlenizi belirleyin; BlogProduce sizin için SEO uyumlu tam bir blog yazısı üretsin."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {postStatus && (
              <Badge variant="outline" className="gap-1.5 py-1">
                <SparklesIcon className="h-3.5 w-3.5 text-accent-foreground" />
                Durum: {postStatus === 'queued' ? 'Kuyrukta' : postStatus === 'generating' ? 'Üretiliyor' : postStatus}
              </Badge>
            )}
            {isLoading && (
              <Badge variant="info" className="gap-1.5 py-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                AI blog üretiyor…
              </Badge>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)]">
        {/* Form */}
        <Card className="shadow-card">
          <CardHeader className="p-5 pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-accent-foreground" />
              Blog Parametreleri
            </CardTitle>
            <CardDescription className="text-sm">Blog içeriğinizi özelleştirin</CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <form
              onSubmit={handleSubmit(onSubmit, (errors) => {
                console.log('Form validation errors:', errors);
                console.log('Form values:', watch());
                if (errors.workspaceId) {
                  setError('Lütfen bir workspace seçin.');
                } else if (errors.topic) {
                  setError(errors.topic.message || 'Konu gerekli.');
                } else if (Object.keys(errors).length > 0) {
                  setError(`Form hatası: ${Object.keys(errors).join(', ')}`);
                } else {
                  setError('Formu doldurun.');
                }
              })}
              className="space-y-6"
            >
              {/* Workspace */}
              <div>
                <FieldLabel
                  htmlFor="workspaceId"
                  required
                  hint="(Bloglarınızı organize etmek için çalışma alanı)"
                >
                  Workspace
                </FieldLabel>
                {workspaces.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {workspaces.map((ws) => {
                      const selectedWorkspaceId = watch('workspaceId');
                      const isSelected = selectedWorkspaceId === ws.id;
                      const getInitials = (name: string) => {
                        const words = name.trim().split(/\s+/);
                        if (words.length >= 2) {
                          return (words[0][0] + words[1][0]).toUpperCase();
                        }
                        return name.substring(0, 2).toUpperCase();
                      };
                      const initials = getInitials(ws.name);
                      let bgColor = WORKSPACE_COLORS[0].class;
                      if (ws.color) {
                        const colorOption = WORKSPACE_COLORS.find((c) => c.value === ws.color);
                        if (colorOption) {
                          bgColor = colorOption.class;
                        }
                      } else {
                        const colors = WORKSPACE_COLORS.map((c) => c.class);
                        let hash = 0;
                        for (let i = 0; i < ws.name.length; i++) {
                          hash = ws.name.charCodeAt(i) + ((hash << 5) - hash);
                        }
                        bgColor = colors[Math.abs(hash) % colors.length];
                      }

                      return (
                        <button
                          key={ws.id}
                          type="button"
                          onClick={() => setValue('workspaceId', ws.id)}
                          aria-pressed={isSelected}
                          className={`flex w-28 flex-col items-center gap-2 rounded-xl border p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                            isSelected
                              ? 'border-primary bg-accent'
                              : 'border-border bg-card hover:border-primary/40 hover:bg-secondary'
                          }`}
                        >
                          <span
                            className={`flex h-12 w-12 items-center justify-center rounded-full text-base font-semibold text-primary-foreground ${bgColor}`}
                          >
                            {initials}
                          </span>
                          <span
                            className={`w-full truncate text-center text-xs font-medium ${
                              isSelected ? 'text-accent-foreground' : 'text-foreground'
                            }`}
                          >
                            {ws.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg border border-border bg-secondary p-3 text-sm text-muted-foreground">
                    <p>Workspace oluşturuluyor, lütfen bekleyin...</p>
                  </div>
                )}
                {errors.workspaceId && (
                  <p className="mt-1.5 text-xs text-destructive">{errors.workspaceId.message}</p>
                )}
              </div>

              {/* Konu */}
              <div>
                <FieldLabel htmlFor="topic" required hint="(5-200 karakter)">
                  Konu
                </FieldLabel>
                <Input
                  id="topic"
                  {...register('topic')}
                  placeholder="Örn: Yapay Zeka ve Blog İçerik Üretimi"
                  maxLength={200}
                />
                <div className="mt-1.5 flex items-center justify-between gap-3">
                  {errors.topic && (
                    <p className="text-xs text-destructive">{errors.topic.message}</p>
                  )}
                  <p className="ml-auto text-xs text-muted-foreground">
                    {watch('topic')?.length || 0}/200
                  </p>
                </div>
              </div>

              {/* Ek bağlam */}
              <div>
                <FieldLabel
                  htmlFor="additionalContext"
                  hint="Opsiyonel (Maksimum 1000 karakter)"
                >
                  Ek Bağlam
                </FieldLabel>
                <Textarea
                  id="additionalContext"
                  {...register('additionalContext')}
                  placeholder="Blog hakkında ek bilgiler, odaklanılacak noktalar..."
                  rows={3}
                  maxLength={1000}
                />
                {errors.additionalContext && (
                  <p className="mt-1.5 text-xs text-destructive">{errors.additionalContext.message}</p>
                )}
                <p className="mt-1.5 text-right text-xs text-muted-foreground">
                  {watch('additionalContext')?.length || 0}/1000
                </p>
              </div>

              {/* Ton */}
              <div>
                <FieldLabel htmlFor="tone">Ton</FieldLabel>
                {selectedTones.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {selectedTones.map((tone) => (
                      <Badge key={tone} className="gap-1.5 py-1 pr-1.5 text-xs">
                        {tone}
                        <button
                          type="button"
                          aria-label={`${tone} tonunu kaldır`}
                          onClick={() => {
                            const newTones = selectedTones.filter((t) => t !== tone);
                            setSelectedTones(newTones);
                            // If removing "Diğer", clear custom tone input
                            if (tone === 'Diğer') {
                              setCustomToneInput('');
                            }
                            // Update form value: exclude "Diğer" and include custom tone if exists
                            const tonesWithoutOther = newTones.filter((t) => t !== 'Diğer');
                            const allTones = customToneInput.trim() && newTones.includes('Diğer')
                              ? [...tonesWithoutOther, customToneInput.trim()].filter(Boolean)
                              : tonesWithoutOther;
                            setValue('tone', allTones.length > 0 ? allTones.join(', ') : '');
                          }}
                          className="rounded-full p-0.5 transition-colors hover:bg-primary/10"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-3 xl:grid-cols-4">
                  {[
                    { value: 'Profesyonel', label: 'Profesyonel', Icon: Briefcase },
                    { value: 'Samimi', label: 'Samimi', Icon: Users },
                    { value: 'Eğlenceli', label: 'Eğlenceli', Icon: PartyPopper },
                    { value: 'Ciddi', label: 'Ciddi', Icon: BookOpen },
                    { value: 'Teknik', label: 'Teknik', Icon: Settings },
                    { value: 'Yaratıcı', label: 'Yaratıcı', Icon: SparklesIcon },
                    { value: 'Bilgilendirici', label: 'Bilgilendirici', Icon: Book },
                    { value: 'Diğer', label: 'Diğer', Icon: Search },
                  ].map((toneOption) => {
                    const isSelected = selectedTones.includes(toneOption.value);
                    const IconComponent = toneOption.Icon;
                    return (
                      <button
                        key={toneOption.value}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => {
                          let newTones: string[];
                          if (isSelected) {
                            // Remove if already selected
                            newTones = selectedTones.filter((t) => t !== toneOption.value);
                          } else {
                            // Add if not selected
                            newTones = [...selectedTones, toneOption.value];
                          }
                          setSelectedTones(newTones);
                          // If "Diğer" is removed, clear custom tone input
                          if (!newTones.includes('Diğer')) {
                            setCustomToneInput('');
                          }
                          // Update form value: exclude "Diğer" and include custom tone if "Diğer" is selected
                          const tonesWithoutOther = newTones.filter((t) => t !== 'Diğer');
                          const allTones = customToneInput.trim() && newTones.includes('Diğer')
                            ? [...tonesWithoutOther, customToneInput.trim()].filter(Boolean)
                            : tonesWithoutOther;
                          setValue('tone', allTones.length > 0 ? allTones.join(', ') : '');
                        }}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                          isSelected
                            ? 'border-primary bg-accent font-medium text-accent-foreground'
                            : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-secondary'
                        }`}
                      >
                        <IconComponent
                          className={`h-4 w-4 shrink-0 ${isSelected ? 'text-accent-foreground' : 'text-muted-foreground'}`}
                        />
                        <span className="truncate">{toneOption.label}</span>
                      </button>
                    );
                  })}
                </div>
                {selectedTones.length > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {selectedTones.length} ton seçildi
                  </p>
                )}
                {selectedTones.includes('Diğer') && (
                  <div className="mt-3">
                    <label
                      htmlFor="customTone"
                      className="mb-1.5 block text-xs font-medium text-muted-foreground"
                    >
                      Özel Ton Yazın
                    </label>
                    <Input
                      id="customTone"
                      value={customToneInput}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setCustomToneInput(newValue);
                        // Update form value with selected tones (excluding "Diğer") + custom tone
                        const tonesWithoutOther = selectedTones.filter((t) => t !== 'Diğer');
                        const allTones = newValue.trim()
                          ? [...tonesWithoutOther, newValue.trim()].filter(Boolean)
                          : tonesWithoutOther;
                        setValue('tone', allTones.length > 0 ? allTones.join(', ') : '');
                      }}
                      onBlur={() => {
                        // Update form value when input loses focus
                        const tonesWithoutOther = selectedTones.filter((t) => t !== 'Diğer');
                        const allTones = customToneInput.trim()
                          ? [...tonesWithoutOther, customToneInput.trim()].filter(Boolean)
                          : tonesWithoutOther;
                        setValue('tone', allTones.length > 0 ? allTones.join(', ') : '');
                      }}
                      placeholder="Özel bir ton yazın (örn: Mizahi, Akademik...)"
                      maxLength={100}
                    />
                    {customToneInput && (
                      <p className="mt-1.5 text-right text-xs text-muted-foreground">
                        {customToneInput.length}/100
                      </p>
                    )}
                  </div>
                )}
                {errors.tone && <p className="mt-1.5 text-xs text-destructive">{errors.tone.message}</p>}
              </div>

              {/* Hedef kitle */}
              <div>
                <FieldLabel htmlFor="targetAudience" hint="(Enter'a basarak ekleyin)">
                  Hedef Kitle
                </FieldLabel>
                {targetAudienceTags.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {targetAudienceTags.map((tag, index) => (
                      <Badge key={index} className="gap-1.5 py-1 pr-1.5 text-xs">
                        {tag}
                        <button
                          type="button"
                          aria-label={`${tag} etiketini kaldır`}
                          onClick={() => {
                            const newTags = targetAudienceTags.filter((_, i) => i !== index);
                            setTargetAudienceTags(newTags);
                            setValue('targetAudience', newTags.join(', '));
                          }}
                          className="rounded-full p-0.5 transition-colors hover:bg-primary/10"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <Input
                  id="targetAudience"
                  value={targetAudienceInput}
                  onChange={(e) => setTargetAudienceInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const trimmed = targetAudienceInput.trim();
                      if (trimmed && !targetAudienceTags.includes(trimmed)) {
                        const newTags = [...targetAudienceTags, trimmed];
                        setTargetAudienceTags(newTags);
                        setValue('targetAudience', newTags.join(', '));
                        setTargetAudienceInput('');
                      }
                    }
                  }}
                  placeholder="Geliştiriciler, Pazarlamacılar... (Enter'a basın)"
                  maxLength={100}
                />
                {errors.targetAudience && (
                  <p className="mt-1.5 text-xs text-destructive">{errors.targetAudience.message}</p>
                )}
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {targetAudienceTags.length} etiket eklendi
                </p>
              </div>

              {/* Uzunluk + dil */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="contentLength">İçerik Uzunluğu</FieldLabel>
                  <select id="contentLength" {...register('contentLength')} className={selectClass}>
                    <option value="kısa">Kısa (300-500 kelime)</option>
                    <option value="orta">Orta (500-1000 kelime)</option>
                    <option value="uzun">Uzun (1000+ kelime)</option>
                  </select>
                </div>
                <div>
                  <FieldLabel htmlFor="language">Dil</FieldLabel>
                  <select id="language" {...register('language')} className={selectClass}>
                    <option value="tr">Türkçe</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              {/* Kalite seviyesi */}
              <div>
                <FieldLabel hint="(Yazının üretileceği model kalitesi)">Kalite Seviyesi</FieldLabel>
                {isEntitlementLoading ? (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    {TIER_ORDER.map((tier) => (
                      <Skeleton key={tier} className="h-36 w-full rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    {TIER_ORDER.map((tier) => {
                      const meta = TIER_META[tier];
                      const info = tierInfos.find((t) => t.tier === tier);
                      const label = info?.label || meta.label;
                      const description = info?.description || meta.description;
                      const TierIcon = meta.Icon;
                      const isAllowed = allowedTiers.includes(tier);
                      const isSelected = isAllowed && selectedTier === tier;
                      const isDefault = entitlement?.defaultTier === tier;
                      const tierCost = estimateTokens(tier, watch('contentLength'));

                      if (!isAllowed) {
                        return (
                          <div
                            key={tier}
                            aria-disabled="true"
                            className="relative rounded-xl border border-border bg-surface-sunken p-4"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                <TierIcon className="h-4 w-4" />
                              </span>
                              <Lock className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <p className="mt-3 text-sm font-semibold text-muted-foreground">{label}</p>
                            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                              {description}
                            </p>
                            <p className="mt-2 text-[11px] text-muted-foreground">
                              ≈ {tierCost.toLocaleString('tr-TR')} token / blog
                            </p>
                            <Link
                              href="/dashboard/plans"
                              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent-foreground underline-offset-4 transition-colors duration-base ease-out-quart hover:underline"
                            >
                              Planınızı yükseltin
                              <ArrowUpRight className="h-3 w-3" />
                            </Link>
                          </div>
                        );
                      }

                      return (
                        <label
                          key={tier}
                          className={`relative cursor-pointer rounded-xl border p-4 transition-[background-color,border-color] duration-base ease-out-quart ${
                            isSelected
                              ? 'border-primary bg-accent'
                              : 'border-border bg-card hover:border-primary/40 hover:bg-secondary'
                          }`}
                        >
                          <input
                            type="radio"
                            value={tier}
                            {...register('model')}
                            className="sr-only"
                          />
                          <div className="flex items-start justify-between gap-2">
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                isSelected
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-secondary text-muted-foreground'
                              }`}
                            >
                              <TierIcon className="h-4 w-4" />
                            </span>
                            {isDefault && !isSelected && (
                              <Badge variant="outline" className="bg-card">
                                Önerilen
                              </Badge>
                            )}
                            {isSelected && <Check className="h-4 w-4 text-accent-foreground" />}
                          </div>
                          <p
                            className={`mt-3 text-sm font-semibold ${
                              isSelected ? 'text-accent-foreground' : 'text-foreground'
                            }`}
                          >
                            {label}
                          </p>
                          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                            {description}
                          </p>
                          <p className="mt-2 text-[11px] text-muted-foreground">
                            ≈ {tierCost.toLocaleString('tr-TR')} token / blog
                          </p>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SEO */}
              <div>
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" {...register('seoMode')} className={checkboxClass} />
                  <span className="text-sm text-foreground">SEO Optimizasyonu</span>
                </label>
              </div>

              {/* Image Search Section */}
              <div className="rounded-xl border border-border bg-secondary/50 p-4">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showImageSearch}
                    onChange={(e) => {
                      setShowImageSearch(e.target.checked);
                      if (!e.target.checked) {
                        setSelectedImage(null);
                        setUnsplashPhotos([]);
                        setImageSearchQuery('');
                      }
                    }}
                    className={checkboxClass}
                  />
                  <span className="text-sm font-medium text-foreground">Kapak Fotoğrafı Ekle</span>
                </label>

                {showImageSearch && (
                  <div className="mt-3 space-y-3">
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={imageSearchQuery}
                        onChange={(e) => setImageSearchQuery(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleImageSearch(1);
                          }
                        }}
                        placeholder="Arama terimi (örn: cyber security, technology)"
                        className="flex-1 bg-card"
                      />
                      <Button
                        type="button"
                        onClick={() => handleImageSearch(1)}
                        disabled={isSearchingImages || !imageSearchQuery.trim()}
                        size="icon"
                        aria-label="Görsel ara"
                      >
                        {isSearchingImages ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <Search />
                        )}
                      </Button>
                    </div>

                    {unsplashPhotos.length > 0 && (
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            {unsplashPhotos.length} resim bulundu
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRefreshImages}
                            disabled={isSearchingImages}
                            className="bg-card text-xs"
                          >
                            <RefreshCw className={isSearchingImages ? 'animate-spin' : ''} />
                            Yenile
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {unsplashPhotos.map((photo) => (
                            <button
                              key={photo.id}
                              type="button"
                              onClick={() => setSelectedImage(photo)}
                              className={`group relative aspect-video overflow-hidden rounded-lg border-2 transition-colors ${
                                selectedImage?.id === photo.id
                                  ? 'border-primary'
                                  : 'border-transparent hover:border-primary/40'
                              }`}
                            >
                              <Image
                                src={photo.urls.small}
                                alt={photo.user.name}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              />
                              {/* Incele icon - sol üst */}
                              <a
                                href={photo.links.html}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="absolute left-1.5 top-1.5 z-10 rounded-lg bg-foreground/70 p-1.5 text-background opacity-0 transition-opacity hover:bg-foreground group-hover:opacity-100"
                                title="Resmi Unsplash'ta incele"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                              {selectedImage?.id === photo.id && (
                                <span className="absolute inset-0 flex items-center justify-center bg-primary/30">
                                  <Check className="h-6 w-6 text-primary-foreground" />
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                        {selectedImage && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            Seçili: {selectedImage.user.name} tarafından
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                {entitlement && (
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface-raised px-3 py-2">
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Coins className="h-3.5 w-3.5 text-accent-foreground" />
                      Kalan: {entitlement.totalTokensRemaining.toLocaleString('tr-TR')} token · ≈
                      {' '}
                      {entitlement.estimatedArticlesRemaining.toLocaleString('tr-TR')} blog
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Bu üretim ≈ {estimatedCost.toLocaleString('tr-TR')} token
                    </span>
                  </div>
                )}
                <Button
                  type="submit"
                  disabled={
                    isLoading || isPolling || !watch('workspaceId') || !watch('topic') || isBlockedByPlan
                  }
                  className="w-full"
                  onClick={(e) => {
                    console.log('Button clicked');
                    console.log('Form values:', watch());
                    console.log('Form errors:', errors);
                    if (!watch('workspaceId')) {
                      e.preventDefault();
                      setError('Lütfen bir workspace seçin.');
                      return;
                    }
                    if (!watch('topic') || watch('topic').trim().length < 5) {
                      e.preventDefault();
                      setError('Konu en az 5 karakter olmalı.');
                      return;
                    }
                  }}
                >
                  {(isLoading || isPolling) ? (
                    <>
                      <Loader2 className="animate-spin" />
                      {postStatus === 'queued' && 'Kuyruğa eklendi...'}
                      {postStatus === 'generating' && 'Blog üretiliyor...'}
                      {!postStatus && 'Gönderiliyor...'}
                    </>
                  ) : (
                    <>
                      <Sparkles />
                      Blog Üret
                    </>
                  )}
                </Button>
                {isBlockedByPlan ? (
                  <div className="mt-2 flex items-start gap-2 rounded-lg border border-border bg-warning-muted p-3 text-xs text-warning">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      {isPlanExpired
                        ? 'Planınızın süresi doldu. Yeni blog üretmek için planınızı yenileyin.'
                        : `Kalan tokenınız bu üretim için yetersiz (≈ ${estimatedCost.toLocaleString('tr-TR')} token gerekiyor).`}{' '}
                      <Link
                        href="/dashboard/plans"
                        className="font-medium underline underline-offset-4"
                      >
                        Planları inceleyin
                      </Link>
                    </span>
                  </div>
                ) : (
                  (!watch('workspaceId') || !watch('topic')) && (
                    <p className="mt-2 text-center text-xs text-muted-foreground">
                      {!watch('workspaceId') && 'Workspace seçin • '}
                      {!watch('topic') && 'Konu girin'}
                    </p>
                  )
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Result */}
        <Card className="shadow-card">
          <CardHeader className="p-5 pb-4">
            <CardTitle className="text-base">Üretilen Blog</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5 pt-0">
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-border bg-[var(--destructive-muted)] p-4 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {isPolling && postStatus && (
              <div className="flex items-center gap-2 rounded-xl border border-border bg-info-muted p-4 text-sm text-info">
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                <span>
                  {postStatus === 'queued' && 'Post kuyruğa eklendi, işlenmeyi bekliyor...'}
                  {postStatus === 'generating' && 'AI blog içeriğini üretiyor, lütfen bekleyin...'}
                  {postStatus === 'generated' && 'Blog başarıyla üretildi!'}
                </span>
              </div>
            )}

            {generatedBlog ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold tracking-tight text-foreground">
                    {generatedBlog.title}
                  </h3>
                  <div className="flex shrink-0 gap-2">
                    {postId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/blogs/${postId}`)}
                      >
                        Detay
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={handleCopy} aria-label="İçeriği kopyala">
                      {copied ? <Check /> : <Copy />}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownload} aria-label="İçeriği indir">
                      <Download />
                    </Button>
                  </div>
                </div>
                <div className="prose prose-lg max-h-[600px] max-w-none overflow-y-auto rounded-xl border border-border bg-secondary p-4 text-foreground">
                  {(() => {
                    const raw = generatedBlog.content || '';
                    const stripped = stripCodeFences(raw);

                    // Always try canonical JSON first, then fall back to markdown
                    try {
                      const parsed = JSON.parse(stripped);
                      if (typeof parsed === 'object' && parsed !== null) {
                        let htmlContent = '';

                        if ((parsed as any).title) {
                          htmlContent += `<h1 class="text-4xl font-bold mb-6 text-foreground">${parsed.title}</h1>`;
                        }

                        let mainContent = '';

                        if ((parsed as any).intro && typeof (parsed as any).intro === 'string') {
                          mainContent += formatMarkdownToHtml(parsed.intro);
                        }

                        if ((parsed as any).body && typeof (parsed as any).body === 'string') {
                          mainContent += formatMarkdownToHtml(parsed.body);
                        }

                        // Canonical JSON: content (markdown gövdesi)
                        if ((parsed as any).content && typeof (parsed as any).content === 'string') {
                          mainContent += formatMarkdownToHtml(parsed.content);
                        }

                        // Eski şema: content_html / content_markdown
                        if ((parsed as any).content_html && typeof (parsed as any).content_html === 'string') {
                          mainContent += parsed.content_html;
                        } else if ((parsed as any).content_markdown && typeof (parsed as any).content_markdown === 'string') {
                          mainContent += formatMarkdownToHtml(parsed.content_markdown);
                        }

                        if ((parsed as any).sections && Array.isArray((parsed as any).sections)) {
                          (parsed as any).sections.forEach((section: any) => {
                            if (section.title) {
                              mainContent += `<h2 class="text-3xl font-semibold mt-8 mb-4 text-foreground">${section.title}</h2>`;
                            }
                            if (section.content && typeof section.content === 'string') {
                              mainContent += formatMarkdownToHtml(section.content);
                            } else if (section.body && typeof section.body === 'string') {
                              mainContent += formatMarkdownToHtml(section.body);
                            }
                            if (section.paragraphs && Array.isArray(section.paragraphs)) {
                              section.paragraphs.forEach((para: string) => {
                                if (para && typeof para === 'string') {
                                  mainContent += formatMarkdownToHtml(para);
                                }
                              });
                            }
                          });
                        }

                        if (!mainContent && (parsed as any).metadata?.blocks) {
                          // Yeni canonical JSON: metadata.blocks
                          const blocks = (parsed as any).metadata.blocks as any[];
                          if (Array.isArray(blocks)) {
                            blocks.forEach((block) => {
                              if (!block || typeof block !== 'object') return;
                              switch (block.type) {
                                case 'heading': {
                                  const level = block.level || 2;
                                  const headingTag = `h${Math.min(Math.max(level, 1), 6)}`;
                                  mainContent += `<${headingTag} class="mt-8 mb-3 font-semibold text-foreground text-${level >= 3 ? '2xl' : '3xl'}">${block.content}</${headingTag}>`;
                                  break;
                                }
                                case 'paragraph': {
                                  mainContent += formatMarkdownToHtml(String(block.content || ''));
                                  break;
                                }
                                case 'list': {
                                  const items = Array.isArray(block.items) ? block.items : [];
                                  if (items.length > 0) {
                                    const listItems = items
                                      .map((item: string) => `<li class="ml-4 mb-2">• ${item}</li>`)
                                      .join('');
                                    mainContent += `<ul class="mb-4 text-muted-foreground leading-relaxed">${listItems}</ul>`;
                                  }
                                  break;
                                }
                                default: {
                                  if (block.content) {
                                    mainContent += formatMarkdownToHtml(String(block.content));
                                  }
                                }
                              }
                            });
                          }
                        }

                        if (mainContent) {
                          htmlContent += `<div class="prose prose-lg max-w-none">${mainContent}</div>`;
                        }

                        if (htmlContent) {
                          return (
                            <div
                              className="text-foreground"
                              dangerouslySetInnerHTML={{ __html: sanitizeHtml(htmlContent) }}
                            />
                          );
                        }
                      }
                    } catch {
                      // Ignore and fall back to markdown below
                    }

                    // Fallback: treat as markdown and render as blog
                    return (
                      <div
                        className="text-foreground"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeHtml(formatMarkdownToHtml(raw),)
                        }}
                      />
                    );
                  })()}
                </div>
              </div>
            ) : (
              <EmptyState icon={<Sparkles />} title="Blog üretmek için formu doldurun" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function GenerateBlogPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Skeleton className="h-96 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    }>
      <GenerateBlogPageContent />
    </Suspense>
  );
}
