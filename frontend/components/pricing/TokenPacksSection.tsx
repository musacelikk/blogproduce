import * as React from 'react';
import { Infinity as InfinityIcon, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionHeading } from '@/components/sections/SectionHeading';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  compactTokens,
  formatTokens,
  formatUsd,
  type PricingPack,
} from './plan-model';

interface TokenPacksSectionProps {
  packs: PricingPack[];
  className?: string;
  /** Optional per-pack action, e.g. the in-app purchase button. */
  renderAction?: (pack: PricingPack) => React.ReactNode;
}

/** Pay-as-you-go top-ups. The unit price is what makes the volume discount visible. */
export function TokenPacksSection({ packs, className, renderAction }: TokenPacksSectionProps) {
  if (packs.length === 0) return null;

  return (
    <section className={cn('scroll-mt-24', className)} id="token-paketleri">
      <SectionHeading
        align="center"
        size="md"
        eyebrow="Ek token"
        title="Plan yetmezse, paketle tamamlayın"
        description="Tek seferlik alınan tokenlar süresiz geçerlidir ve yalnızca aylık hakkınız bittikten sonra harcanır."
      />

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
        {packs.map((pack) => (
          <Card
            key={pack.id}
            variant={pack.popular ? 'emphasis' : 'default'}
            className="relative flex h-full flex-col p-6"
          >
            {pack.popular && (
              <div className="absolute -top-3 left-6">
                <Badge variant="primary">En Çok Tercih Edilen</Badge>
              </div>
            )}

            <div className={cn('flex items-center gap-2', pack.popular && 'pt-2')}>
              <Layers className="h-4 w-4 text-accent-foreground" />
              <h3 className="text-sm font-semibold text-foreground-strong">{pack.name}</h3>
            </div>

            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="text-display-md text-foreground-strong">
                {compactTokens(pack.tokens)}
              </span>
              <span className="text-sm text-muted-foreground">token</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatTokens(pack.tokens)} token · ≈ {pack.estimatedArticles.toLocaleString('tr-TR')} blog
            </p>

            <div className="mt-5 flex items-end justify-between gap-3 rounded-lg bg-surface-sunken p-4">
              <div>
                <p className="text-xs text-muted-foreground">Tek seferlik</p>
                <p className="text-2xl font-semibold tabular-nums text-foreground-strong">
                  {formatUsd(pack.priceUsd)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">1M token birim</p>
                <p className="text-sm font-semibold tabular-nums text-foreground-strong">
                  {formatUsd(pack.pricePerMillion)}
                </p>
              </div>
            </div>

            <div className="mt-4 flex-1">
              {pack.savingPct > 0 ? (
                <Badge variant="success">Birim fiyatta %{pack.savingPct} avantaj</Badge>
              ) : (
                <Badge variant="outline">Başlangıç birim fiyatı</Badge>
              )}
            </div>

            {renderAction && <div className="mt-5">{renderAction(pack)}</div>}
          </Card>
        ))}
      </div>

      <p className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <InfinityIcon className="h-4 w-4 text-accent-foreground" />
        Satın alınan tokenların son kullanma tarihi yoktur.
      </p>
    </section>
  );
}
