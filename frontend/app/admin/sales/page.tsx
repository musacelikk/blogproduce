'use client';

import { useState, useEffect } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Loader2,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';
import { getAdminSalesStats, getAdminPayments, getAdminSubscriptions, type SalesStats, type AdminPayment, type AdminSubscription } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const SELECT_CLASS =
  'h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

const statusVariants: Record<string, BadgeProps['variant']> = {
  completed: 'success',
  pending: 'warning',
  failed: 'destructive',
  refunded: 'info',
  cancelled: 'outline',
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

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  const maxPlanRevenue = salesStats
    ? Math.max(...salesStats.planSales.map((p) => p.revenue), 0)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Satış Raporları ve Ödemeler"
        description="Tüm abonelik ve ödeme kayıtlarını görüntüleyin"
        actions={
          <>
            <select
              value={selectedMonth || ''}
              onChange={(e) => setSelectedMonth(e.target.value)}
              aria-label="Dönem seçin"
              className={SELECT_CLASS}
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
              aria-label="Durum filtresi"
              className={SELECT_CLASS}
            >
              <option value="all">Tüm Durumlar</option>
              <option value="completed">Tamamlanan</option>
              <option value="pending">Bekleyen</option>
              <option value="failed">Başarısız</option>
              <option value="refunded">İade Edilen</option>
              <option value="cancelled">İptal Edilen</option>
            </select>
          </>
        }
      />

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-[var(--destructive-muted)] p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Hata</p>
            <p className="mt-1 text-xs">{error}</p>
          </div>
        </div>
      )}

      {/* Stats */}
      {salesStats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatCard
            label="Toplam Gelir"
            value={formatPrice(salesStats.totalRevenue)}
            icon={<DollarSign />}
          />
          <StatCard
            label="Toplam Ödeme"
            value={salesStats.totalPayments}
            icon={<CreditCard />}
          />
          <StatCard
            label="Benzersiz Müşteri"
            value={salesStats.uniqueCustomers}
            icon={<Users />}
          />
          <StatCard
            label="Ortalama Sipariş"
            value={formatPrice(salesStats.averageOrderValue)}
            icon={<TrendingUp />}
          />
        </div>
      )}

      {/* Plan Sales */}
      {salesStats && salesStats.planSales.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h2 className="mb-4 text-base font-semibold text-foreground">Plan Bazlı Satışlar</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {salesStats.planSales.map((planSale, index) => (
              <div key={index} className="rounded-xl border border-border bg-secondary/60 p-4">
                <p className="text-sm font-semibold text-foreground">{planSale.planName}</p>
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Satış Sayısı</span>
                    <span className="font-medium text-foreground">{planSale.count}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Toplam Gelir</span>
                    <span className="font-medium text-success">{formatPrice(planSale.revenue)}</span>
                  </div>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-card">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${maxPlanRevenue > 0 ? (planSale.revenue / maxPlanRevenue) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Payments */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">
          Ödeme Geçmişi ({payments.length})
        </h2>
        {payments.length === 0 ? (
          <EmptyState
            icon={<CreditCard />}
            title="Ödeme kaydı bulunamadı"
            description="Seçtiğiniz filtrelere uygun bir ödeme kaydı yok."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>Kullanıcı</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Tutar</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Ödeme Yöntemi</TableHead>
                <TableHead>İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => {
                const StatusIcon = statusIcons[payment.status as keyof typeof statusIcons] || CheckCircle2;
                const statusVariant = statusVariants[payment.status] || 'success';
                return (
                  <TableRow key={payment.id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatDate(payment.createdAt)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {payment.user ? (
                        <div>
                          <p className="text-sm font-medium text-foreground">{payment.user.name}</p>
                          <p className="text-xs text-muted-foreground">{payment.user.email}</p>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {payment.plan?.name || '-'}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold text-foreground">
                        {formatPrice(payment.amount)}
                      </span>
                      {payment.currency && payment.currency !== 'USD' && (
                        <span className="ml-1 text-xs text-muted-foreground">{payment.currency}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant}>
                        <StatusIcon className="h-3 w-3" />
                        {payment.status === 'completed' ? 'Tamamlandı' :
                         payment.status === 'pending' ? 'Beklemede' :
                         payment.status === 'failed' ? 'Başarısız' :
                         payment.status === 'refunded' ? 'İade Edildi' :
                         'İptal Edildi'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {payment.paymentMethod === 'credit_card' ? 'Kredi Kartı' :
                       payment.paymentMethod === 'bank_transfer' ? 'Banka Havalesi' :
                       payment.paymentMethod === 'paypal' ? 'PayPal' :
                       payment.paymentMethod === 'other' ? 'Diğer' :
                       '-'}
                    </TableCell>
                    <TableCell>
                      {payment.transactionId && (
                        <span className="font-mono text-xs text-muted-foreground">
                          {payment.transactionId.slice(0, 8)}...
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Subscriptions */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">
          Abonelikler ({subscriptions.length})
        </h2>
        {subscriptions.length === 0 ? (
          <EmptyState
            icon={<CreditCard />}
            title="Abonelik kaydı bulunamadı"
            description="Henüz kayıtlı bir abonelik bulunmuyor."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kullanıcı</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Faturalama</TableHead>
                <TableHead>Başlangıç</TableHead>
                <TableHead>Bitiş</TableHead>
                <TableHead>Otomatik Yenileme</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((subscription) => {
                const statusVariant: BadgeProps['variant'] =
                  subscription.status === 'active' ? 'success' :
                  subscription.status === 'cancelled' ? 'destructive' :
                  subscription.status === 'expired' ? 'outline' :
                  'warning';
                return (
                  <TableRow key={subscription.id}>
                    <TableCell>
                      {subscription.user ? (
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {subscription.user.name}
                          </p>
                          <p className="text-xs text-muted-foreground">{subscription.user.email}</p>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {subscription.plan?.name || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant}>
                        {subscription.status === 'active' ? 'Aktif' :
                         subscription.status === 'cancelled' ? 'İptal Edildi' :
                         subscription.status === 'expired' ? 'Süresi Doldu' :
                         'Beklemede'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {subscription.billingPeriod === 'yearly' ? 'Yıllık' : 'Aylık'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatDate(subscription.startedAt)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {subscription.expiresAt ? (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{formatDate(subscription.expiresAt)}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Zamansız</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-xs font-medium ${subscription.autoRenew ? 'text-success' : 'text-muted-foreground'}`}
                      >
                        {subscription.autoRenew ? 'Evet' : 'Hayır'}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
