import { getPricingData } from '@/components/pricing/pricing-data';
import { PricingSectionClient } from './PricingSectionClient';

export async function PricingSection() {
  const { plans } = await getPricingData();

  return <PricingSectionClient plans={plans} />;
}
