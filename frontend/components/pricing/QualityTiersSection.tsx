import { Gauge, Layers3, Sparkles, Target } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ModelTier, TierInfo } from '@/lib/api';
import { cn } from '@/lib/utils';
import { SectionHeading } from '@/components/sections/SectionHeading';
import { Card } from '@/components/ui/card';
import { TIER_LABELS, TIER_ORDER, TIER_PITCH } from './plan-model';

const TIER_ICONS: Record<ModelTier, LucideIcon> = {
  standard: Gauge,
  pro: Layers3,
  premium: Sparkles,
};

interface QualityTiersSectionProps {
  tiers: TierInfo[];
  className?: string;
}

/** What Standart / Pro / Premium mean for the buyer — speed against depth. */
export function QualityTiersSection({ tiers, className }: QualityTiersSectionProps) {
  const ordered = TIER_ORDER.map((tier) => tiers.find((t) => t.tier === tier)).filter(
    (t): t is TierInfo => Boolean(t),
  );
  if (ordered.length === 0) return null;

  return (
    <section className={cn('scroll-mt-24', className)} id="kalite-kademeleri">
      <SectionHeading
        align="center"
        size="md"
        eyebrow="Kalite kademeleri"
        title="Her içerik aynı derinliği istemez"
        description="Aynı panelden üç farklı kalite kademesiyle üretim yaparsınız. Hızlı ve ekonomik olandan en derin araştırma yapana kadar; hangi kademelerin açık olduğunu planınız belirler."
      />

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
        {ordered.map((tier) => {
          const Icon = TIER_ICONS[tier.tier];
          const pitch = TIER_PITCH[tier.tier];
          return (
            <Card key={tier.tier} className="flex h-full flex-col p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                <Icon className="h-5 w-5 text-accent-foreground" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground-strong">
                {tier.label || TIER_LABELS[tier.tier]}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {tier.description}
              </p>

              <div className="mt-5 space-y-2.5 rounded-lg bg-surface-sunken p-4">
                <div className="flex items-start gap-2.5">
                  <Gauge className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm text-foreground">{pitch.speed}</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Layers3 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm text-foreground">{pitch.depth}</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Target className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm text-foreground">{pitch.bestFor}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
