import {
  getModelTiers,
  getPublicPlans,
  getTokenPacks,
  type PlanDefinition,
  type TierInfo,
  type TokenPack,
} from '@/lib/api';
import { FALLBACK_TIERS } from './plan-model';

export interface PricingData {
  plans: PlanDefinition[];
  packs: TokenPack[];
  tiers: TierInfo[];
}

/**
 * Everything the public pricing surfaces need, in one server-side call.
 * The API is regularly unreachable during `next build`, so each source falls
 * back to something renderable instead of failing the page.
 */
export async function getPricingData(): Promise<PricingData> {
  const [plans, packs, tiers] = await Promise.all([
    getPublicPlans().catch(() => [] as PlanDefinition[]),
    getTokenPacks().catch(() => [] as TokenPack[]),
    getModelTiers().catch(() => [] as TierInfo[]),
  ]);

  return {
    plans,
    packs: packs.filter((pack) => pack.active !== false),
    tiers: tiers.length > 0 ? tiers : FALLBACK_TIERS,
  };
}
