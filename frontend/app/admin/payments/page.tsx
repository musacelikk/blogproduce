'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Inbox,
  Landmark,
  Loader2,
  RefreshCw,
  X,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { formatTry, formatTokens } from '@/lib/currency';
import {
  confirmPaymentRequest,
  getPendingPaymentRequests,
  rejectPaymentRequest,
  type PaymentRequest,
} from '@/lib/api';

/**
 * The havale/EFT inbox.
 *
 * Bank transfers have no callback, so this screen is the point where money
 * becomes entitlement: an admin matches a line on the bank statement to a
 * reference code and confirms. Confirming credits tokens or activates a plan
 * immediately, which is why the reference code and amount are the two most
 * prominent things on every row — those are what the admin is comparing against
 * the statement.
 */
export default function AdminPaymentsPage() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await getPendingPaymentRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ödemeler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleConfirm = async (request: PaymentRequest) => {
    const note = window.prompt(
      `“${request.referenceCode}” referanslı ${formatTry(Number(request.amount))} tutarındaki ödemeyi onaylıyorsunuz.\n\n` +
        'Onaylandığında bakiye/plan anında tanımlanır ve geri alınamaz.\n\n' +
        'Banka dekont referansı (isteğe bağlı):',
      '',
    );
    // A null return means the admin backed out of the dialog; empty string is a
    // deliberate "no note" and must still confirm.
    if (note === null) return;

    setBusyId(request.id);
    setNotice(null);
    try {
      await confirmPaymentRequest(request.id, note || undefined);
      setNotice({
        type: 'success',
        text: `${request.referenceCode} onaylandı ve müşteriye tanımlandı.`,
      });
      await load();
    } catch (err) {
      setNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'Onaylanamadı',
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (request: PaymentRequest) => {
    const reason = window.prompt(
      `“${request.referenceCode}” referanslı ödemeyi reddediyorsunuz.\n\nGerekçe:`,
      'Ödeme hesabımıza ulaşmadı',
    );
    if (reason === null) return;

    setBusyId(request.id);
    setNotice(null);
    try {
      await rejectPaymentRequest(request.id, reason || undefined);
      setNotice({ type: 'success', text: `${request.referenceCode} reddedildi.` });
      await load();
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Reddedilemedi' });
    } finally {
      setBusyId(null);
    }
  };

  const term = search.trim().toLowerCase();
  const visible = term
    ? requests.filter(
        (r) =>
          r.referenceCode?.toLowerCase().includes(term) ||
          r.user?.email?.toLowerCase().includes(term) ||
          r.notes?.toLowerCase().includes(term),
      )
    : requests;

  const totalPending = requests.reduce((sum, r) => sum + Number(r.amount ?? 0), 0);
  const oldest = requests.length
    ? Math.floor((Date.now() - new Date(requests[0].createdAt).getTime()) / 86_400_000)
    : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finans"
        title="Havale / EFT onayları"
        description="Banka ekstrenizdeki açıklamayı referans koduyla eşleştirin ve onaylayın. Onay anında müşterinin bakiyesi veya planı tanımlanır."
        actions={
          <Button variant="outline" onClick={load}>
            <RefreshCw />
            Yenile
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Bekleyen ödeme"
          value={String(requests.length)}
          icon={<Inbox />}
          hint="Onay bekleyen sipariş sayısı"
        />
        <StatCard
          label="Bekleyen tutar"
          value={formatTry(totalPending)}
          icon={<Landmark />}
          hint="Tahsil edildiğinde gelir"
        />
        <StatCard
          label="En eski talep"
          value={oldest > 0 ? `${oldest} gün` : 'Bugün'}
          icon={<Clock />}
          hint="Bekleyen en eski siparişin yaşı"
        />
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-border bg-destructive-muted p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {notice && (
        <div
          className={`flex items-start gap-3 rounded-xl border border-border p-4 text-sm ${
            notice.type === 'success'
              ? 'bg-success-muted text-success'
              : 'bg-destructive-muted text-destructive'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <p>{notice.text}</p>
        </div>
      )}

      {requests.length > 0 && (
        <Input
          placeholder="Referans kodu veya e-posta ile ara…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      )}

      {visible.length === 0 ? (
        <EmptyState
          icon={<Inbox />}
          title={requests.length === 0 ? 'Bekleyen ödeme yok' : 'Aramanızla eşleşen ödeme yok'}
          description={
            requests.length === 0
              ? 'Müşteriler havale siparişi oluşturduğunda burada listelenir.'
              : 'Farklı bir referans kodu veya e-posta deneyin.'
          }
        />
      ) : (
        <div className="space-y-3">
          {visible.map((request) => {
            const isBusy = busyId === request.id;
            const waitingDays = Math.floor(
              (Date.now() - new Date(request.createdAt).getTime()) / 86_400_000,
            );

            return (
              <Card key={request.id} className="p-5">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="rounded-lg bg-accent px-2.5 py-1 font-mono text-sm font-semibold tracking-wider text-accent-foreground">
                        {request.referenceCode}
                      </code>
                      <Badge variant="warning">Onay bekliyor</Badge>
                      {waitingDays >= 3 && (
                        <Badge variant="destructive">{waitingDays} gündür bekliyor</Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
                      <Detail label="Müşteri" value={request.user?.email ?? request.userId} />
                      <Detail label="Sipariş" value={request.notes ?? '—'} />
                      <Detail
                        label="Tanımlanacak"
                        value={
                          request.tokens
                            ? `${formatTokens(Number(request.tokens))} token`
                            : (request.plan?.name ?? '—') +
                              (request.billingPeriod === 'yearly' ? ' (yıllık)' : ' (aylık)')
                        }
                      />
                      <Detail
                        label="Talep tarihi"
                        value={new Date(request.createdAt).toLocaleString('tr-TR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      />
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-4 lg:flex-col lg:items-end">
                    <span className="text-2xl font-semibold tabular-nums text-foreground-strong">
                      {formatTry(Number(request.amount))}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleConfirm(request)}
                        disabled={isBusy || busyId !== null}
                      >
                        {isBusy ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                        Onayla
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(request)}
                        disabled={isBusy || busyId !== null}
                      >
                        <X />
                        Reddet
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="shrink-0 text-muted-foreground">{label}:</span>
      <span className="min-w-0 truncate font-medium text-foreground-strong">{value}</span>
    </div>
  );
}
