'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Save, X, HelpCircle, Loader2, AlertCircle } from 'lucide-react';
import {
  getAdminFAQs,
  getAdminFAQById,
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1
            className="text-2xl md:text-3xl font-normal text-white mb-2"
            style={{
              fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
            }}
          >
            SSS Yönetimi
          </h1>
          <p className="text-sm text-[#ebebeb]">
            Ana sayfa ve SSS sayfası için sık sorulan soruları yönetin
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg transition-colors text-sm font-medium"
          style={{
            fontFamily: 'var(--font-sans), "Inter", sans-serif',
          }}
        >
          <Plus className="w-4 h-4" />
          Yeni SSS
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-400 font-medium">Hata</p>
            <p className="text-sm text-red-300 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedType('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedType === 'all'
              ? 'bg-[#3B82F6] text-white'
              : 'bg-[#1a1a1a] text-[#ebebeb] hover:text-white border border-[#333333]'
          }`}
        >
          Tümü ({faqs.length})
        </button>
        <button
          onClick={() => setSelectedType('homepage')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedType === 'homepage'
              ? 'bg-[#3B82F6] text-white'
              : 'bg-[#1a1a1a] text-[#ebebeb] hover:text-white border border-[#333333]'
          }`}
        >
          Ana Sayfa ({faqs.filter(f => f.type === 'homepage').length})
        </button>
        <button
          onClick={() => setSelectedType('page')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedType === 'page'
              ? 'bg-[#3B82F6] text-white'
              : 'bg-[#1a1a1a] text-[#ebebeb] hover:text-white border border-[#333333]'
          }`}
        >
          SSS Sayfası ({faqs.filter(f => f.type === 'page').length})
        </button>
      </div>

      {/* FAQ List */}
      {filteredFAQs.length === 0 ? (
        <div className="text-center py-12 bg-[#1a1a1a] rounded-lg border border-[#333333]">
          <HelpCircle className="w-12 h-12 mx-auto mb-4 text-[#ebebeb]" />
          <p className="text-[#ebebeb] mb-2">Henüz SSS eklenmemiş</p>
          <button
            onClick={() => handleOpenModal()}
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
                className="bg-[#1a1a1a] border border-[#333333] rounded-lg p-4 hover:border-[#444444] transition-colors"
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
                      onClick={() => handleToggleActive(faq)}
                      className={`p-2 rounded-lg transition-colors ${
                        faq.active
                          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                          : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      }`}
                      title={faq.active ? 'Pasif Yap' : 'Aktif Yap'}
                    >
                      {faq.active ? '✓' : '✗'}
                    </button>
                    <button
                      onClick={() => handleOpenModal(faq)}
                      className="p-2 rounded-lg bg-[#333333] hover:bg-[#3B82F6] text-[#ebebeb] hover:text-white transition-colors"
                      title="Düzenle"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(faq.id)}
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

      {/* Modal */}
      {isModalOpen && (
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
                  onClick={handleCloseModal}
                  className="p-2 rounded-lg hover:bg-[#333333] text-[#ebebeb] hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Soru *
                  </label>
                  <input
                    type="text"
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
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
                    value={formData.answer}
                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
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
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value as 'homepage' | 'page' })
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
                      value={formData.order}
                      onChange={(e) =>
                        setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
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
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 rounded border-[#333333] text-[#3B82F6] focus:ring-[#3B82F6] bg-[#0f0f0f]"
                  />
                  <label htmlFor="active" className="text-sm text-white cursor-pointer">
                    Aktif
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#333333]">
                  <button
                    type="button"
                    onClick={handleCloseModal}
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
    </div>
  );
}

