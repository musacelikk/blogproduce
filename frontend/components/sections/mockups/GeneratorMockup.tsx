import { Check, Loader2, Sparkles } from 'lucide-react';
import { BrowserFrame } from './BrowserFrame';

const TONES = ['Profesyonel', 'Samimi', 'Teknik'];

/** Mirrors the real pipeline: outline → draft → polish. */
const STAGES = [
  { label: 'Konu analizi', state: 'done' as const },
  { label: 'Yazılıyor', state: 'active' as const },
  { label: 'Editör kontrolü', state: 'pending' as const },
];

/** The generation screen: what a customer fills in, and what they watch. */
export function GeneratorMockup({ className }: { className?: string }) {
  return (
    <BrowserFrame
      url="blogproduce.com/dashboard/generate"
      label="BlogProduce üretim ekranı: konu, ton ve kalite seçimi ile üretim aşamalarını gösteren panel"
      className={className}
    >
      <div className="space-y-4 p-5">
        {/* Topic */}
        <div>
          <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Konu
          </span>
          <div className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground">
            E-ticaret sitesi için SEO uyumlu ürün açıklaması nasıl yazılır
          </div>
        </div>

        {/* Tone + quality */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Ton
            </span>
            <div className="flex flex-wrap gap-1.5">
              {TONES.map((tone, i) => (
                <span
                  key={tone}
                  className={
                    i === 0
                      ? 'rounded-md bg-accent px-2 py-1 text-[11px] font-medium text-accent-foreground'
                      : 'rounded-md border border-border bg-card px-2 py-1 text-[11px] text-muted-foreground'
                  }
                >
                  {tone}
                </span>
              ))}
            </div>
          </div>
          <div>
            <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Kalite
            </span>
            <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-1.5">
              <span className="text-[11px] font-medium text-foreground">Pro</span>
              <span className="text-[10px] tabular-nums text-muted-foreground">~$0.12</span>
            </div>
          </div>
        </div>

        {/* Action */}
        <div className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-primary-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          <span className="text-xs font-semibold">Blog Üret</span>
        </div>

        {/* Live progress — the same three stages the backend reports. */}
        <div className="rounded-lg border border-border bg-info-muted p-3">
          <div className="flex items-center gap-2 text-info">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span className="text-[11px] font-medium">AI blog içeriğini üretiyor…</span>
          </div>
          <ol className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-info/20 pt-2.5">
            {STAGES.map((stage, i) => (
              <li key={stage.label} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-[10px] text-info/40">→</span>}
                <span
                  className={
                    stage.state === 'done'
                      ? 'flex items-center gap-1 text-[10px] text-info/70'
                      : stage.state === 'active'
                        ? 'text-[10px] font-semibold text-info'
                        : 'text-[10px] text-info/40'
                  }
                >
                  {stage.state === 'done' && <Check className="h-2.5 w-2.5" />}
                  {stage.label}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </BrowserFrame>
  );
}
