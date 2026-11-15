import { Check } from 'lucide-react';
import { BrowserFrame } from './BrowserFrame';

/** Mirrors the real cadence presets in `/dashboard/autopilot`. */
const CADENCE = [
  { label: 'Günde 2', perMonth: 60 },
  { label: 'Günde 1', perMonth: 30, active: true },
  { label: 'Haftada 3', perMonth: 13 },
  { label: 'Haftada 2', perMonth: 9 },
];

const MODES = [
  { label: 'Taslağa al, ben onaylayayım' },
  { label: 'Doğrudan yayınla', active: true },
];

/**
 * The autopilot configuration screen.
 *
 * Figures are the real ones: Standard is $0.0069 per article, so a daily
 * cadence projects $0.21 a month. A mockup quoting an invented price would be
 * a promise the product does not keep.
 */
export function AutopilotMockup({ className }: { className?: string }) {
  return (
    <BrowserFrame
      url="blogproduce.com/dashboard/autopilot"
      label="BlogProduce otopilot ekranı: üretim temposu, yayın modu ve aylık maliyet projeksiyonu"
      className={className}
    >
      <div className="space-y-3.5 p-5">
        {/* Switch */}
        <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5">
          <div>
            <p className="text-[11px] font-medium text-foreground">Otopilot açık</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Kapalıyken hiçbir şey üretilmez.
            </p>
          </div>
          <span className="flex h-4 w-7 shrink-0 items-center rounded-full bg-primary px-0.5">
            <span className="ml-auto h-3 w-3 rounded-full bg-primary-foreground" />
          </span>
        </div>

        {/* Publish mode */}
        <div>
          <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Makale bittiğinde
          </span>
          <div className="space-y-1.5">
            {MODES.map((mode) => (
              <div
                key={mode.label}
                className={
                  mode.active
                    ? 'flex items-center gap-2 rounded-lg border border-primary bg-accent px-2.5 py-2'
                    : 'flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-2'
                }
              >
                <span
                  className={
                    mode.active
                      ? 'flex h-3 w-3 shrink-0 items-center justify-center rounded-full bg-primary'
                      : 'h-3 w-3 shrink-0 rounded-full border border-border'
                  }
                >
                  {mode.active && <span className="h-1 w-1 rounded-full bg-primary-foreground" />}
                </span>
                <span
                  className={
                    mode.active
                      ? 'text-[11px] font-medium text-accent-foreground'
                      : 'text-[11px] text-muted-foreground'
                  }
                >
                  {mode.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Cadence */}
        <div>
          <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Üretim temposu
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {CADENCE.map((c) => (
              <div
                key={c.label}
                className={
                  c.active
                    ? 'rounded-lg border border-primary bg-accent px-2.5 py-1.5'
                    : 'rounded-lg border border-border bg-card px-2.5 py-1.5'
                }
              >
                <span
                  className={
                    c.active
                      ? 'block text-[11px] font-semibold text-accent-foreground'
                      : 'block text-[11px] text-foreground'
                  }
                >
                  {c.label}
                </span>
                <span
                  className={
                    c.active
                      ? 'mt-0.5 block text-[9px] text-accent-foreground/70'
                      : 'mt-0.5 block text-[9px] text-muted-foreground'
                  }
                >
                  ~{c.perMonth} / ay
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Cost projection — the number that makes the cadence concrete. */}
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] text-muted-foreground">Tahmini maliyet</span>
            <span className="text-[9px] text-muted-foreground">Standart kalite</span>
          </div>
          <p className="mt-1 text-xl font-semibold tabular-nums text-foreground-strong">
            $0.21
            <span className="ml-1 text-[11px] font-normal text-muted-foreground">/ ay</span>
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Ayda ~30 makale</p>
        </div>

        {/* Topic queue */}
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[10px] font-medium text-foreground">Konu kuyruğu</span>
            <span className="text-[9px] text-muted-foreground">23 sırada</span>
          </div>
          <ul className="space-y-1.5">
            {[
              { t: 'E-ticarette kargo entegrasyonu nasıl kurulur', done: true },
              { t: 'Ürün açıklamasında dönüşüm artıran 7 kalıp', done: false },
              { t: 'Marka sesi oluşturma kılavuzu', done: false },
            ].map((item) => (
              <li key={item.t} className="flex items-center gap-1.5">
                {item.done ? (
                  <Check className="h-2.5 w-2.5 shrink-0 text-success" />
                ) : (
                  <span className="h-1 w-1 shrink-0 rounded-full bg-muted-foreground/40" />
                )}
                <span className="truncate text-[10px] text-muted-foreground">{item.t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </BrowserFrame>
  );
}
