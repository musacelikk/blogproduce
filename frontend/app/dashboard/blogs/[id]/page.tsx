'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  FileText,
  Calendar,
  User,
  Building2,
  Tag,
  Eye,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Globe,
  Zap,
  Copy,
  Download,
  Edit,
  Save,
  X,
  Hash,
  FileX,
  Image as ImageIcon,
  Search,
  RefreshCw,
  Check,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { getPost, updatePost, publishPost, unpublishPost, deletePost, searchUnsplashPhotos, triggerUnsplashDownload, type Post, type UnsplashPhoto } from '@/lib/api';

const statusColors = {
  draft: 'bg-gray-100 text-gray-700',
  queued: 'bg-yellow-100 text-yellow-700',
  generating: 'bg-blue-100 text-blue-700',
  generated: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  published: 'bg-purple-100 text-purple-700',
};

const statusIcons = {
  draft: FileText,
  queued: Clock,
  generating: Loader2,
  generated: CheckCircle2,
  failed: XCircle,
  published: CheckCircle2,
};

export default function BlogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRevisionIndex, setSelectedRevisionIndex] = useState<number>(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [editedSlug, setEditedSlug] = useState('');
  const [saving, setSaving] = useState(false);
  const [togglingPublish, setTogglingPublish] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showImageSearch, setShowImageSearch] = useState(false);
  const [imageSearchQuery, setImageSearchQuery] = useState('');
  const [unsplashPhotos, setUnsplashPhotos] = useState<UnsplashPhoto[]>([]);
  const [selectedImage, setSelectedImage] = useState<UnsplashPhoto | null>(null);
  const [isSearchingImages, setIsSearchingImages] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [updatingImage, setUpdatingImage] = useState(false);

  useEffect(() => {
    if (postId) {
      loadPost();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  useEffect(() => {
    if (post?.revisions?.[selectedRevisionIndex]?.content) {
      setEditedContent(post.revisions[selectedRevisionIndex].content);
    }
    if (post?.slug) {
      setEditedSlug(post.slug);
    }
  }, [post, selectedRevisionIndex]);

  const loadPost = async () => {
    try {
      setLoading(true);
      setError(null);
      const postData = await getPost(postId);
      setPost(postData);
      // En son versiyonu seç
      if (postData.revisions && postData.revisions.length > 0) {
        setSelectedRevisionIndex(0);
        setEditedContent(postData.revisions[0].content);
      }
      if (postData.slug) {
        setEditedSlug(postData.slug);
      }
    } catch (err) {
      console.error('Error loading post:', err);
      setError(err instanceof Error ? err.message : 'Blog yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!post || !editedContent.trim()) return;

    // Check if content or slug actually changed
    const selectedRevision = post.revisions?.[selectedRevisionIndex];
    const contentChanged = selectedRevision?.content !== editedContent;
    const slugChanged = post.slug !== editedSlug;

    if (!contentChanged && !slugChanged) {
      setIsEditing(false);
      return;
    }

    try {
      setSaving(true);
      const updateData: any = {};
      
      if (contentChanged) {
        updateData.content = editedContent;
        updateData.contentFormat = selectedRevision?.contentFormat || 'md';
      }
      
      if (slugChanged) {
        updateData.slug = editedSlug.trim();
      }

      await updatePost(postId, updateData);
      await loadPost();
      // After saving, select the newest version (index 0)
      setSelectedRevisionIndex(0);
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving post:', err);
      alert(err instanceof Error ? err.message : 'Kaydedilirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyContent = () => {
    const selectedRevision = post?.revisions?.[selectedRevisionIndex];
    if (selectedRevision?.content) {
      navigator.clipboard.writeText(selectedRevision.content);
      // Toast notification could be added here
    }
  };

  const handleCopyContentAs = async (target: 'json' | 'markdown' | 'html') => {
    const selectedRevision = post?.revisions?.[selectedRevisionIndex];
    if (!selectedRevision?.content) return;

    const raw = selectedRevision.content;
    const format = selectedRevision.contentFormat?.toLowerCase() || 'json';

    try {
      if (target === 'json') {
        if (format === 'json') {
          try {
            const parsed = JSON.parse(raw);
            await navigator.clipboard.writeText(JSON.stringify(parsed, null, 2));
          } catch {
            await navigator.clipboard.writeText(raw);
          }
        } else {
          await navigator.clipboard.writeText(raw);
        }
        return;
      }

      if (target === 'markdown') {
        if (format === 'json') {
          try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
              const markdownSource =
                (parsed as any).content_markdown ||
                (parsed as any).content ||
                (parsed as any).body ||
                (parsed as any).intro ||
                '';
              if (markdownSource) {
                await navigator.clipboard.writeText(markdownSource);
                return;
              }
            }
          } catch {
            // fall through to fallback
          }
        }
        // Fallback: treat raw content as markdown/plain text
        await navigator.clipboard.writeText(raw);
        return;
      }

      if (target === 'html') {
        let htmlToCopy = '';

        if (format === 'html') {
          htmlToCopy = raw;
        } else if (format === 'json') {
          try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
              if ((parsed as any).content_html && typeof (parsed as any).content_html === 'string') {
                htmlToCopy = (parsed as any).content_html as string;
              } else if ((parsed as any).content_markdown && typeof (parsed as any).content_markdown === 'string') {
                htmlToCopy = formatMarkdown((parsed as any).content_markdown as string);
              } else if ((parsed as any).content && typeof (parsed as any).content === 'string') {
                htmlToCopy = formatMarkdown((parsed as any).content as string);
              }
            }
          } catch {
            // ignore and use fallback
          }
        }

        if (!htmlToCopy) {
          // Fallback: convert raw (assumed markdown) to simple HTML preview
          htmlToCopy = formatMarkdown(raw);
        }

        await navigator.clipboard.writeText(htmlToCopy);
      }
    } catch (err) {
      console.error('Error copying content:', err);
    }
  };

  const handleDownloadContent = () => {
    const selectedRevision = post?.revisions?.[selectedRevisionIndex];
    if (selectedRevision?.content) {
      const blob = new Blob([selectedRevision.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${post?.title || 'blog'}-versiyon-${selectedRevisionIndex + 1}.${selectedRevision.contentFormat || 'txt'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleTogglePublish = async () => {
    if (!post) return;

    try {
      setTogglingPublish(true);
      if (post.status === 'published') {
        await unpublishPost(post.id);
      } else if (post.status === 'draft' || post.status === 'generated') {
        await publishPost(post.id);
      }
      await loadPost();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Blog durumu değiştirilirken bir hata oluştu');
    } finally {
      setTogglingPublish(false);
    }
  };

  const handleDelete = async () => {
    if (!post) return;
    
    if (!confirm('Bu blogu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }

    try {
      setDeleting(true);
      await deletePost(post.id);
      router.push('/dashboard/blogs');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Blog silinirken bir hata oluştu');
    } finally {
      setDeleting(false);
    }
  };

  const handleImageSearch = async (page: number = 1) => {
    if (!imageSearchQuery.trim()) return;
    
    try {
      setIsSearchingImages(true);
      setCurrentPage(page);
      const photos = await searchUnsplashPhotos(imageSearchQuery.trim(), 8, page);
      setUnsplashPhotos(photos);
    } catch (err) {
      console.error('Error searching images:', err);
      alert('Resim arama sırasında bir hata oluştu');
    } finally {
      setIsSearchingImages(false);
    }
  };

  const handleUpdateImage = async () => {
    if (!post || !selectedImage) return;

    try {
      setUpdatingImage(true);
      const creditData = {
        name: selectedImage.user.name,
        photographerUrl: selectedImage.user.links.html,
        photoUrl: selectedImage.links.html,
      };
      
      await updatePost(post.id, {
        coverImageUrl: selectedImage.urls.regular,
        coverImageCreditJson: JSON.stringify(creditData) as any,
      });
      
      // Trigger Unsplash download
      triggerUnsplashDownload(selectedImage.id).catch(console.error);
      
      await loadPost();
      setShowImageSearch(false);
      setSelectedImage(null);
      setUnsplashPhotos([]);
      setImageSearchQuery('');
    } catch (err) {
      console.error('Error updating image:', err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : typeof err === 'object' && err !== null && 'message' in err
        ? String(err.message)
        : 'Resim güncellenirken bir hata oluştu';
      alert(errorMessage);
    } finally {
      setUpdatingImage(false);
    }
  };

  const formatMarkdown = (content: string): string => {
    return content
      .replace(/^### (.*$)/gim, '<h3 class="text-2xl font-semibold mt-6 mb-3 text-[#202020]">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-3xl font-semibold mt-8 mb-4 text-[#202020]">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-4xl font-bold mt-8 mb-4 text-[#202020]">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
      .replace(/^- (.*$)/gim, '<li class="ml-4 mb-2">• $1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 mb-2">$1</li>')
      .replace(/\n/g, '<br />');
  };

  // Strip ``` fences (```json ... ```) from AI output if present
  const stripCodeFences = (raw: string): string => {
    if (!raw || typeof raw !== 'string') return '';
    let text = raw.trim();

    if (text.startsWith('```')) {
      const firstNewline = text.indexOf('\n');
      if (firstNewline !== -1) {
        text = text.slice(firstNewline + 1);
      }
      const lastFence = text.lastIndexOf('```');
      if (lastFence !== -1) {
        text = text.slice(0, lastFence);
      }
    }

    return text.trim();
  };

  // Render stored content (JSON canonical or markdown/html) to HTML for dashboard preview
  const renderContentHtml = (rawContent: string, format?: string | null): string => {
    const cleaned = stripCodeFences(rawContent);
    if (!cleaned) return '';

    const fmt = (format || '').toLowerCase();

    // If revision already stored as pure HTML, just return it
    if (fmt === 'html') {
      return cleaned;
    }

    // Try canonical JSON first
    try {
      const parsed: any = JSON.parse(cleaned);
      if (parsed && typeof parsed === 'object') {
        const parts: string[] = [];

        // Title as H1
        if (parsed.title && typeof parsed.title === 'string') {
          parts.push(`# ${parsed.title}`);
        }

        // Intro / body sections
        if (parsed.intro && typeof parsed.intro === 'string') {
          parts.push(parsed.intro);
        }

        if (parsed.body && typeof parsed.body === 'string') {
          parts.push(parsed.body);
        }

        // Canonical content field
        if (parsed.content && typeof parsed.content === 'string') {
          parts.push(parsed.content);
        }

        // Legacy content_markdown
        if (!parts.length && parsed.content_markdown && typeof parsed.content_markdown === 'string') {
          parts.push(parsed.content_markdown);
        }

        // Sections + subsections
        if (Array.isArray(parsed.sections)) {
          parsed.sections.forEach((section: any) => {
            if (!section || typeof section !== 'object') return;

            const sectionBlocks: string[] = [];
            const heading = (section.title || section.heading) as string | undefined;

            if (heading && typeof heading === 'string') {
              sectionBlocks.push(`## ${heading.trim()}`);
            }

            if (typeof section.content === 'string' && section.content.trim()) {
              sectionBlocks.push(section.content.trim());
            } else if (Array.isArray(section.content)) {
              section.content.forEach((c: any) => {
                if (typeof c === 'string' && c.trim()) {
                  sectionBlocks.push(c.trim());
                }
              });
            }

            if (typeof section.body === 'string' && section.body.trim()) {
              sectionBlocks.push(section.body.trim());
            }

            if (Array.isArray(section.paragraphs)) {
              section.paragraphs.forEach((para: any) => {
                if (typeof para === 'string' && para.trim()) {
                  sectionBlocks.push(para.trim());
                }
              });
            }

            if (Array.isArray(section.subsections)) {
              section.subsections.forEach((sub: any) => {
                if (!sub || typeof sub !== 'object') return;
                const subHeading = (sub.title || sub.heading) as string | undefined;
                if (subHeading && typeof subHeading === 'string') {
                  sectionBlocks.push(`### ${subHeading.trim()}`);
                }
                if (typeof sub.content === 'string' && sub.content.trim()) {
                  sectionBlocks.push(sub.content.trim());
                }
                if (Array.isArray(sub.paragraphs)) {
                  sub.paragraphs.forEach((para: any) => {
                    if (typeof para === 'string' && para.trim()) {
                      sectionBlocks.push(para.trim());
                    }
                  });
                }
              });
            }

            if (sectionBlocks.length) {
              parts.push(sectionBlocks.join('\n\n'));
            }
          });
        }

        const markdown = parts.join('\n\n').trim();
        if (markdown) {
          return formatMarkdown(markdown);
        }
      }
    } catch {
      // Ignore JSON parse errors and fall back to markdown rendering
    }

    // Fallback: treat content as markdown/plain text
    return formatMarkdown(cleaned);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-2 text-[#203eec] animate-spin" />
          <p className="text-sm text-[#666666]">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-[#666666] hover:text-[#202020]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800 mb-1">Hata</h3>
              <p className="text-xs text-red-600">{error || 'Blog bulunamadı'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const StatusIcon = statusIcons[post.status as keyof typeof statusIcons] || FileText;
  const statusColor = statusColors[post.status as keyof typeof statusColors] || statusColors.draft;
  const isGenerating = post.status === 'generating' || post.status === 'queued';
  const selectedRevision = post.revisions?.[selectedRevisionIndex];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/blogs')}
            className="text-[#666666] hover:text-[#202020]"
          >
            <ArrowLeft className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Geri</span>
          </Button>
          <h1
            className="text-xl sm:text-2xl font-medium text-[#202020]"
            style={{
              fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
            }}
          >
            Blog Detayı
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <span className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium ${statusColor}`}>
            {isGenerating ? (
              <StatusIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
            ) : (
              <StatusIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            )}
            <span className="hidden sm:inline">{post.status}</span>
            <span className="sm:hidden">{post.status.substring(0, 4)}</span>
          </span>
          {!isGenerating && (post.status === 'draft' || post.status === 'generated' || post.status === 'published') && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleTogglePublish}
              disabled={togglingPublish}
              className={
                post.status === 'published'
                  ? 'text-orange-600 border-orange-200 hover:bg-orange-50 text-xs'
                  : 'text-green-600 border-green-200 hover:bg-green-50 text-xs'
              }
            >
              {togglingPublish ? (
                <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1.5 animate-spin" />
              ) : post.status === 'published' ? (
                <>
                  <FileX className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">Taslağa Al</span>
                </>
              ) : (
                <>
                  <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">Yayınla</span>
                </>
              )}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
          >
            {deleting ? (
              <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1.5 animate-spin" />
            ) : (
              <FileX className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1.5" />
            )}
            <span className="hidden sm:inline">Sil</span>
          </Button>
        </div>
      </motion.div>

      {/* Post Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white rounded-xl border border-[#e5e5e5] p-4 sm:p-6"
      >
        <h2
          className="text-lg sm:text-xl font-medium text-[#202020] mb-4"
          style={{
            fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
          }}
        >
          {post.title}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm text-[#666666]">
            <Hash className="w-4 h-4" />
            <span>ID: {post.id}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#666666]">
            <Calendar className="w-4 h-4" />
            <span>
              Oluşturulma: {new Date(post.createdAt).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#666666]">
            <Calendar className="w-4 h-4" />
            <span>
              Güncellenme: {new Date(post.updatedAt).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          {post.workspace && (
            <div className="flex items-center gap-2 text-sm text-[#666666]">
              <Building2 className="w-4 h-4" />
              <span>Workspace: {post.workspace.name}</span>
            </div>
          )}
          {post.slug && (
            <div className="flex items-center gap-2 text-sm text-[#666666]">
              <Globe className="w-4 h-4" />
              {isEditing ? (
                <div className="flex-1">
                  <input
                    type="text"
                    value={editedSlug}
                    onChange={(e) => setEditedSlug(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white rounded-lg border border-[#e5e5e5] text-[#202020] text-sm focus:border-[#203eec] focus:outline-none"
                    placeholder="Slug"
                  />
                </div>
              ) : (
                <span>Slug: {post.slug}</span>
              )}
            </div>
          )}
          {post.language && (
            <div className="flex items-center gap-2 text-sm text-[#666666]">
              <Globe className="w-4 h-4" />
              <span>Dil: {post.language}</span>
            </div>
          )}
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Tag className="w-4 h-4 text-[#666666]" />
            {post.tags.map((tag) => (
              <span
                key={tag.id}
                className="px-2.5 py-1 rounded-full text-xs bg-[#f5f5f5] text-[#666666]"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {post.excerpt && (
          <div className="mb-4">
            <p className="text-sm text-[#666666] leading-relaxed">{post.excerpt}</p>
          </div>
        )}

        {/* Cover Image */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-[#202020]">
              Kapak Resmi
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImageSearch(true)}
              className="text-xs"
            >
              <ImageIcon className="w-3.5 h-3.5 mr-1.5" />
              {post.coverImageUrl ? 'Değiştir' : 'Ekle'}
            </Button>
          </div>
          {post.coverImageUrl ? (
            <div className="relative w-full h-48 sm:h-64 rounded-lg overflow-hidden border border-[#e5e5e5]">
              <Image
                src={post.coverImageUrl}
                alt={post.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 800px"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/images/default-blog.jpg';
                }}
              />
              {post.coverImageCreditJson && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-xs">
                  <a
                    href={post.coverImageCreditJson.photographerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    Fotoğraf: {post.coverImageCreditJson.name}
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-48 sm:h-64 rounded-lg border-2 border-dashed border-[#e5e5e5] flex items-center justify-center bg-[#fafafa]">
              <div className="text-center">
                <ImageIcon className="w-12 h-12 text-[#999999] mx-auto mb-2" />
                <p className="text-sm text-[#666666]">Kapak resmi yok</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Versions */}
      {post.revisions && post.revisions.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-xl border border-[#e5e5e5] p-6"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-2 mb-4">
            <h3
              className="text-base sm:text-lg font-medium text-[#202020]"
              style={{
                fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
              }}
            >
              Versiyonlar ({post.revisions.length})
            </h3>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {!isEditing && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="text-[#666666] border-[#e5e5e5] hover:border-[#203eec] hover:text-[#203eec] text-xs flex-1 sm:flex-initial"
                  >
                    <Edit className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1.5" />
                    <span className="hidden sm:inline">Düzenle</span>
                  </Button>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyContentAs('json')}
                      className="text-[#666666] border-[#e5e5e5] hover:border-[#203eec] hover:text-[#203eec] text-[10px]"
                    >
                      <Copy className="w-3 h-3 sm:mr-1" />
                      <span className="hidden sm:inline">JSON</span>
                      <span className="sm:hidden">J</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyContentAs('markdown')}
                      className="text-[#666666] border-[#e5e5e5] hover:border-[#203eec] hover:text-[#203eec] text-[10px]"
                    >
                      <Copy className="w-3 h-3 sm:mr-1" />
                      <span className="hidden sm:inline">Markdown</span>
                      <span className="sm:hidden">MD</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyContentAs('html')}
                      className="text-[#666666] border-[#e5e5e5] hover:border-[#203eec] hover:text-[#203eec] text-[10px]"
                    >
                      <Copy className="w-3 h-3 sm:mr-1" />
                      <span className="hidden sm:inline">HTML</span>
                      <span className="sm:hidden">H</span>
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadContent}
                    className="text-[#666666] border-[#e5e5e5] hover:border-[#203eec] hover:text-[#203eec] text-xs flex-1 sm:flex-initial"
                  >
                    <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1.5" />
                    <span className="hidden sm:inline">İndir</span>
                  </Button>
                </>
              )}
              {isEditing && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                    className="text-white bg-[#203eec] border-[#203eec] hover:bg-[#1a32cc] text-xs flex-1 sm:flex-initial"
                  >
                    {saving ? (
                      <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1.5 animate-spin" />
                    ) : (
                      <Save className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1.5" />
                    )}
                    <span className="hidden sm:inline">Kaydet</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false);
                      setEditedContent(selectedRevision?.content || '');
                      setEditedSlug(post?.slug || '');
                    }}
                    className="text-[#666666] border-[#e5e5e5] hover:border-[#203eec] hover:text-[#203eec] text-xs flex-1 sm:flex-initial"
                  >
                    <X className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1.5" />
                    <span className="hidden sm:inline">İptal</span>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Version Selector */}
          {post.revisions.length > 1 && !isEditing && (
            <div className="mb-4">
              <select
                value={selectedRevisionIndex}
                onChange={(e) => setSelectedRevisionIndex(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#f5f5f5] rounded-lg border border-[#e5e5e5] text-[#202020] text-sm focus:border-[#203eec] focus:outline-none"
              >
                {post.revisions.map((revision, index) => {
                  // Versiyon numarasını hesapla (en yeni versiyon v1, en eski vN)
                  const versionNumber = (post.revisions?.length || 0) - index;
                  return (
                    <option key={revision.id} value={index}>
                      v{versionNumber} - {new Date(revision.createdAt).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {revision.contentFormat && ` (${revision.contentFormat.toUpperCase()})`}
                      {revision.model && ` - ${revision.model}`}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Selected Version Info */}
          {selectedRevision && !isEditing && (
            <div className="mb-4 p-3 sm:p-4 bg-[#f5f5f5] rounded-lg border border-[#e5e5e5]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 text-xs text-[#666666]">
                {selectedRevision.contentFormat && (
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>Format: {selectedRevision.contentFormat.toUpperCase()}</span>
                  </div>
                )}
                {selectedRevision.model && (
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    <span>Model: {selectedRevision.model}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(selectedRevision.createdAt).toLocaleDateString('tr-TR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Content Display */}
          {selectedRevision && selectedRevision.content && (
            <div className="space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#202020] mb-2">
                      İçerik Düzenle
                    </label>
                    <textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="w-full h-[300px] sm:h-[500px] px-3 sm:px-4 py-2 sm:py-3 bg-white rounded-lg border border-[#e5e5e5] text-[#202020] text-sm focus:border-[#203eec] focus:outline-none font-mono"
                      placeholder="Blog içeriğinizi buraya yazın..."
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-white rounded-lg border border-[#e5e5e5] p-4 sm:p-6 lg:p-8 max-h-[600px] sm:max-h-[800px] overflow-y-auto">
                    <div
                      className="prose prose-lg max-w-none text-[#202020] leading-relaxed"
                      style={{
                        fontFamily: 'var(--font-sans), "Inter", sans-serif',
                      }}
                      dangerouslySetInnerHTML={{
                        __html: renderContentHtml(
                          selectedRevision.content,
                          (selectedRevision.contentFormat as string | undefined) || undefined,
                        ),
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-xl border border-[#e5e5e5] p-6"
        >
          <div className="text-center py-8">
            <FileText className="w-12 h-12 mx-auto mb-3 text-[#999999]" />
            <p className="text-sm text-[#666666]">Henüz versiyon bulunmuyor</p>
          </div>
        </motion.div>
      )}

      {/* Preview Modal */}
      {isPreviewOpen && post && selectedRevision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl border border-[#e5e5e5] w-full max-w-4xl h-[95vh] sm:h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#e5e5e5] flex-shrink-0">
              <div className="flex-1 min-w-0 pr-2">
                <h2 className="text-base sm:text-lg font-medium text-[#202020] mb-1 truncate">{post.title}</h2>
                <p className="text-xs text-[#666666]">
                  Versiyon: {selectedRevision.version || 1}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPreviewOpen(false)}
                className="text-[#666666] hover:bg-[#f5f5f5] flex-shrink-0"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white min-h-0">
              {(() => {
                if (!selectedRevision.content) {
                  return (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-[#999999]" />
                      <p className="text-[#666666]">İçerik bulunamadı</p>
                    </div>
                  );
                }

                const format = selectedRevision.contentFormat?.toLowerCase() || 'md';
                const content = selectedRevision.content;

                // Helper function to format markdown to HTML
                const formatMarkdownToHtml = (md: string): string => {
                  if (!md || typeof md !== 'string') return '';
                  
                  let html = md
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

                if (format === 'json') {
                  try {
                    const parsed = typeof content === 'string' ? JSON.parse(content) : content;
                    let htmlContent = '';

                    if (parsed.title) {
                      htmlContent += `<h1 class="text-4xl font-bold mb-6 text-[#202020]">${parsed.title}</h1>`;
                    }

                    let mainContent = '';

                    if (parsed.intro && typeof parsed.intro === 'string') {
                      mainContent += formatMarkdownToHtml(parsed.intro);
                    }

                    if (parsed.body && typeof parsed.body === 'string') {
                      mainContent += formatMarkdownToHtml(parsed.body);
                    }

                    if (parsed.content && typeof parsed.content === 'string') {
                      mainContent += formatMarkdownToHtml(parsed.content);
                    }

                    if (parsed.sections && Array.isArray(parsed.sections)) {
                      parsed.sections.forEach((section: any) => {
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

                    if (parsed.paragraphs && Array.isArray(parsed.paragraphs)) {
                      parsed.paragraphs.forEach((para: string) => {
                        if (para && typeof para === 'string') {
                          mainContent += formatMarkdownToHtml(para);
                        }
                      });
                    }

                    if (mainContent) {
                      htmlContent += `<div class="prose prose-lg max-w-none">${mainContent}</div>`;
                    }

                    if (htmlContent) {
                      return (
                        <div
                          className="prose prose-lg max-w-none"
                          dangerouslySetInnerHTML={{ __html: htmlContent }}
                          style={{
                            color: '#202020',
                          }}
                        />
                      );
                    }
                  } catch (e) {
                    // Ignore and fall back to markdown below
                  }

                  return (
                    <div
                      className="prose prose-lg max-w-none"
                      dangerouslySetInnerHTML={{ __html: formatMarkdownToHtml(content) }}
                      style={{
                        color: '#202020',
                      }}
                    />
                  );
                } else if (format === 'html') {
                  return (
                    <div 
                      className="prose prose-lg max-w-none"
                      dangerouslySetInnerHTML={{ __html: content }}
                      style={{
                        color: '#202020',
                      }}
                    />
                  );
                } else {
                  // Markdown or default - blog sayfasında görüntüleniyormuş gibi göster
                  return (
                    <div 
                      className="prose prose-lg max-w-none"
                      dangerouslySetInnerHTML={{ __html: formatMarkdownToHtml(content) }}
                      style={{
                        color: '#202020',
                      }}
                    />
                  );
                }
              })()}
            </div>
          </motion.div>
        </div>
      )}

      {/* Image Search Modal */}
      {showImageSearch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl border border-[#e5e5e5] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#e5e5e5] flex-shrink-0">
              <div>
                <h2 className="text-lg font-medium text-[#202020] mb-1">Kapak Resmi Seç</h2>
                <p className="text-xs text-[#666666]">Unsplash&apos;tan resim arayın</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowImageSearch(false);
                  setSelectedImage(null);
                  setUnsplashPhotos([]);
                  setImageSearchQuery('');
                }}
                className="text-[#666666] hover:bg-[#f5f5f5]"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Search */}
            <div className="p-4 sm:p-6 border-b border-[#e5e5e5] flex-shrink-0">
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
                  placeholder="Arama terimi (örn: technology, business)"
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
            </div>

            {/* Images Grid */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {unsplashPhotos.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[#666666]">
                      {unsplashPhotos.length} resim bulundu
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleImageSearch(currentPage)}
                      disabled={isSearchingImages}
                      className="text-xs"
                    >
                      <RefreshCw className={`w-3 h-3 mr-1 ${isSearchingImages ? 'animate-spin' : ''}`} />
                      Yenile
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
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
                    <p className="text-xs text-[#666666]">
                      Seçili: {selectedImage.user.name} tarafından
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ImageIcon className="w-12 h-12 mx-auto mb-3 text-[#999999]" />
                  <p className="text-sm text-[#666666]">Resim aramak için yukarıdaki arama kutusunu kullanın</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {selectedImage && (
              <div className="flex items-center justify-end gap-2 p-4 sm:p-6 border-t border-[#e5e5e5] flex-shrink-0">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowImageSearch(false);
                    setSelectedImage(null);
                    setUnsplashPhotos([]);
                    setImageSearchQuery('');
                  }}
                >
                  İptal
                </Button>
                <Button
                  onClick={handleUpdateImage}
                  disabled={updatingImage}
                  className="bg-[#203eec] hover:bg-[#1a32cc] text-white"
                >
                  {updatingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Güncelleniyor...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Resmi Güncelle
                    </>
                  )}
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
