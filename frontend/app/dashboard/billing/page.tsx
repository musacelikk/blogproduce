'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Calendar, Clock, CheckCircle2, XCircle, Loader2, AlertCircle, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/skeleton';
import { getBillingHistory, getCurrentPlan, type BillingHistoryItem, type UserPlanInfo } from '@/lib/api';
import Link from 'next/link';

const statusColors = {
  active: 'bg-green-500/20 text-green-400',
  cancelled: 'bg-gray-500/20 text-gray-400',
  expired: 'bg-red-500/20 text-red-400',
  pending: 'bg-yellow-500/20 text-yellow-400',
};

const statusIcons = {
  active: CheckCircle2,
  cancelled: XCircle,
  expired: XCircle,
  pending: Clock,
};

export default function BillingPage() {
  const [billingHistory, setBillingHistory] = useState<BillingHistoryItem[]>([]);
  const [currentPlanInfo, setCurrentPlanInfo] = useState<UserPlanInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [history, planInfo] = await Promise.all([
        getBillingHistory(),
        getCurrentPlan(),
      ]);
      setBillingHistory(history);
      setCurrentPlanInfo(planInfo);
    } catch (err) {
      console.error('Error loading billing data:', err);
      setError(err instanceof Error ? err.message : 'Fatura geçmişi yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="mb-6">
            <div className="h-8 w-64 bg-[var(--border)] animate-pulse rounded mb-2" />
            <div className="h-4 w-96 bg-[var(--border)] animate-pulse rounded" />
          </div>
          <div className="h-10 w-32 bg-[var(--border)] animate-pulse rounded-lg" />
        </div>

        <div className="rounded-2xl p-6" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="h-6 w-32 bg-[var(--border)] animate-pulse rounded mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i}>
                <div className="h-3 w-24 bg-[var(--border)] animate-pulse rounded mb-2" />
                <div className="h-5 w-32 bg-[var(--border)] animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>

        <TableSkeleton rows={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-5">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Hata</p>
              <p>{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={loadBillingData}
                className="mt-2 border-red-200 text-red-600 hover:bg-red-100"
              >
                Tekrar Dene
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
               style={{ background: 'linear-gradient(135deg,#203eec,#00d4ff)' }}>
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Fatura Geçmişi</h1>
            <p className="text-sm text-muted-foreground">Abonelik ve ödeme geçmişinizi görüntüleyin</p>
          </div>
        </div>
        <Link href="/dashboard/plans">
          <Button variant="outline" className="border-[#203eec] text-[#203eec] hover:bg-[#203eec]/10 rounded-full">
            Planları Görüntüle
          </Button>
        </Link>
      </motion.div>

      {/* Current Plan Summary */}
      {currentPlanInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl p-6" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="w-5 h-5 text-[#203eec]" />
            <h2
              className="text-lg font-semibold text-foreground"
            >
              Aktif Abonelik
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p
                className="text-xs text-muted-foreground mb-1"
              >
                Plan
              </p>
              <p
                className="text-base font-medium text-foreground"
              >
                {currentPlanInfo.currentPlan?.name || 'Ücretsiz Plan'}
              </p>
            </div>
            {currentPlanInfo.subscription && (
              <>
                <div>
                  <p
                    className="text-xs text-muted-foreground mb-1"
                  >
                    Faturalama Dönemi
                  </p>
                  <p
                    className="text-base font-medium text-foreground"
                  >
                    {currentPlanInfo.subscription.billingPeriod === 'yearly' ? 'Yıllık' : 'Aylık'}
                  </p>
                </div>
                <div>
                  <p
                    className="text-xs text-muted-foreground mb-1"
                  >
                    {currentPlanInfo.subscription.expiresAt ? 'Bitiş Tarihi' : 'Durum'}
                  </p>
                  <p
                    className="text-base font-medium text-foreground"
                  >
                    {currentPlanInfo.subscription.expiresAt
                      ? formatDate(currentPlanInfo.subscription.expiresAt)
                      : 'Zamansız'}
                  </p>
                </div>
              </>
            )}
            {!currentPlanInfo.subscription && (
              <div>
                <p
                  className="text-xs text-muted-foreground mb-1"
                >
                  Durum
                </p>
                <p
                  className="text-base font-medium text-foreground"
                >
                  Aktif - Zamansız
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Billing History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="rounded-2xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="p-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <Receipt className="w-5 h-5 text-[#203eec]" />
            <h2
              className="text-lg font-semibold text-foreground"
            >
              Fatura Geçmişi
            </h2>
          </div>
        </div>
        {billingHistory.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p
              className="text-lg text-muted-foreground mb-2"
            >
              Henüz fatura geçmişi bulunmuyor
            </p>
            <p
              className="text-sm text-muted-foreground"
            >
              Plan satın aldığınızda faturalarınız burada görünecek
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {billingHistory.map((item, index) => {
              const StatusIcon = statusIcons[item.status as keyof typeof statusIcons] || CheckCircle2;
              const statusColor = statusColors[item.status as keyof typeof statusColors] || statusColors.active;
              const price = item.billingPeriod === 'yearly' ? item.plan.price.yearly : item.plan.price.monthly;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="p-6 hover:bg-[var(--secondary)] transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3
                          className="text-base font-medium text-foreground"
                        >
                          {item.plan.name}
                        </h3>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                          <StatusIcon className="w-3 h-3" />
                          {item.status === 'active' ? 'Aktif' : item.status === 'cancelled' ? 'İptal Edildi' : item.status === 'expired' ? 'Süresi Doldu' : 'Beklemede'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Başlangıç: {formatDate(item.startedAt)}</span>
                        </div>
                        {item.expiresAt && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>Bitiş: {formatDate(item.expiresAt)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Receipt className="w-4 h-4" />
                          <span>
                            {item.billingPeriod === 'yearly' ? 'Yıllık' : 'Aylık'} - {formatPrice(price)}
                          </span>
                        </div>
                      </div>
                      {item.cancelledAt && (
                        <p className="text-xs text-muted-foreground mt-2">
                          İptal tarihi: {formatDate(item.cancelledAt)}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}

