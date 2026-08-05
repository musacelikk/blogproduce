'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Calendar, Clock, CheckCircle2, XCircle, AlertCircle, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton, TableSkeleton } from '@/components/ui/skeleton';
import { getBillingHistory, getCurrentPlan, type BillingHistoryItem, type UserPlanInfo } from '@/lib/api';
import Link from 'next/link';

const statusVariant: Record<string, 'success' | 'outline' | 'destructive' | 'warning'> = {
  active: 'success',
  cancelled: 'outline',
  expired: 'destructive',
  pending: 'warning',
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
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>

        <Card className="p-6 shadow-card">
          <Skeleton className="mb-4 h-6 w-32" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i}>
                <Skeleton className="mb-2 h-3 w-24" />
                <Skeleton className="h-5 w-32" />
              </div>
            ))}
          </div>
        </Card>

        <TableSkeleton rows={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-border bg-[var(--destructive-muted)] p-4 text-destructive">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Hata</p>
              <p>{error}</p>
              <Button variant="outline" size="sm" onClick={loadBillingData} className="mt-2">
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
      <PageHeader
        title="Fatura Geçmişi"
        description="Abonelik ve ödeme geçmişinizi görüntüleyin"
        actions={
          <Link href="/dashboard/plans">
            <Button variant="outline">
              Planları Görüntüle
            </Button>
          </Link>
        }
      />

      {/* Current Plan Summary */}
      {currentPlanInfo && (
        <Card className="p-6 shadow-card">
          <div className="mb-4 flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              Aktif Abonelik
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <p className="mb-1 text-xs text-muted-foreground">
                Plan
              </p>
              <p className="text-base font-medium text-foreground">
                {currentPlanInfo.currentPlan?.name || 'Ücretsiz Plan'}
              </p>
            </div>
            {currentPlanInfo.subscription && (
              <>
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">
                    Faturalama Dönemi
                  </p>
                  <p className="text-base font-medium text-foreground">
                    {currentPlanInfo.subscription.billingPeriod === 'yearly' ? 'Yıllık' : 'Aylık'}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">
                    {currentPlanInfo.subscription.expiresAt ? 'Bitiş Tarihi' : 'Durum'}
                  </p>
                  <p className="text-base font-medium text-foreground">
                    {currentPlanInfo.subscription.expiresAt
                      ? formatDate(currentPlanInfo.subscription.expiresAt)
                      : 'Zamansız'}
                  </p>
                </div>
              </>
            )}
            {!currentPlanInfo.subscription && (
              <div>
                <p className="mb-1 text-xs text-muted-foreground">
                  Durum
                </p>
                <p className="text-base font-medium text-foreground">
                  Aktif - Zamansız
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Billing History */}
      <Card className="overflow-hidden shadow-card">
        <div className="border-b border-border p-6">
          <div className="flex items-center gap-3">
            <Receipt className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              Fatura Geçmişi
            </h2>
          </div>
        </div>
        {billingHistory.length === 0 ? (
          <EmptyState
            className="rounded-none border-0"
            icon={<Receipt />}
            title="Henüz fatura geçmişi bulunmuyor"
            description="Plan satın aldığınızda faturalarınız burada görünecek"
          />
        ) : (
          <div className="divide-y divide-border">
            {billingHistory.map((item) => {
              const StatusIcon = statusIcons[item.status as keyof typeof statusIcons] || CheckCircle2;
              const variant = statusVariant[item.status] || 'success';
              const price = item.billingPeriod === 'yearly' ? item.plan.price.yearly : item.plan.price.monthly;

              return (
                <div
                  key={item.id}
                  className="p-6 transition-colors hover:bg-secondary"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <h3 className="text-base font-medium text-foreground">
                          {item.plan.name}
                        </h3>
                        <Badge variant={variant}>
                          <StatusIcon className="h-3 w-3" />
                          {item.status === 'active' ? 'Aktif' : item.status === 'cancelled' ? 'İptal Edildi' : item.status === 'expired' ? 'Süresi Doldu' : 'Beklemede'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 gap-4 text-sm text-muted-foreground md:grid-cols-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Başlangıç: {formatDate(item.startedAt)}</span>
                        </div>
                        {item.expiresAt && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>Bitiş: {formatDate(item.expiresAt)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Receipt className="h-4 w-4" />
                          <span>
                            {item.billingPeriod === 'yearly' ? 'Yıllık' : 'Aylık'} - {formatPrice(price)}
                          </span>
                        </div>
                      </div>
                      {item.cancelledAt && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          İptal tarihi: {formatDate(item.cancelledAt)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
