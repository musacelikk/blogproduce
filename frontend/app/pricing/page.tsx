import { getPublicPlans, PlanDefinition } from '@/lib/api';
import { PricingPageClient } from './PricingPageClient';

export const revalidate = 60;

export default async function PricingPage() {
  let plans: PlanDefinition[] = [];
  
  try {
    plans = await getPublicPlans();
  } catch (error) {
    console.error('Failed to fetch plans:', error);
    // Fallback to empty array if fetch fails
  }

  // Sort plans by monthly price (ascending - cheapest first)
  const sortedPlans = [...plans].sort((a, b) => {
    const priceA = a.price?.monthly || 0;
    const priceB = b.price?.monthly || 0;
    return priceA - priceB;
  });

  return <PricingPageClient plans={sortedPlans} />;
}
