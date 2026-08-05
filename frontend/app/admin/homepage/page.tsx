'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  HelpCircle,
  Loader2,
  AlertCircle,
  FileText,
  Search,
  CheckCircle2,
  XCircle,
  Calendar,
  User,
  ArrowUp,
  ArrowDown,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  Eye as EyeIcon,
  Link,
  ExternalLink,
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/sanitize';
import {
  getAdminFAQs,
  createAdminFAQ,
  updateAdminFAQ,
  deleteAdminFAQ,
  getAdminPosts,
  getHomepagePostsAdmin,
  setHomepagePosts as saveHomepagePostsToApi,
  updatePost,
  type FAQ,
  type Post,
} from '@/lib/api';

type FAQFormData = {
  question: string;
  answer: string;
  type: 'homepage' | 'page';
  order: number;
  active: boolean;
};

export default function AdminHomepagePage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [homepagePosts, setHomepagePosts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [faqsLoading, setFaqsLoading] = useState(false);
  const [postsLoading, setPostsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'all' | 'homepage' | 'page'>('homepage');
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [faqFormData, setFaqFormData] = useState<FAQFormData>({
    question: '',
    answer: '',
    type: 'homepage',
    order: 0,
    active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [savingPosts, setSavingPosts] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [postsPerPage] = useState(20);
  const [previewPost, setPreviewPost] = useState<Post | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [referenceUrls, setReferenceUrls] = useState<Record<string, string>>({});
  const [editingReferenceId, setEditingReferenceId] = useState<string | null>(null);
  const [savingReferenceId, setSavingReferenceId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  useEffect(() => {
    if (posts.length > 0) {
      setReferenceUrls((prev) => {
        const updated = { ...prev };
        posts.forEach((p) => {
          if (!(p.id in updated)) {
            updated[p.id] = (p as Post & { canonicalUrl?: string | null }).canonicalUrl ?? '';
          }
        });
        return updated;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts]);

  // Seçimlerin sayfa yenilenince hemen görünmesi: mount'ta ve loading bittiğinde yükle
  useEffect(() => {
    loadHomepagePosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!loading) {
      loadHomepagePosts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([loadFAQs(), loadPosts(), loadHomepagePosts()]);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Veriler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const loadFAQs = async () => {
    try {
      setFaqsLoading(true);
      const data = await getAdminFAQs();
      setFaqs(data);
    } catch (err) {
      console.error('Error loading FAQs:', err);
      throw err;
    } finally {
      setFaqsLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      setPostsLoading(true);
      // Tüm blogları pagination ile çek (status filter yok, hepsini göster)
      const result = await getAdminPosts({
        page: currentPage,
        limit: postsPerPage
      });

      // Check if result has pagination (new format) or is array (old format)
      if (result && typeof result === 'object' && 'data' in result && 'pagination' in result) {
        setPosts(result.data);
        setTotalPages(result.pagination.totalPages);
        setTotalPosts(result.pagination.total);
      } else if (Array.isArray(result)) {
        // Backward compatibility
        setPosts(result);
        setTotalPages(1);
        setTotalPosts(result.length);
      } else {
        setPosts([]);
        setTotalPages(1);
        setTotalPosts(0);
      }
    } catch (err) {
      console.error('Error loading posts:', err);
      setPosts([]);
      setTotalPages(1);
      setTotalPosts(0);
    } finally {
      setPostsLoading(false);
    }
  };

  const loadHomepagePosts = async () => {
    try {
      const saved = await getHomepagePostsAdmin();
      const ids = Array.isArray(saved) ? saved.map((id) => String(id)) : [];
      setHomepagePosts(ids);
    } catch (err) {
      console.error('Error loading homepage posts:', err);
    }
  };

  const handleSaveReferenceUrl = async (postId: string) => {
    const url = referenceUrls[postId] ?? '';
    setSavingReferenceId(postId);
    try {
      await updatePost(postId, { canonicalUrl: url || undefined } as Partial<Post>);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, canonicalUrl: url || undefined } : p))
      );
      setEditingReferenceId(null);
    } catch (err) {
      console.error('Error saving reference URL:', err);
      alert('Site linki kaydedilirken bir hata oluştu.');
    } finally {
      setSavingReferenceId(null);
    }
  };

  const saveHomepagePosts = async () => {
    try {
      setSavingPosts(true);
      setError(null);

      const postsToSave = [...homepagePosts];
      const saved = await saveHomepagePostsToApi(postsToSave);
      setHomepagePosts(saved);

      if (saved.length > 0) {
        alert(`Ana sayfa blogları başarıyla kaydedildi! (${saved.length} blog seçildi)`);
      } else {
        alert('Ana sayfa blogları başarıyla kaydedildi!');
      }
    } catch (err) {
      console.error('Error saving homepage posts:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ana sayfa blogları kaydedilirken bir hata oluştu';
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setSavingPosts(false);
    }
  };

  const filteredFAQs = selectedType === 'all'
    ? faqs
    : faqs.filter(faq => faq.type === selectedType);

  const filteredPosts = posts.filter((post) =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTogglePost = (postId: string) => {
    const id = String(postId);
    setHomepagePosts((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };


  const handleMovePost = (postId: string, direction: 'up' | 'down') => {
    setHomepagePosts((prev) => {
      const index = prev.indexOf(postId);
      if (index === -1) return prev;

      const newPosts = [...prev];
      if (direction === 'up' && index > 0) {
        [newPosts[index - 1], newPosts[index]] = [newPosts[index], newPosts[index - 1]];
      } else if (direction === 'down' && index < newPosts.length - 1) {
        [newPosts[index], newPosts[index + 1]] = [newPosts[index + 1], newPosts[index]];
      }
      return newPosts;
    });
  };

  const handleOpenFaqModal = (faq?: FAQ) => {
    if (faq) {
      setEditingFaq(faq);
      setFaqFormData({
        question: faq.question,
        answer: faq.answer,
        type: faq.type,
        order: faq.order,
        active: faq.active,
      });
    } else {
      setEditingFaq(null);
      setFaqFormData({
        question: '',
        answer: '',
        type: 'homepage',
        order: filteredFAQs.length + 1,
        active: true,
      });
    }
    setIsFaqModalOpen(true);
  };

  const handleCloseFaqModal = () => {
    setIsFaqModalOpen(false);
    setEditingFaq(null);
    setFaqFormData({
      question: '',
      answer: '',
      type: 'homepage',
      order: 0,
      active: true,
    });
  };

  const handleSubmitFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (editingFaq) {
        await updateAdminFAQ(editingFaq.id, faqFormData);
      } else {
        await createAdminFAQ(faqFormData);
      }
      await loadFAQs();
      handleCloseFaqModal();
    } catch (err) {
      console.error('Error saving FAQ:', err);
      setError(err instanceof Error ? err.message : 'SSS kaydedilirken bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm('Bu SSS\'yi silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      await deleteAdminFAQ(id);
      await loadFAQs();
    } catch (err) {
      console.error('Error deleting FAQ:', err);
      setError(err instanceof Error ? err.message : 'SSS silinirken bir hata oluştu');
    }
  };

  const handleToggleFaqActive = async (faq: FAQ) => {
    try {
      await updateAdminFAQ(faq.id, { active: !faq.active });
      await loadFAQs();
    } catch (err) {
      console.error('Error updating FAQ:', err);
      setError(err instanceof Error ? err.message : 'SSS güncellenirken bir hata oluştu');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Anasayfa Yönetimi"
        description="Ana sayfada görünecek blogları seçin ve SSS yönetimi yapın"
      />

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-border bg-[var(--destructive-muted)] p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-medium text-destructive">Hata</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      )}

      {/* Homepage Posts Section */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Ana Sayfada Görünecek Bloglar
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sadece seçtiğiniz bloglar ana sayfada görünür. Hiç seçmezseniz ana sayfada blog bölümü boş olur. (Maks. 10 blog)
            </p>
          </div>
          <Button onClick={saveHomepagePosts} disabled={savingPosts} className="shrink-0">
            {savingPosts ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Kaydet
              </>
            )}
          </Button>
        </div>

        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Blog ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {postsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <EmptyState icon={<FileText />} title="Blog bulunamadı" />
        ) : (
          <div className="grid max-h-[600px] grid-cols-1 gap-4 overflow-y-auto md:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => {
              const postIdStr = String(post.id);
              const isSelected = homepagePosts.includes(postIdStr);
              const selectedIndex = isSelected ? homepagePosts.indexOf(postIdStr) + 1 : null;

              return (
                <div
                  key={post.id}
                  className={cn(
                    'relative rounded-xl border p-4 transition-colors',
                    isSelected ? 'border-primary bg-accent' : 'border-border bg-card',
                  )}
                >
                  {isSelected && (
                    <div className="absolute right-2 top-2 flex items-center gap-1">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {selectedIndex}
                      </span>
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    {post.coverImageUrl && (
                      <Image
                        src={post.coverImageUrl}
                        alt={post.title}
                        width={64}
                        height={64}
                        className="h-16 w-16 shrink-0 rounded-lg object-cover"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-2 text-sm font-semibold text-foreground">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {post.excerpt}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant={post.status === 'published' ? 'primary' : 'success'}>
                          {post.status === 'published' ? 'Yayınlandı' : 'Hazır'}
                        </Badge>
                        {post.author && (
                          <span className="flex min-w-0 items-center gap-1">
                            <User className="h-3 w-3 shrink-0" />
                            <span className="truncate">{post.author.name || post.author.email}</span>
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 shrink-0" />
                          {new Date(post.createdAt).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewPost(post);
                            setIsPreviewOpen(true);
                          }}
                          className="text-xs"
                        >
                          <EyeIcon className="h-3 w-3" />
                          Önizleme
                        </Button>
                        {isSelected ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePost(post.id);
                            }}
                            className="text-xs text-destructive"
                          >
                            <XCircle className="h-3 w-3" />
                            Ana Sayfadan Kaldır
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (homepagePosts.length >= 10) {
                                alert('Maksimum 10 blog seçebilirsiniz. Lütfen önce bir blog kaldırın.');
                                return;
                              }
                              handleTogglePost(post.id);
                            }}
                            className="text-xs text-success"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Ana Sayfaya Ekle
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!postsLoading && totalPages > 1 && (
          <div className="mt-6 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center">
            <p className="text-sm text-muted-foreground">
              Toplam {totalPosts} blog - Sayfa {currentPage} / {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || postsLoading}
              >
                <ChevronLeft className="h-4 w-4" />
                Önceki
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || postsLoading}
              >
                Sonraki
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {homepagePosts.length > 0 && (
          <div className="mt-6 border-t border-border pt-6">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-foreground">
                Seçili Bloglar ({homepagePosts.length} / 10)
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Blog sırasını değiştirmek için yukarı/aşağı butonlarını kullanın
              </p>
            </div>
            <div className="space-y-2">
              {homepagePosts.map((postId, index) => {
                const post = posts.find((p) => p.id === postId);
                if (!post) return null;

                return (
                  <div
                    key={postId}
                    className="flex flex-col gap-2 rounded-lg border border-border bg-secondary p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <GripVertical className="h-4 w-4" />
                        <span className="w-6 text-center">{index + 1}</span>
                      </div>
                      {post.coverImageUrl && (
                        <Image
                          src={post.coverImageUrl}
                          alt={post.title}
                          width={40}
                          height={40}
                          className="h-10 w-10 shrink-0 rounded object-cover"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-medium text-foreground">
                          {post.title}
                        </h4>
                        <p className="truncate text-xs text-muted-foreground">
                          {post.status === 'published' ? 'Yayınlandı' : 'Hazır'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMovePost(postId, 'up');
                          }}
                          disabled={index === 0}
                          className="h-8 w-8"
                          title="Yukarı taşı"
                          aria-label="Yukarı taşı"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMovePost(postId, 'down');
                          }}
                          disabled={index === homepagePosts.length - 1}
                          className="h-8 w-8"
                          title="Aşağı taşı"
                          aria-label="Aşağı taşı"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingReferenceId(editingReferenceId === postId ? null : postId);
                            if (editingReferenceId !== postId) {
                              setReferenceUrls((prev) => ({
                                ...prev,
                                [postId]: (post as Post & { canonicalUrl?: string | null }).canonicalUrl ?? prev[postId] ?? '',
                              }));
                            }
                          }}
                          className={cn(
                            'h-8 w-8',
                            editingReferenceId === postId && 'text-accent-foreground',
                          )}
                          title="Site linki düzenle"
                          aria-label="Site linki düzenle"
                        >
                          <Link className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePost(postId);
                          }}
                          className="h-8 w-8 text-destructive"
                          title="Kaldır"
                          aria-label="Kaldır"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Reference URL editor */}
                    {editingReferenceId === postId && (
                      <div className="flex items-center gap-2 pl-12">
                        <div className="relative flex-1">
                          <ExternalLink className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            type="url"
                            placeholder="https://siteadresi.com/blog/makale-adi"
                            value={referenceUrls[postId] ?? ''}
                            onChange={(e) =>
                              setReferenceUrls((prev) => ({ ...prev, [postId]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveReferenceUrl(postId);
                              if (e.key === 'Escape') setEditingReferenceId(null);
                            }}
                            autoFocus
                            className="h-9 bg-card pl-9 text-sm"
                          />
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleSaveReferenceUrl(postId)}
                          disabled={savingReferenceId === postId}
                          aria-label="Site linkini kaydet"
                        >
                          {savingReferenceId === postId ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Save className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingReferenceId(null)}
                          className="h-9 w-9"
                          aria-label="Düzenlemeyi iptal et"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}

                    {/* Show saved URL */}
                    {editingReferenceId !== postId && (post as Post & { canonicalUrl?: string | null }).canonicalUrl && (
                      <div className="flex items-center gap-1.5 pl-12">
                        <ExternalLink className="h-3 w-3 shrink-0 text-accent-foreground" />
                        <a
                          href={(post as Post & { canonicalUrl?: string | null }).canonicalUrl!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate text-xs text-accent-foreground hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {(post as Post & { canonicalUrl?: string | null }).canonicalUrl}
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* FAQs Section */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">SSS Yönetimi</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ana sayfa ve SSS sayfası için sık sorulan soruları yönetin
            </p>
          </div>
          <Button onClick={() => handleOpenFaqModal()} className="shrink-0">
            <Plus className="h-4 w-4" />
            Yeni SSS
          </Button>
        </div>

        {/* FAQ Filters */}
        <div className="mb-4 flex flex-wrap gap-2">
          <Button
            variant={selectedType === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType('all')}
          >
            Tümü ({faqs.length})
          </Button>
          <Button
            variant={selectedType === 'homepage' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType('homepage')}
          >
            Ana Sayfa ({faqs.filter(f => f.type === 'homepage').length})
          </Button>
          <Button
            variant={selectedType === 'page' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType('page')}
          >
            SSS Sayfası ({faqs.filter(f => f.type === 'page').length})
          </Button>
        </div>

        {/* FAQ List */}
        {faqsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredFAQs.length === 0 ? (
          <EmptyState
            icon={<HelpCircle />}
            title="Henüz SSS eklenmemiş"
            action={
              <Button onClick={() => handleOpenFaqModal()}>
                <Plus className="h-4 w-4" />
                İlk SSS&apos;yi ekleyin
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Soru</TableHead>
                <TableHead className="w-36">Tip</TableHead>
                <TableHead className="w-20">Sıra</TableHead>
                <TableHead className="w-28">Durum</TableHead>
                <TableHead className="w-40 text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFAQs
                .sort((a, b) => a.order - b.order)
                .map((faq) => (
                  <TableRow key={faq.id}>
                    <TableCell className="max-w-[420px]">
                      <p className="font-medium text-foreground">{faq.question}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{faq.answer}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">
                        {faq.type === 'homepage' ? 'Ana Sayfa' : 'SSS Sayfası'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{faq.order}</TableCell>
                    <TableCell>
                      <Badge variant={faq.active ? 'success' : 'destructive'}>
                        {faq.active ? 'Aktif' : 'Pasif'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleFaqActive(faq)}
                          className={faq.active ? 'h-9 w-9 text-success' : 'h-9 w-9 text-destructive'}
                          title={faq.active ? 'Pasif Yap' : 'Aktif Yap'}
                          aria-label={faq.active ? 'Pasif Yap' : 'Aktif Yap'}
                        >
                          {faq.active ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenFaqModal(faq)}
                          className="h-9 w-9"
                          title="Düzenle"
                          aria-label="Düzenle"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteFaq(faq.id)}
                          className="h-9 w-9 text-destructive"
                          title="Sil"
                          aria-label="Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* FAQ Modal */}
      {isFaqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card shadow-elevated">
            <div className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  {editingFaq ? 'SSS Düzenle' : 'Yeni SSS'}
                </h2>
                <Button variant="ghost" size="icon" onClick={handleCloseFaqModal} aria-label="Kapat">
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <form onSubmit={handleSubmitFaq} className="space-y-4">
                <div>
                  <label htmlFor="homepage-faq-question" className="mb-2 block text-sm font-medium text-foreground">
                    Soru *
                  </label>
                  <Input
                    id="homepage-faq-question"
                    type="text"
                    value={faqFormData.question}
                    onChange={(e) => setFaqFormData({ ...faqFormData, question: e.target.value })}
                    required
                    placeholder="Soru metnini girin"
                  />
                </div>

                <div>
                  <label htmlFor="homepage-faq-answer" className="mb-2 block text-sm font-medium text-foreground">
                    Cevap *
                  </label>
                  <Textarea
                    id="homepage-faq-answer"
                    value={faqFormData.answer}
                    onChange={(e) => setFaqFormData({ ...faqFormData, answer: e.target.value })}
                    required
                    rows={6}
                    placeholder="Cevap metnini girin"
                    className="resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="homepage-faq-type" className="mb-2 block text-sm font-medium text-foreground">
                      Tip *
                    </label>
                    <select
                      id="homepage-faq-type"
                      value={faqFormData.type}
                      onChange={(e) =>
                        setFaqFormData({ ...faqFormData, type: e.target.value as 'homepage' | 'page' })
                      }
                      required
                      className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="homepage">Ana Sayfa</option>
                      <option value="page">SSS Sayfası</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="homepage-faq-order" className="mb-2 block text-sm font-medium text-foreground">
                      Sıra *
                    </label>
                    <Input
                      id="homepage-faq-order"
                      type="number"
                      value={faqFormData.order}
                      onChange={(e) =>
                        setFaqFormData({ ...faqFormData, order: parseInt(e.target.value) || 0 })
                      }
                      required
                      min="0"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={faqFormData.active}
                    onChange={(e) => setFaqFormData({ ...faqFormData, active: e.target.checked })}
                    className="h-4 w-4 rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <label htmlFor="active" className="cursor-pointer text-sm text-foreground">
                    Aktif
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
                  <Button type="button" variant="outline" onClick={handleCloseFaqModal}>
                    İptal
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Kaydediliyor...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        {editingFaq ? 'Güncelle' : 'Oluştur'}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {isPreviewOpen && previewPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
          <div className="flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-elevated">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border p-6">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold tracking-tight text-foreground">
                  {previewPost.title}
                </h2>
                {(() => {
                  const latestRevision = previewPost.revisions && previewPost.revisions.length > 0
                    ? previewPost.revisions[previewPost.revisions.length - 1]
                    : null;
                  return (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Format: {latestRevision?.contentFormat || 'md'} |
                      Versiyon: {latestRevision?.version || 1}
                    </p>
                  );
                })()}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsPreviewOpen(false);
                  setPreviewPost(null);
                }}
                aria-label="Önizlemeyi kapat"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              {(() => {
                const latestRevision = previewPost.revisions && previewPost.revisions.length > 0
                  ? previewPost.revisions[previewPost.revisions.length - 1]
                  : null;

                if (!latestRevision || !latestRevision.content) {
                  return <EmptyState icon={<FileText />} title="İçerik bulunamadı" />;
                }

                const format = latestRevision.contentFormat?.toLowerCase() || 'md';
                const content = latestRevision.content;

                // Helper function to format markdown to HTML
                const formatMarkdown = (md: string): string => {
                  if (!md || typeof md !== 'string') return '';

                  let html = md
                    .replace(/^### (.*$)/gim, '<h3 class="mt-6 mb-3 text-xl font-semibold text-foreground">$1</h3>')
                    .replace(/^## (.*$)/gim, '<h2 class="mt-8 mb-4 text-2xl font-semibold text-foreground">$1</h2>')
                    .replace(/^# (.*$)/gim, '<h1 class="mt-8 mb-4 text-3xl font-semibold text-foreground">$1</h1>')
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
                    return `<p class="mb-4 leading-relaxed text-muted-foreground">${trimmed.replace(/\n/g, '<br />')}</p>`;
                  }).join('');

                  return html;
                };

                if (format === 'json') {
                  try {
                    const parsed = typeof content === 'string' ? JSON.parse(content) : content;
                    // JSON içeriğini blog formatında göster
                    let htmlContent = '';

                    // Başlık
                    if (parsed.title) {
                      htmlContent += `<h1 class="mb-6 text-3xl font-semibold text-foreground">${parsed.title}</h1>`;
                    }

                    // İçerik alanlarını sırayla kontrol et
                    let mainContent = '';

                    // 1. intro varsa
                    if (parsed.intro && typeof parsed.intro === 'string') {
                      mainContent += formatMarkdown(parsed.intro);
                    }

                    // 2. body varsa
                    if (parsed.body && typeof parsed.body === 'string') {
                      mainContent += formatMarkdown(parsed.body);
                    }

                    // 3. content varsa
                    if (parsed.content && typeof parsed.content === 'string') {
                      mainContent += formatMarkdown(parsed.content);
                    }

                    // 4. sections varsa
                    if (parsed.sections && Array.isArray(parsed.sections)) {
                      parsed.sections.forEach((section: any) => {
                        if (section.title) {
                          mainContent += `<h2 class="mt-8 mb-4 text-2xl font-semibold text-foreground">${section.title}</h2>`;
                        }
                        if (section.content && typeof section.content === 'string') {
                          mainContent += formatMarkdown(section.content);
                        } else if (section.body && typeof section.body === 'string') {
                          mainContent += formatMarkdown(section.body);
                        }
                        if (section.paragraphs && Array.isArray(section.paragraphs)) {
                          section.paragraphs.forEach((para: string) => {
                            if (para && typeof para === 'string') {
                              mainContent += formatMarkdown(para);
                            }
                          });
                        }
                      });
                    }

                    // 5. paragraphs varsa
                    if (parsed.paragraphs && Array.isArray(parsed.paragraphs)) {
                      parsed.paragraphs.forEach((para: string) => {
                        if (para && typeof para === 'string') {
                          mainContent += formatMarkdown(para);
                        }
                      });
                    }

                    if (mainContent) {
                      htmlContent += `<div class="max-w-none">${mainContent}</div>`;
                    } else {
                      // Hiçbir içerik bulunamadıysa JSON'u formatlanmış olarak göster
                      htmlContent += `<pre class="overflow-x-auto rounded-lg border border-border bg-secondary p-4 text-sm text-foreground"><code>${JSON.stringify(parsed, null, 2)}</code></pre>`;
                    }

                    return (
                      <div
                        className="max-w-none text-sm leading-relaxed text-foreground"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(htmlContent) }}
                      />
                    );
                  } catch (e) {
                    // Parse hatası durumunda raw content'i markdown olarak göster
                    return (
                      <div
                        className="max-w-none text-sm leading-relaxed text-foreground"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(formatMarkdown(content)) }}
                      />
                    );
                  }
                } else if (format === 'html') {
                  return (
                    <div
                      className="max-w-none text-sm leading-relaxed text-foreground"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
                    />
                  );
                } else {
                  // Markdown or default - blog sayfasında görüntüleniyormuş gibi göster
                  return (
                    <div
                      className="max-w-none text-sm leading-relaxed text-foreground"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(formatMarkdown(content)) }}
                    />
                  );
                }
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
