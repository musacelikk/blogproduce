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
  CheckCircle2,
  XCircle,
} from 'lucide-react';
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
import {
  getAdminFAQs,
  createAdminFAQ,
  updateAdminFAQ,
  deleteAdminFAQ,
  type FAQ,
} from '@/lib/api';

type FAQFormData = {
  question: string;
  answer: string;
  type: 'homepage' | 'page';
  order: number;
  active: boolean;
};

export default function AdminFAQsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'all' | 'homepage' | 'page'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [formData, setFormData] = useState<FAQFormData>({
    question: '',
    answer: '',
    type: 'homepage',
    order: 0,
    active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadFAQs();
  }, []);

  const loadFAQs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminFAQs();
      setFaqs(data);
    } catch (err) {
      console.error('Error loading FAQs:', err);
      setError(err instanceof Error ? err.message : 'SSS\'ler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const filteredFAQs = selectedType === 'all'
    ? faqs
    : faqs.filter(faq => faq.type === selectedType);

  const handleOpenModal = (faq?: FAQ) => {
    if (faq) {
      setEditingFaq(faq);
      setFormData({
        question: faq.question,
        answer: faq.answer,
        type: faq.type,
        order: faq.order,
        active: faq.active,
      });
    } else {
      setEditingFaq(null);
      setFormData({
        question: '',
        answer: '',
        type: 'homepage',
        order: filteredFAQs.length + 1,
        active: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingFaq(null);
    setFormData({
      question: '',
      answer: '',
      type: 'homepage',
      order: 0,
      active: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (editingFaq) {
        await updateAdminFAQ(editingFaq.id, formData);
      } else {
        await createAdminFAQ(formData);
      }
      await loadFAQs();
      handleCloseModal();
    } catch (err) {
      console.error('Error saving FAQ:', err);
      setError(err instanceof Error ? err.message : 'SSS kaydedilirken bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
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

  const handleToggleActive = async (faq: FAQ) => {
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
        title="SSS Yönetimi"
        description="Ana sayfa ve SSS sayfası için sık sorulan soruları yönetin"
        actions={
          <Button onClick={() => handleOpenModal()}>
            <Plus className="h-4 w-4" />
            Yeni SSS
          </Button>
        }
      />

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-border bg-[var(--destructive-muted)] p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-medium text-destructive">Hata</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
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
      {filteredFAQs.length === 0 ? (
        <EmptyState
          icon={<HelpCircle />}
          title="Henüz SSS eklenmemiş"
          description="Ana sayfada ve SSS sayfasında görünecek ilk soruyu ekleyin."
          action={
            <Button onClick={() => handleOpenModal()}>
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
                        onClick={() => handleToggleActive(faq)}
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
                        onClick={() => handleOpenModal(faq)}
                        className="h-9 w-9"
                        title="Düzenle"
                        aria-label="Düzenle"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(faq.id)}
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card shadow-elevated">
            <div className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  {editingFaq ? 'SSS Düzenle' : 'Yeni SSS'}
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCloseModal}
                  aria-label="Kapat"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="faq-question" className="mb-2 block text-sm font-medium text-foreground">
                    Soru *
                  </label>
                  <Input
                    id="faq-question"
                    type="text"
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    required
                    placeholder="Soru metnini girin"
                  />
                </div>

                <div>
                  <label htmlFor="faq-answer" className="mb-2 block text-sm font-medium text-foreground">
                    Cevap *
                  </label>
                  <Textarea
                    id="faq-answer"
                    value={formData.answer}
                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                    required
                    rows={6}
                    placeholder="Cevap metnini girin"
                    className="resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="faq-type" className="mb-2 block text-sm font-medium text-foreground">
                      Tip *
                    </label>
                    <select
                      id="faq-type"
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value as 'homepage' | 'page' })
                      }
                      required
                      className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="homepage">Ana Sayfa</option>
                      <option value="page">SSS Sayfası</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="faq-order" className="mb-2 block text-sm font-medium text-foreground">
                      Sıra *
                    </label>
                    <Input
                      id="faq-order"
                      type="number"
                      value={formData.order}
                      onChange={(e) =>
                        setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
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
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="h-4 w-4 rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <label htmlFor="active" className="cursor-pointer text-sm text-foreground">
                    Aktif
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
                  <Button type="button" variant="outline" onClick={handleCloseModal}>
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
    </div>
  );
}
