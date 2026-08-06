'use client';

import Link from 'next/link';
import { ArrowRight, CreditCard, Landmark, ShieldCheck, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface TrialCalloutProps {
  trialDays?: number;
  onStartClick?: () => void;
  onContactClick?: () => void;
  className?: string;
}

/** The trial CTA. Same promise everywhere: 7 gün, kredi kartsız. */
export function TrialCallout({
  trialDays = 7,
  onStartClick,
  onContactClick,
  className,
}: TrialCalloutProps) {
  return (
    <Card variant="emphasis" className={cn('overflow-hidden p-8 text-center md:p-12', className)}>
      <Badge variant="primary" className="mb-5">
        <Sparkles className="h-3 w-3" />
        Ücretsiz deneme
      </Badge>
      <h2 className="mx-auto max-w-2xl text-display-md text-foreground-strong">
        {trialDays} gün ücretsiz deneyin, kredi kartı gerekmez.
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
        Kayıt olduğunuz anda deneme planı tanımlanır. Token hakkınızı istediğiniz kalite
        kademesinde harcayın, beğenirseniz bir plan seçip havale/EFT ile devam edin.
      </p>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Button asChild size="xl">
          <Link href="/register" onClick={onStartClick}>
            Ücretsiz Denemeyi Başlat
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="xl">
          <Link href="/contact" onClick={onContactClick}>
            Satış Ekibiyle Görüşün
          </Link>
        </Button>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-accent-foreground" />
          Kredi kartı istemiyoruz
        </span>
        <span className="inline-flex items-center gap-2">
          <Landmark className="h-4 w-4 text-accent-foreground" />
          Ödemeler havale/EFT ile
        </span>
        <span className="inline-flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-accent-foreground" />
          Taahhüt yok, otomatik yenileme yok
        </span>
      </div>
    </Card>
  );
}
