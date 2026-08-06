import { getPricingData } from '@/components/pricing/pricing-data';
import { PricingPageClient } from './PricingPageClient';

export const revalidate = 60;

export default async function PricingPage() {
  const { plans, packs, tiers } = await getPricingData();

  return <PricingPageClient plans={plans} packs={packs} tiers={tiers} />;
}
