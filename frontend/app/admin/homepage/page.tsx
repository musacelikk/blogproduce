'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  Eye,
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
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import {
  getAdminFAQs,
  getAdminFAQById,
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
        prev.map((p) => (p.id === postId ? { ...p, canonicalUrl: url || null } : p))
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 mx-auto mb-3 text-[#3B82F6] animate-spin" />
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
          Anasayfa Yönetimi
        </h1>
        <p
          className="text-xs text-[#ebebeb]"
          style={{
            fontFamily: 'var(--font-sans), "Inter", sans-serif',
          }}
        >
          Ana sayfada görünecek blogları seçin ve SSS yönetimi yapın
        </p>
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

      {/* Homepage Posts Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-[#1a1a1a] rounded-xl border border-[#333333] p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2
              className="text-base font-medium text-white mb-1"
              style={{
                fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
              }}
            >
              Ana Sayfada Görünecek Bloglar
            </h2>
            <p className="text-xs text-[#ebebeb]">
              Sadece seçtiğiniz bloglar ana sayfada görünür. Hiç seçmezseniz ana sayfada blog bölümü boş olur. (Maks. 10 blog)
            </p>
          </div>
          <Button
            onClick={saveHomepagePosts}
            disabled={savingPosts}
            className="bg-[#3B82F6] hover:bg-[#2563EB] text-white text-sm"
          >
            {savingPosts ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Kaydet
              </>
            )}
          </Button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ebebeb]" />
            <input
              type="text"
              placeholder="Blog ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#0f0f0f] rounded-lg border border-[#333333] text-white text-sm placeholder:text-[#ebebeb] focus:border-[#3B82F6] focus:outline-none"
            />
          </div>
        </div>

        {postsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#3B82F6] animate-spin" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto mb-4 text-[#ebebeb] opacity-50" />
            <p className="text-[#ebebeb]">Blog bulunamadı</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
            {filteredPosts.map((post) => {
              const postIdStr = String(post.id);
              const isSelected = homepagePosts.includes(postIdStr);
              const selectedIndex = isSelected ? homepagePosts.indexOf(postIdStr) + 1 : null;
              const latestRevision = post.revisions && post.revisions.length > 0 
                ? post.revisions[post.revisions.length - 1] 
                : null;
              
              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`relative border-2 rounded-lg p-4 transition-all ${
                    isSelected
                      ? 'border-[#3B82F6] bg-[#3B82F6]/20 ring-2 ring-[#3B82F6]/50'
                      : 'border-[#333333] bg-[#0f0f0f]'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      <div className="w-6 h-6 bg-[#3B82F6] rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {selectedIndex}
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-[#3B82F6]" />
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    {post.coverImageUrl && (
                      <Image
                        src={post.coverImageUrl}
                        alt={post.title}
                        width={64}
                        height={64}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-white mb-1 line-clamp-2">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-xs text-[#ebebeb] line-clamp-2 mb-2">
                          {post.excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-[#ebebeb]">
                        <span className={`px-2 py-0.5 rounded ${
                          post.status === 'published' 
                            ? 'bg-purple-500/20 text-purple-400' 
                            : 'bg-green-500/20 text-green-400'
                        }`}>
                          {post.status === 'published' ? 'Yayınlandı' : 'Hazır'}
                        </span>
                        {post.author && (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span className="truncate">{post.author.name || post.author.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(post.createdAt).toLocaleDateString('tr-TR')}</span>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewPost(post);
                            setIsPreviewOpen(true);
                          }}
                          className="text-xs border-[#333333] text-[#ebebeb] hover:bg-[#0f0f0f]"
                        >
                          <EyeIcon className="w-3 h-3 mr-1" />
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
                            className="text-xs border-orange-500/50 text-orange-400 hover:bg-orange-500/10"
                          >
                            <XCircle className="w-3 h-3 mr-1" />
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
                            className="text-xs border-green-500/50 text-green-400 hover:bg-green-500/10"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Ana Sayfaya Ekle
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!postsLoading && totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-[#333333]">
            <div className="text-xs text-[#ebebeb]">
              Toplam {totalPosts} blog - Sayfa {currentPage} / {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || postsLoading}
                className="border-[#333333] text-[#ebebeb] hover:bg-[#0f0f0f] disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
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
                      className={
                        currentPage === pageNum
                          ? 'bg-[#3B82F6] text-white'
                          : 'border-[#333333] text-[#ebebeb] hover:bg-[#0f0f0f]'
                      }
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
                className="border-[#333333] text-[#ebebeb] hover:bg-[#0f0f0f] disabled:opacity-50"
              >
                Sonraki
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {homepagePosts.length > 0 && (
          <div className="mt-6 pt-6 border-t border-[#333333]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-white mb-1">
                  Seçili Bloglar ({homepagePosts.length} / 10)
                </h3>
                <p className="text-xs text-[#ebebeb]">
                  Blog sırasını değiştirmek için yukarı/aşağı butonlarını kullanın
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {homepagePosts.map((postId, index) => {
                const post = posts.find((p) => p.id === postId);
                if (!post) return null;
                
                return (
                  <motion.div
                    key={postId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-2 p-3 bg-[#0f0f0f] border border-[#333333] rounded-lg hover:border-[#3B82F6]/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-[#ebebeb] text-xs font-medium">
                        <GripVertical className="w-4 h-4" />
                        <span className="w-6 text-center">{index + 1}</span>
                      </div>
                      {post.coverImageUrl && (
                        <Image
                          src={post.coverImageUrl}
                          alt={post.title}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-white truncate">
                          {post.title}
                        </h4>
                        <p className="text-xs text-[#ebebeb] truncate">
                          {post.status === 'published' ? 'Yayınlandı' : 'Hazır'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMovePost(postId, 'up');
                          }}
                          disabled={index === 0}
                          className="h-7 w-7 p-0 text-[#ebebeb] hover:text-white disabled:opacity-30"
                          title="Yukarı taşı"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMovePost(postId, 'down');
                          }}
                          disabled={index === homepagePosts.length - 1}
                          className="h-7 w-7 p-0 text-[#ebebeb] hover:text-white disabled:opacity-30"
                          title="Aşağı taşı"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
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
                          className={`h-7 w-7 p-0 hover:text-blue-300 hover:bg-blue-500/10 ${editingReferenceId === postId ? 'text-blue-400' : 'text-[#ebebeb]'}`}
                          title="Site linki düzenle"
                        >
                          <Link className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePost(postId);
                          }}
                          className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          title="Kaldır"
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Reference URL editor */}
                    {editingReferenceId === postId && (
                      <div className="flex items-center gap-2 pl-12">
                        <div className="relative flex-1">
                          <ExternalLink className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#ebebeb]" />
                          <input
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
                            className="w-full pl-8 pr-3 py-1.5 bg-[#1a1a1a] rounded border border-[#444444] text-white text-xs placeholder:text-[#666666] focus:border-[#3B82F6] focus:outline-none"
                          />
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleSaveReferenceUrl(postId)}
                          disabled={savingReferenceId === postId}
                          className="h-7 px-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs"
                        >
                          {savingReferenceId === postId ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Save className="w-3 h-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingReferenceId(null)}
                          className="h-7 w-7 p-0 text-[#ebebeb] hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}

                    {/* Show saved URL */}
                    {editingReferenceId !== postId && (post as Post & { canonicalUrl?: string | null }).canonicalUrl && (
                      <div className="flex items-center gap-1.5 pl-12">
                        <ExternalLink className="w-3 h-3 text-[#3B82F6] flex-shrink-0" />
                        <a
                          href={(post as Post & { canonicalUrl?: string | null }).canonicalUrl!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#3B82F6] hover:text-blue-300 truncate"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {(post as Post & { canonicalUrl?: string | null }).canonicalUrl}
                        </a>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>

      {/* FAQs Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-[#1a1a1a] rounded-xl border border-[#333333] p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2
              className="text-base font-medium text-white mb-1"
              style={{
                fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
              }}
            >
              SSS Yönetimi
            </h2>
            <p className="text-xs text-[#ebebeb]">
              Ana sayfa ve SSS sayfası için sık sorulan soruları yönetin
            </p>
          </div>
          <Button
            onClick={() => handleOpenFaqModal()}
            className="bg-[#3B82F6] hover:bg-[#2563EB] text-white text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni SSS
          </Button>
        </div>

        {/* FAQ Filters */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedType === 'all'
                ? 'bg-[#3B82F6] text-white'
                : 'bg-[#0f0f0f] text-[#ebebeb] hover:text-white border border-[#333333]'
            }`}
          >
            Tümü ({faqs.length})
          </button>
          <button
            onClick={() => setSelectedType('homepage')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedType === 'homepage'
                ? 'bg-[#3B82F6] text-white'
                : 'bg-[#0f0f0f] text-[#ebebeb] hover:text-white border border-[#333333]'
            }`}
          >
            Ana Sayfa ({faqs.filter(f => f.type === 'homepage').length})
          </button>
          <button
            onClick={() => setSelectedType('page')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedType === 'page'
                ? 'bg-[#3B82F6] text-white'
                : 'bg-[#0f0f0f] text-[#ebebeb] hover:text-white border border-[#333333]'
            }`}
          >
            SSS Sayfası ({faqs.filter(f => f.type === 'page').length})
          </button>
        </div>

        {/* FAQ List */}
        {faqsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#3B82F6] animate-spin" />
          </div>
        ) : filteredFAQs.length === 0 ? (
          <div className="text-center py-12">
            <HelpCircle className="w-12 h-12 mx-auto mb-4 text-[#ebebeb] opacity-50" />
            <p className="text-[#ebebeb] mb-2">Henüz SSS eklenmemiş</p>
            <button
              onClick={() => handleOpenFaqModal()}
              className="text-[#3B82F6] hover:text-[#2563EB] text-sm font-medium"
            >
              İlk SSS&apos;yi ekleyin
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFAQs
              .sort((a, b) => a.order - b.order)
              .map((faq) => (
                <motion.div
                  key={faq.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#0f0f0f] border border-[#333333] rounded-lg p-4 hover:border-[#444444] transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-[#3B82F6]/20 text-[#3B82F6] text-xs font-medium rounded">
                          {faq.type === 'homepage' ? 'Ana Sayfa' : 'SSS Sayfası'}
                        </span>
                        <span className="px-2 py-1 bg-[#333333] text-[#ebebeb] text-xs rounded">
                          Sıra: {faq.order}
                        </span>
                        {faq.active ? (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                            Aktif
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">
                            Pasif
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-medium text-white mb-2">{faq.question}</h3>
                      <p className="text-sm text-[#ebebeb] line-clamp-2">{faq.answer}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleToggleFaqActive(faq)}
                        className={`p-2 rounded-lg transition-colors ${
                          faq.active
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        }`}
                        title={faq.active ? 'Pasif Yap' : 'Aktif Yap'}
                      >
                        {faq.active ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleOpenFaqModal(faq)}
                        className="p-2 rounded-lg bg-[#333333] hover:bg-[#3B82F6] text-[#ebebeb] hover:text-white transition-colors"
                        title="Düzenle"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteFaq(faq.id)}
                        className="p-2 rounded-lg bg-[#333333] hover:bg-red-500/20 text-[#ebebeb] hover:text-red-400 transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>
        )}
      </motion.div>

      {/* FAQ Modal */}
      {isFaqModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1a1a1a] border border-[#333333] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-medium text-white">
                  {editingFaq ? 'SSS Düzenle' : 'Yeni SSS'}
                </h2>
                <button
                  onClick={handleCloseFaqModal}
                  className="p-2 rounded-lg hover:bg-[#333333] text-[#ebebeb] hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitFaq} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Soru *
                  </label>
                  <input
                    type="text"
                    value={faqFormData.question}
                    onChange={(e) => setFaqFormData({ ...faqFormData, question: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-[#0f0f0f] border border-[#333333] rounded-lg text-white placeholder:text-[#ebebeb] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                    placeholder="Soru metnini girin"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Cevap *
                  </label>
                  <textarea
                    value={faqFormData.answer}
                    onChange={(e) => setFaqFormData({ ...faqFormData, answer: e.target.value })}
                    required
                    rows={6}
                    className="w-full px-4 py-2 bg-[#0f0f0f] border border-[#333333] rounded-lg text-white placeholder:text-[#ebebeb] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent resize-none"
                    placeholder="Cevap metnini girin"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Tip *
                    </label>
                    <select
                      value={faqFormData.type}
                      onChange={(e) =>
                        setFaqFormData({ ...faqFormData, type: e.target.value as 'homepage' | 'page' })
                      }
                      required
                      className="w-full px-4 py-2 bg-[#0f0f0f] border border-[#333333] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                    >
                      <option value="homepage">Ana Sayfa</option>
                      <option value="page">SSS Sayfası</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Sıra *
                    </label>
                    <input
                      type="number"
                      value={faqFormData.order}
                      onChange={(e) =>
                        setFaqFormData({ ...faqFormData, order: parseInt(e.target.value) || 0 })
                      }
                      required
                      min="0"
                      className="w-full px-4 py-2 bg-[#0f0f0f] border border-[#333333] rounded-lg text-white placeholder:text-[#ebebeb] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={faqFormData.active}
                    onChange={(e) => setFaqFormData({ ...faqFormData, active: e.target.checked })}
                    className="w-4 h-4 rounded border-[#333333] text-[#3B82F6] focus:ring-[#3B82F6] bg-[#0f0f0f]"
                  />
                  <label htmlFor="active" className="text-sm text-white cursor-pointer">
                    Aktif
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#333333]">
                  <button
                    type="button"
                    onClick={handleCloseFaqModal}
                    className="px-4 py-2 bg-[#333333] hover:bg-[#444444] text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Kaydediliyor...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {editingFaq ? 'Güncelle' : 'Oluştur'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Preview Modal */}
      {isPreviewOpen && previewPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1a1a1a] rounded-xl border border-[#333333] w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#333333] flex-shrink-0">
              <div>
                <h2 className="text-lg font-medium text-white mb-1">{previewPost.title}</h2>
                {(() => {
                  const latestRevision = previewPost.revisions && previewPost.revisions.length > 0 
                    ? previewPost.revisions[previewPost.revisions.length - 1] 
                    : null;
                  return (
                    <p className="text-xs text-[#ebebeb]">
                      Format: {latestRevision?.contentFormat || 'md'} | 
                      Versiyon: {latestRevision?.version || 1}
                    </p>
                  );
                })()}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsPreviewOpen(false);
                  setPreviewPost(null);
                }}
                className="text-[#ebebeb] hover:bg-[#0f0f0f]"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 min-h-0">
              {(() => {
                const latestRevision = previewPost.revisions && previewPost.revisions.length > 0 
                  ? previewPost.revisions[previewPost.revisions.length - 1] 
                  : null;
                
                if (!latestRevision || !latestRevision.content) {
                  return (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-[#ebebeb] opacity-50" />
                      <p className="text-[#ebebeb]">İçerik bulunamadı</p>
                    </div>
                  );
                }

                const format = latestRevision.contentFormat?.toLowerCase() || 'md';
                const content = latestRevision.content;

                // Helper function to format markdown to HTML
                const formatMarkdown = (md: string): string => {
                  if (!md || typeof md !== 'string') return '';
                  
                  let html = md
                    .replace(/^### (.*$)/gim, '<h3 class="text-2xl font-semibold mt-6 mb-3 text-white">$1</h3>')
                    .replace(/^## (.*$)/gim, '<h2 class="text-3xl font-semibold mt-8 mb-4 text-white">$1</h2>')
                    .replace(/^# (.*$)/gim, '<h1 class="text-4xl font-bold mt-8 mb-4 text-white">$1</h1>')
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
                    return `<p class="mb-4 text-[#ebebeb] leading-relaxed">${trimmed.replace(/\n/g, '<br />')}</p>`;
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
                      htmlContent += `<h1 class="text-4xl font-bold mb-6 text-white">${parsed.title}</h1>`;
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
                          mainContent += `<h2 class="text-3xl font-semibold mt-8 mb-4 text-white">${section.title}</h2>`;
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
                      htmlContent += `<div class="prose prose-invert max-w-none">${mainContent}</div>`;
                    } else {
                      // Hiçbir içerik bulunamadıysa JSON'u formatlanmış olarak göster
                      htmlContent += `<pre class="bg-[#0f0f0f] rounded-lg p-4 overflow-x-auto text-sm text-[#ebebeb] border border-[#333333]"><code>${JSON.stringify(parsed, null, 2)}</code></pre>`;
                    }
                    
                    return (
                      <div 
                        className="prose prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: htmlContent }}
                        style={{
                          color: '#ebebeb',
                        }}
                      />
                    );
                  } catch (e) {
                    // Parse hatası durumunda raw content'i markdown olarak göster
                    return (
                      <div 
                        className="prose prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }}
                        style={{
                          color: '#ebebeb',
                        }}
                      />
                    );
                  }
                } else if (format === 'html') {
                  return (
                    <div 
                      className="prose prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: content }}
                      style={{
                        color: '#ebebeb',
                      }}
                    />
                  );
                } else {
                  // Markdown or default - blog sayfasında görüntüleniyormuş gibi göster
                  return (
                    <div 
                      className="prose prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }}
                      style={{
                        color: '#ebebeb',
                      }}
                    />
                  );
                }
              })()}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

