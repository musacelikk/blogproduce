'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  Users,
  CreditCard,
  Calendar,
  Filter,
  Loader2,
  AlertCircle,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { getAdminSalesStats, getAdminPayments, getAdminSubscriptions, type SalesStats, type AdminPayment, type AdminSubscription } from '@/lib/api';
import Link from 'next/link';

const statusColors = {
  completed: 'bg-green-500/20 text-green-400',
  pending: 'bg-yellow-500/20 text-yellow-400',
  failed: 'bg-red-500/20 text-red-400',
  refunded: 'bg-purple-500/20 text-purple-400',
  cancelled: 'bg-gray-500/20 text-gray-400',
};

const statusIcons = {
  completed: CheckCircle2,
  pending: Clock,
  failed: XCircle,
  refunded: XCircle,
  cancelled: XCircle,
};

const MONTHS_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

export default function AdminSalesPage() {
  const [salesStats, setSalesStats] = useState<SalesStats | null>(null);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSalesData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, statusFilter]);

  const loadSalesData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [stats, paymentsData, subscriptionsData] = await Promise.all([
        getAdminSalesStats(selectedMonth || undefined),
        getAdminPayments(statusFilter !== 'all' ? { status: statusFilter } : {}),
        getAdminSubscriptions(),
      ]);
      setSalesStats(stats);
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      setSubscriptions(Array.isArray(subscriptionsData) ? subscriptionsData : []);
    } catch (err) {
      console.error('Error loading sales data:', err);
      setError(err instanceof Error ? err.message : 'Satış verileri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-');
    return `${MONTHS_TR[parseInt(monthNum) - 1]} ${year}`;
  };

  // Get available months from payments
  const availableMonths = Array.from(
    new Set(
      payments.map(p => {
        const date = new Date(p.createdAt);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      })
    )
  )
    .sort()
    .reverse()
    .slice(0, 12);

  const currentMonth = new Date().toISOString().slice(0, 7);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-2 text-[#3B82F6] animate-spin" />
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
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1
            className="text-lg font-medium text-white mb-1"
            style={{
              fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
            }}
          >
            Satış Raporları ve Ödemeler
          </h1>
          <p className="text-xs text-[#ebebeb]">
            Tüm abonelik ve ödeme kayıtlarını görüntüleyin
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedMonth || ''}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 text-xs bg-[#0f0f0f] border border-[#333333] rounded-lg text-white focus:border-[#3B82F6] focus:outline-none"
            style={{
              fontFamily: 'var(--font-sans), "Inter", sans-serif',
            }}
          >
            <option value="">Tüm Zamanlar</option>
            {availableMonths.map((month) => (
              <option key={month} value={month}>
                {formatMonth(month)}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-[#0f0f0f] border border-[#333333] rounded-lg text-white focus:border-[#3B82F6] focus:outline-none"
            style={{
              fontFamily: 'var(--font-sans), "Inter", sans-serif',
            }}
          >
            <option value="all">Tüm Durumlar</option>
            <option value="completed">Tamamlanan</option>
            <option value="pending">Bekleyen</option>
            <option value="failed">Başarısız</option>
            <option value="refunded">İade Edilen</option>
            <option value="cancelled">İptal Edilen</option>
          </select>
        </div>
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Hata</p>
              <p className="text-xs mt-1">{error}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      {salesStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333333]"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#ebebeb] mb-1">Toplam Gelir</p>
                <p className="text-xl font-semibold text-white">{formatPrice(salesStats.totalRevenue)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333333]"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#ebebeb] mb-1">Toplam Ödeme</p>
                <p className="text-xl font-semibold text-white">{salesStats.totalPayments}</p>
              </div>
              <CreditCard className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333333]"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#ebebeb] mb-1">Benzersiz Müşteri</p>
                <p className="text-xl font-semibold text-white">{salesStats.uniqueCustomers}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500 opacity-50" />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333333]"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#ebebeb] mb-1">Ortalama Sipariş</p>
                <p className="text-xl font-semibold text-white">{formatPrice(salesStats.averageOrderValue)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-yellow-500 opacity-50" />
            </div>
          </motion.div>
        </div>
      )}

      {/* Plan Sales */}
      {salesStats && salesStats.planSales.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333333]"
        >
          <h2
            className="text-base font-medium text-white mb-4"
            style={{
              fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
            }}
          >
            Plan Bazlı Satışlar
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {salesStats.planSales.map((planSale, index) => (
              <div key={index} className="bg-[#0f0f0f] rounded-lg p-4 border border-[#333333]">
                <p className="text-sm font-medium text-white mb-2">{planSale.planName}</p>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#ebebeb]">Satış Sayısı</span>
                    <span className="text-white font-medium">{planSale.count}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#ebebeb]">Toplam Gelir</span>
                    <span className="text-green-400 font-medium">{formatPrice(planSale.revenue)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Payments */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-[#1a1a1a] rounded-xl border border-[#333333] overflow-hidden"
      >
        <div className="p-6 border-b border-[#333333]">
          <h2
            className="text-base font-medium text-white"
            style={{
              fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
            }}
          >
            Ödeme Geçmişi ({payments.length})
          </h2>
        </div>
        {payments.length === 0 ? (
          <div className="p-12 text-center text-[#ebebeb]">
            <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Ödeme kaydı bulunamadı</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0f0f0f] border-b border-[#333333]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#ebebeb] uppercase tracking-wider">Tarih</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#ebebeb] uppercase tracking-wider">Kullanıcı</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#ebebeb] uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#ebebeb] uppercase tracking-wider">Tutar</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#ebebeb] uppercase tracking-wider">Durum</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#ebebeb] uppercase tracking-wider">Ödeme Yöntemi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#ebebeb] uppercase tracking-wider">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#333333]">
                {payments.map((payment, index) => {
                  const StatusIcon = statusIcons[payment.status as keyof typeof statusIcons] || CheckCircle2;
                  const statusColor = statusColors[payment.status as keyof typeof statusColors] || statusColors.completed;
                  return (
                    <motion.tr
                      key={payment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="hover:bg-[#0f0f0f]/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-xs text-[#ebebeb]">
                          <Calendar className="w-3.5 h-3.5 text-[#ebebeb]" />
                          <span>{formatDate(payment.createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {payment.user ? (
                          <div>
                            <p className="text-xs font-medium text-[#ebebeb]">{payment.user.name}</p>
                            <p className="text-xs text-[#ebebeb]">{payment.user.email}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-[#ebebeb]">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-[#ebebeb]">{payment.plan?.name || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-white">{formatPrice(payment.amount)}</span>
                        {payment.currency && payment.currency !== 'USD' && (
                          <span className="text-xs text-[#ebebeb] ml-1">{payment.currency}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                          <StatusIcon className="w-3 h-3" />
                          {payment.status === 'completed' ? 'Tamamlandı' :
                           payment.status === 'pending' ? 'Beklemede' :
                           payment.status === 'failed' ? 'Başarısız' :
                           payment.status === 'refunded' ? 'İade Edildi' :
                           'İptal Edildi'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-[#ebebeb]">
                          {payment.paymentMethod === 'credit_card' ? 'Kredi Kartı' :
                           payment.paymentMethod === 'bank_transfer' ? 'Banka Havalesi' :
                           payment.paymentMethod === 'paypal' ? 'PayPal' :
                           payment.paymentMethod === 'other' ? 'Diğer' :
                           '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {payment.transactionId && (
                          <span className="text-xs text-[#ebebeb] font-mono">{payment.transactionId.slice(0, 8)}...</span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Subscriptions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="bg-[#1a1a1a] rounded-xl border border-[#333333] overflow-hidden"
      >
        <div className="p-6 border-b border-[#333333]">
          <h2
            className="text-base font-medium text-white"
            style={{
              fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
            }}
          >
            Abonelikler ({subscriptions.length})
          </h2>
        </div>
        {subscriptions.length === 0 ? (
          <div className="p-12 text-center text-[#ebebeb]">
            <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Abonelik kaydı bulunamadı</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0f0f0f] border-b border-[#333333]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#ebebeb] uppercase tracking-wider">Kullanıcı</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#ebebeb] uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#ebebeb] uppercase tracking-wider">Durum</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#ebebeb] uppercase tracking-wider">Faturalama</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#ebebeb] uppercase tracking-wider">Başlangıç</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#ebebeb] uppercase tracking-wider">Bitiş</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#ebebeb] uppercase tracking-wider">Otomatik Yenileme</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#333333]">
                {subscriptions.map((subscription, index) => {
                  const statusColor =
                    subscription.status === 'active' ? 'bg-green-500/20 text-green-400' :
                    subscription.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                    subscription.status === 'expired' ? 'bg-gray-500/20 text-gray-400' :
                    'bg-yellow-500/20 text-yellow-400';
                  return (
                    <motion.tr
                      key={subscription.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="hover:bg-[#0f0f0f]/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        {subscription.user ? (
                          <div>
                            <p className="text-xs font-medium text-[#ebebeb]">{subscription.user.name}</p>
                            <p className="text-xs text-[#ebebeb]">{subscription.user.email}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-[#ebebeb]">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-[#ebebeb]">{subscription.plan?.name || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                          {subscription.status === 'active' ? 'Aktif' :
                           subscription.status === 'cancelled' ? 'İptal Edildi' :
                           subscription.status === 'expired' ? 'Süresi Doldu' :
                           'Beklemede'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-[#ebebeb]">
                          {subscription.billingPeriod === 'yearly' ? 'Yıllık' : 'Aylık'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs text-[#ebebeb]">
                          <Calendar className="w-3.5 h-3.5 text-[#ebebeb]" />
                          <span>{formatDate(subscription.startedAt)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {subscription.expiresAt ? (
                          <div className="flex items-center gap-2 text-xs text-[#ebebeb]">
                            <Calendar className="w-3.5 h-3.5 text-[#ebebeb]" />
                            <span>{formatDate(subscription.expiresAt)}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-[#ebebeb]">Zamansız</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs ${subscription.autoRenew ? 'text-green-400' : 'text-gray-400'}`}>
                          {subscription.autoRenew ? 'Evet' : 'Hayır'}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}

