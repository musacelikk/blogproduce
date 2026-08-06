'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Check, Copy, Landmark, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatTry } from '@/lib/currency';
import type { BankDetails, PaymentRequest } from '@/lib/api';

/**
 * Shown after an order is opened. Everything a customer needs to complete a
 * havale/EFT lives here, because the moment they leave for their banking app is
 * the moment the sale is lost if a detail is missing.
 *
 * The reference code is the load-bearing element: it is the only link between a
 * line on our bank statement and this account, so it gets the strongest visual
 * treatment and its own copy button.
 */
export function BankTransferPanel({
  payment,
  bank,
  onClose,
  onCancelled,
}: {
  payment: PaymentRequest;
  bank: BankDetails;
  onClose: () => void;
  onCancelled?: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    // The page behind is long; locking it keeps focus on the transfer steps.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="havale-baslik"
      onClick={onClose}
    >
      <div
        className="my-auto w-full max-w-lg rounded-2xl border border-border bg-card shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent">
              <Landmark className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <h2 id="havale-baslik" className="text-base font-semibold text-foreground-strong">
                Havale / EFT ile ödeme
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {payment.notes ?? 'Siparişiniz oluşturuldu'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Kapat"
            className="rounded-lg p-1.5 text-muted-foreground transition-colors duration-fast ease-out-quart hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="flex items-baseline justify-between gap-4 rounded-xl bg-secondary p-4">
            <span className="text-sm text-muted-foreground">Gönderilecek tutar</span>
            <span className="text-2xl font-semibold tabular-nums text-foreground-strong">
              {formatTry(Number(payment.amount))}
            </span>
          </div>

          {/* The one thing that must not be mistyped. */}
          <div>
            <p className="text-eyebrow mb-2 text-muted-foreground">Referans kodu — açıklamaya yazın</p>
            <CopyRow value={payment.referenceCode ?? ''} emphasis />
            <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
              Bu kod yazılmazsa ödemeniz hesabınızla eşleştirilemez ve onay gecikir.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-eyebrow text-muted-foreground">Hesap bilgileri</p>
            <Field label="Banka" value={bank.bankName} />
            <Field label="Hesap sahibi" value={bank.accountHolder} />
            <div>
              <p className="mb-1.5 text-xs text-muted-foreground">IBAN</p>
              <CopyRow value={bank.iban} />
            </div>
          </div>

          <ol className="space-y-2 rounded-xl border border-border p-4">
            {bank.instructions.map((step, index) => (
              <li key={index} className="flex gap-3 text-sm text-muted-foreground">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium tabular-nums text-foreground">
                  {index + 1}
                </span>
                <span>{step.replace(/\*\*(.+?)\*\*/g, '$1')}</span>
              </li>
            ))}
          </ol>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button className="flex-1" onClick={onClose}>
              Havaleyi yaptım
            </Button>
            {onCancelled && (
              <Button variant="outline" className="flex-1" onClick={onCancelled}>
                Siparişi iptal et
              </Button>
            )}
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Ödemeniz onaylandığında bakiyeniz otomatik tanımlanır. Bu siparişi
            “Ödemelerim” bölümünden takip edebilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground-strong">{value}</span>
    </div>
  );
}

/**
 * Copy-to-clipboard row. A customer retyping an IBAN by hand is the single most
 * likely way this flow produces an unmatched payment.
 */
function CopyRow({ value, emphasis = false }: { value: string; emphasis?: boolean }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard is blocked on insecure origins; the value stays selectable.
    }
  };

  return (
    <div
      className={`flex items-center gap-2 rounded-xl border p-3 ${
        emphasis ? 'border-primary bg-accent' : 'border-border bg-secondary'
      }`}
    >
      <code
        className={`flex-1 select-all break-all font-mono ${
          emphasis ? 'text-lg font-semibold tracking-wider text-foreground-strong' : 'text-sm text-foreground'
        }`}
      >
        {value || '—'}
      </code>
      <Button
        variant="ghost"
        size="sm"
        onClick={copy}
        aria-label={copied ? 'Kopyalandı' : 'Kopyala'}
        disabled={!value}
      >
        {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}

/** Shown when BANK_IBAN has not been configured on the deployment. */
export function BankNotConfiguredNotice() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-warning-muted p-4 text-sm text-warning">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <p>
        Havale ile ödeme henüz yapılandırılmadı. Satın alma yapabilmek için lütfen
        bizimle iletişime geçin.
      </p>
    </div>
  );
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: 'success' | 'warning' | 'outline' | 'destructive' }> = {
    pending: { label: 'Ödeme bekleniyor', variant: 'warning' },
    completed: { label: 'Onaylandı', variant: 'success' },
    failed: { label: 'Reddedildi', variant: 'destructive' },
    cancelled: { label: 'İptal edildi', variant: 'outline' },
    refunded: { label: 'İade edildi', variant: 'outline' },
  };
  const entry = map[status] ?? { label: status, variant: 'outline' as const };
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
}
