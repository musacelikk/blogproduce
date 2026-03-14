'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Loader2, Download, Copy, Check, AlertCircle, Briefcase, Users, PartyPopper, BookOpen, Settings, Sparkles as SparklesIcon, Book, Search, Rocket, Zap, Gem, Image as ImageIcon, Eye, RefreshCw, ExternalLink } from 'lucide-react';
import { generatePost, getPost, getWorkspaces, createWorkspace, searchUnsplashPhotos, triggerUnsplashDownload, type Post, type UnsplashPhoto } from '@/lib/api';
import { trackBlogGeneration, trackFormSubmit, trackButtonClick, trackCustomEvent } from '@/lib/analytics';

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
  model: z.enum(['gpt-4o-mini', 'gpt-4.1-mini', 'gpt-4.1']).optional(),
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
      model: 'gpt-4.1-mini', // Default to medium tier
    },
  });

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
        model: data.model || 'gpt-4.1-mini',
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
      .replace(/^### (.*$)/gim, '<h3 class="text-2xl font-semibold mt-6 mb-3 text-[#202020]">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-3xl font-semibold mt-8 mb-4 text-[#202020]">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-4xl font-bold mt-8 mb-4 text-[#202020]">$1</h1>')
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
      return `<p class="mb-4 text-[#666666] leading-relaxed">${trimmed.replace(/\n/g, '<br />')}</p>`;
    }).join('');
    
    return html;
  };

  return (
    <div className="space-y-6">
      {/* Üst başlık */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            Yeni Blog Üret
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Konu, ton ve hedef kitlenizi belirleyin; BlogGenerator sizin için SEO uyumlu tam bir blog yazısı üretsin.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {postStatus && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--secondary)] text-[11px] font-medium text-muted-foreground">
              <SparklesIcon className="w-3.5 h-3.5 text-[#203eec]" />
              Durum: {postStatus === 'queued' ? 'Kuyrukta' : postStatus === 'generating' ? 'Üretiliyor' : postStatus}
            </span>
          )}
          {isLoading && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--secondary)] text-[11px] font-medium text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin text-[#203eec]" />
              AI blog üretiyor…
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)] gap-6">
        {/* Form */}
        <Card style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <CardHeader className="px-5 pt-5 pb-3">
            <CardTitle
              className="flex items-center gap-2 text-base"
              style={{
              }}
            >
              <Sparkles className="w-4 h-4 text-[#203eec]" />
              Blog Parametreleri
            </CardTitle>
            <CardDescription
              className="text-xs"
              style={{
              }}
            >
              Blog içeriğinizi özelleştirin
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-2">
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
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="workspaceId"
                  className="text-sm font-medium text-foreground mb-2 block"
                >
                  Workspace <span className="text-red-500">*</span>
                  <span className="text-xs text-muted-foreground ml-2 font-normal">
                    (Bloglarınızı organize etmek için çalışma alanı)
                  </span>
                </label>
                {workspaces.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {workspaces.map((ws) => {
                      const selectedWorkspaceId = watch('workspaceId');
                      const isSelected = selectedWorkspaceId === ws.id;
                      // Get initials from workspace name
                      const getInitials = (name: string) => {
                        const words = name.trim().split(/\s+/);
                        if (words.length >= 2) {
                          return (words[0][0] + words[1][0]).toUpperCase();
                        }
                        return name.substring(0, 2).toUpperCase();
                      };
                      const initials = getInitials(ws.name);
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
                        { value: 'gray', label: 'Gri', class: 'bg-gradient-to-br from-slate-500 to-slate-600' },
                        { value: 'black', label: 'Siyah', class: 'bg-gradient-to-br from-slate-900 to-slate-900' },
                      ];
                      // Use saved color or fallback to hash-based color
                      let bgColor = 'bg-gradient-to-br from-blue-500 to-blue-600';
                      if (ws.color) {
                        const colorOption = workspaceColors.find(c => c.value === ws.color);
                        if (colorOption) {
                          bgColor = colorOption.class;
                        }
                      } else {
                        // Fallback to hash-based color
                        const colors = workspaceColors.map(c => c.class);
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
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                            isSelected
                              ? 'border-[#203eec] bg-[#203eec0f] shadow-md scale-105'
                              : 'border-[var(--border)] bg-[var(--card)] hover:border-[#203eec]/50 hover:shadow-sm'
                          }`}
                        >
                          <div className={`w-16 h-16 ${bgColor} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                            {initials}
                          </div>
                          <span
                            className={`text-xs font-medium text-center max-w-[80px] ${
                              isSelected ? 'text-[#203eec]' : 'text-foreground'
                            }`}
                          >
                            {ws.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 rounded-lg text-sm" style={{ background: 'var(--secondary)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}>
                    <p>Workspace oluşturuluyor, lütfen bekleyin...</p>
                  </div>
                )}
                {errors.workspaceId && (
                  <p className="text-xs text-red-500 mt-1">{errors.workspaceId.message}</p>
                )}
              </div>
              
              <div>
                <label
                  htmlFor="topic"
                  className="text-sm font-medium text-foreground mb-2 block"
                >
                  Konu <span className="text-red-500">*</span>
                  <span className="text-xs text-muted-foreground ml-2 font-normal">
                    (5-200 karakter)
                  </span>
                </label>
                <Input
                  id="topic"
                  {...register('topic')}
                  placeholder="Örn: Yapay Zeka ve Blog İçerik Üretimi"
                  className="border-[#e5e5e5] focus:border-[#203eec]"
                  maxLength={200}
                />
                <div className="flex items-center justify-between mt-1">
                {errors.topic && (
                  <p
                      className="text-xs text-red-500"
                    style={{
                    }}
                  >
                    {errors.topic.message}
                  </p>
                )}
                  <p className="text-xs text-muted-foreground ml-auto">
                    {watch('topic')?.length || 0}/200
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="additionalContext"
                  className="text-sm font-medium text-foreground mb-2 block"
                >
                  Ek Bağlam
                  <span className="text-xs text-muted-foreground ml-2 font-normal">
                  Opsiyonel (Maksimum 1000 karakter)
                  </span>
                </label>
                <Textarea
                  id="additionalContext"
                  {...register('additionalContext')}
                  placeholder="Blog hakkında ek bilgiler, odaklanılacak noktalar..."
                  rows={3}
                  className="border-[#e5e5e5] focus:border-[#203eec]"
                  maxLength={1000}
                />
                {errors.additionalContext && (
                  <p
                    className="text-xs text-red-500 mt-1"
                    style={{
                    }}
                  >
                    {errors.additionalContext.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {watch('additionalContext')?.length || 0}/1000
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="tone"
                    className="text-sm font-medium text-[#202020] mb-3 block"
                    style={{
                    }}
                  >
                    Ton
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedTones.map((tone) => (
                      <span
                        key={tone}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#203eec]/10 text-[#203eec] rounded-full text-sm font-medium"
                      >
                        {tone}
                        <button
                          type="button"
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
                          className="hover:text-[#1a32cc] transition-colors"
                        >
                          x
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
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
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all text-sm ${
                            isSelected
                              ? 'border-[#203eec] bg-[#203eec]/10 text-[#203eec] font-medium shadow-sm'
                              : 'border-[#e5e5e5] bg-white hover:border-[#203eec]/50 hover:bg-[#f5f5f5] text-[#202020]'
                          }`}
                        >
                          <IconComponent className={`w-4 h-4 ${isSelected ? 'text-[#203eec]' : 'text-[#666666]'}`} />
                          <span>{toneOption.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  {selectedTones.length > 0 && (
                    <p
                      className="text-xs text-[#666666] mt-2"
                      style={{
                      }}
                    >
                      {selectedTones.length} ton seçildi
                    </p>
                  )}
                  {selectedTones.includes('Diğer') && (
                    <div className="mt-3">
                      <label
                        htmlFor="customTone"
                        className="text-xs font-medium text-[#666666] mb-1.5 block"
                        style={{
                        }}
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
                    className="border-[#e5e5e5] focus:border-[#203eec]"
                        maxLength={100}
                      />
                      {customToneInput && (
                        <p
                          className="text-xs text-[#999999] mt-1 text-right"
                          style={{
                          }}
                        >
                          {customToneInput.length}/100
                        </p>
                      )}
                    </div>
                  )}
                  {errors.tone && (
                    <p
                      className="text-xs text-red-500 mt-1"
                      style={{
                      }}
                    >
                      {errors.tone.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="targetAudience"
                    className="text-sm font-medium text-[#202020] mb-2 block"
                    style={{
                    }}
                  >
                    Hedef Kitle
                    <span className="text-xs text-[#666666] ml-2 font-normal">
                      (Enter&apos;a basarak ekleyin)
                    </span>
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {targetAudienceTags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#203eec]/10 text-[#203eec] rounded-full text-sm font-medium"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => {
                            const newTags = targetAudienceTags.filter((_, i) => i !== index);
                            setTargetAudienceTags(newTags);
                            setValue('targetAudience', newTags.join(', '));
                          }}
                          className="hover:text-[#1a32cc] transition-colors"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
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
                    className="border-[#e5e5e5] focus:border-[#203eec]"
                    maxLength={100}
                  />
                  {errors.targetAudience && (
                    <p
                      className="text-xs text-red-500 mt-1"
                      style={{
                      }}
                    >
                      {errors.targetAudience.message}
                    </p>
                  )}
                  <p
                    className="text-xs text-[#999999] mt-1"
                    style={{
                    }}
                  >
                    {targetAudienceTags.length} etiket eklendi
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="contentLength"
                    className="text-sm font-medium text-[#202020] mb-2 block"
                    style={{
                    }}
                  >
                    İçerik Uzunluğu
                  </label>
                  <select
                    id="contentLength"
                    {...register('contentLength')}
                    className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:border-[#203eec] focus:outline-none"
                  >
                    <option value="kısa">Kısa (300-500 kelime)</option>
                    <option value="orta">Orta (500-1000 kelime)</option>
                    <option value="uzun">Uzun (1000+ kelime)</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="language"
                    className="text-sm font-medium text-[#202020] mb-2 block"
                    style={{
                    }}
                  >
                    Dil
                  </label>
                  <select
                    id="language"
                    {...register('language')}
                    className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:border-[#203eec] focus:outline-none"
                  >
                    <option value="tr">Türkçe</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  className="text-sm font-medium text-[#202020] mb-3 block"
                  style={{
                  }}
                >
                  Model Seviyesi
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    {
                      value: 'gpt-4o-mini',
                      Icon: Rocket,
                      title: 'Ucuz',
                      subtitle: 'gpt-4o-mini',
                      price: '$0.15 / $0.60',
                      description: 'Yüksek hacim içerik',
                      useCases: 'Kategori açıklaması, kısa blog, ürün metni',
                      color: 'border-[#10B981] bg-green-50',
                      selectedColor: 'border-[#10B981] bg-green-100',
                    },
                    {
                      value: 'gpt-4.1-mini',
                      Icon: Zap,
                      title: 'Orta',
                      subtitle: 'gpt-4.1-mini',
                      price: '$0.40 / $1.60',
                      description: 'Default SEO blog',
                      useCases: 'SEO kaliteli blog (önerilen)',
                      color: 'border-[#203eec] bg-blue-50',
                      selectedColor: 'border-[#203eec] bg-blue-100',
                      recommended: true,
                    },
                    {
                      value: 'gpt-4.1',
                      Icon: Gem,
                      title: 'Pahalı',
                      subtitle: 'gpt-4.1',
                      price: '$2.00 / $8.00',
                      description: 'Premium/Pillar content',
                      useCases: 'Ana sayfa rehber, pillar content',
                      color: 'border-[#8B5CF6] bg-purple-50',
                      selectedColor: 'border-[#8B5CF6] bg-purple-100',
                    },
                  ].map((model) => {
                    const selectedModel = watch('model') || 'gpt-4.1-mini';
                    const isSelected = selectedModel === model.value;
                    const IconComponent = model.Icon;
                    return (
                      <label
                        key={model.value}
                        className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all ${
                          isSelected
                            ? `${model.selectedColor} shadow-md`
                            : `${model.color} hover:shadow-sm`
                        }`}
                      >
                        <input
                          type="radio"
                          value={model.value}
                          {...register('model')}
                          className="sr-only"
                        />
                        {model.recommended && (
                          <span className="absolute top-2 right-2 text-xs font-medium text-[#203eec] bg-white px-2 py-0.5 rounded-full">
                            Önerilen
                          </span>
                        )}
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 ${isSelected ? 'text-[#203eec]' : 'text-[#666666]'}`}>
                            <IconComponent className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4
                                className="text-sm font-semibold text-[#202020]"
                                style={{
                                }}
                              >
                                {model.title}
                              </h4>
                              {isSelected && (
                                <div className="w-4 h-4 rounded-full bg-[#203eec] flex items-center justify-center">
                                  <div className="w-2 h-2 rounded-full bg-white"></div>
                                </div>
                              )}
                            </div>
                            <p
                              className="text-xs text-[#666666] mb-1"
                              style={{
                              }}
                            >
                              {model.description}
                            </p>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('seoMode')}
                    className="w-4 h-4 text-[#203eec] border-[#e5e5e5] rounded focus:ring-[#203eec]"
                  />
                  <span
                    className="text-sm text-[#202020]"
                    style={{
                    }}
                  >
                    SEO Optimizasyonu
                  </span>
                </label>
              </div>

              {/* Image Search Section */}
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-[#e5e5e5]/50">
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
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
                      className="w-4 h-4 text-[#203eec] border-[#e5e5e5] rounded focus:ring-[#203eec]"
                    />
                    <span
                      className="text-sm font-medium text-[#202020]"
                      style={{
                      }}
                    >
                      Kapak Fotoğrafı Ekle
                    </span>
                  </label>
                </div>

                {showImageSearch && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={imageSearchQuery}
                        onChange={(e) => setImageSearchQuery(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleImageSearch(1);
                          }
                        }}
                        placeholder="Arama terimi (örn: cyber security, technology)"
                        className="flex-1 px-3 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:border-[#203eec] focus:outline-none"
                      />
                      <Button
                        type="button"
                        onClick={() => handleImageSearch(1)}
                        disabled={isSearchingImages || !imageSearchQuery.trim()}
                        className="bg-[#203eec] hover:bg-[#1a32cc] text-white px-4"
                      >
                        {isSearchingImages ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    {unsplashPhotos.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-[#666666]">
                            {unsplashPhotos.length} resim bulundu
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRefreshImages}
                            disabled={isSearchingImages}
                            className="text-xs"
                          >
                            <RefreshCw className={`w-3 h-3 mr-1 ${isSearchingImages ? 'animate-spin' : ''}`} />
                            Yenile
                          </Button>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {unsplashPhotos.map((photo) => (
                            <button
                              key={photo.id}
                              type="button"
                              onClick={() => setSelectedImage(photo)}
                              className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all group ${
                                selectedImage?.id === photo.id
                                  ? 'border-[#203eec] ring-2 ring-[#203eec]/30 scale-105'
                                  : 'border-transparent hover:border-[#203eec]/50'
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
                                className="absolute top-1.5 left-1.5 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                title="Resmi Unsplash'ta incele"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                              {selectedImage?.id === photo.id && (
                                <div className="absolute inset-0 bg-[#203eec]/20 flex items-center justify-center">
                                  <Check className="w-6 h-6 text-white drop-shadow-lg" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                        {selectedImage && (
                          <p className="text-xs text-[#666666] mt-2">
                            Seçili: {selectedImage.user.name} tarafından
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading || isPolling || !watch('workspaceId') || !watch('topic')}
                className="w-full bg-[#203eec] hover:bg-[#1a32cc] text-white rounded-full py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                }}
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
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    {postStatus === 'queued' && 'Kuyruğa eklendi...'}
                    {postStatus === 'generating' && 'Blog üretiliyor...'}
                    {!postStatus && 'Gönderiliyor...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    Blog Üret
                  </>
                )}
              </Button>
              {(!watch('workspaceId') || !watch('topic')) && (
                <p className="text-xs text-[#999999] text-center mt-2">
                  {!watch('workspaceId') && 'Workspace seçin • '}
                  {!watch('topic') && 'Konu girin'}
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Result */}
        <Card className="border-[#e5e5e5]">
          <CardHeader className="p-5">
            <CardTitle
              className="text-base"
              style={{
              }}
            >
              Üretilen Blog
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            {error && (
              <div
                className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-start gap-2"
                style={{
                }}
              >
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {isPolling && postStatus && (
              <div
                className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-600 text-sm mb-4"
                style={{
                }}
              >
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {postStatus === 'queued' && 'Post kuyruğa eklendi, işlenmeyi bekliyor...'}
                    {postStatus === 'generating' && 'AI blog içeriğini üretiyor, lütfen bekleyin...'}
                    {postStatus === 'generated' && 'Blog başarıyla üretildi!'}
                  </span>
                </div>
              </div>
            )}

            {generatedBlog ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3
                    className="text-lg font-semibold text-[#202020]"
                    style={{
                    }}
                  >
                    {generatedBlog.title}
                  </h3>
                  <div className="flex gap-2">
                    {postId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/blogs/${postId}`)}
                        className="border-[#e5e5e5]"
                      >
                        Detay
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className="border-[#e5e5e5]"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownload}
                      className="border-[#e5e5e5]"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div
                  className="prose prose-lg max-w-none p-4 bg-[#fafafa] rounded-xl border border-[#e5e5e5] max-h-[600px] overflow-y-auto"
                  style={{
                  }}
                >
                  {(() => {
                    const raw = generatedBlog.content || '';
                    const stripped = stripCodeFences(raw);

                    // Always try canonical JSON first, then fall back to markdown
                    try {
                      const parsed = JSON.parse(stripped);
                      if (typeof parsed === 'object' && parsed !== null) {
                        let htmlContent = '';

                        if ((parsed as any).title) {
                          htmlContent += `<h1 class="text-4xl font-bold mb-6 text-[#202020]">${parsed.title}</h1>`;
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
                              mainContent += `<h2 class="text-3xl font-semibold mt-8 mb-4 text-[#202020]">${section.title}</h2>`;
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
                                  mainContent += `<${headingTag} class="mt-8 mb-3 font-semibold text-[#202020] text-${level >= 3 ? '2xl' : '3xl'}">${block.content}</${headingTag}>`;
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
                                    mainContent += `<ul class="mb-4 text-[#666666] leading-relaxed">${listItems}</ul>`;
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
                              dangerouslySetInnerHTML={{ __html: htmlContent }}
                              style={{ color: '#202020' }}
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
                        dangerouslySetInnerHTML={{
                          __html: formatMarkdownToHtml(raw),
                        }}
                        style={{ color: '#202020' }}
                      />
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-[#999999]">
                <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p
                  className="text-sm"
                  style={{
                  }}
                >
                  Blog üretmek için formu doldurun
                </p>
              </div>
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
      <div className="min-h-screen bg-[var(--background)] p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-[var(--card)] rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-[var(--card)] rounded"></div>
          </div>
        </div>
      </div>
    }>
      <GenerateBlogPageContent />
    </Suspense>
  );
}

