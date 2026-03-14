import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPublicPlans, PlanDefinition } from '@/lib/api';
import { PricingSectionClient } from './PricingSectionClient';

type PlanLevel = 'starter' | 'pro' | 'enterprise';

interface PricingFeature {
  name: string;
  included: PlanLevel | 'all';
}

function shouldShowCheck(
  included: PricingFeature['included'],
  level: PlanLevel,
): boolean {
  if (included === 'all') return true;
  if (included === 'enterprise' && level === 'enterprise') return true;
  if (included === 'pro' && (level === 'pro' || level === 'enterprise'))
    return true;
  if (included === 'starter') return true;
  return false;
}

function formatPlanFeatures(plan: PlanDefinition): PricingFeature[] {
  const features: PricingFeature[] = [];

  // Blog features
  if (plan.features.maxBlogs === 'unlimited') {
    features.push({ name: 'Sınırsız blog içeriği üretebilir', included: plan.level });
  } else if (typeof plan.features.maxBlogs === 'number') {
    features.push({ 
      name: `Ayda ${plan.features.maxBlogs.toLocaleString('tr-TR')} blog içeriği üretebilir`, 
      included: plan.level 
    });
  }

  // Token features
  if (plan.features.maxTokensPerMonth === 'unlimited') {
    features.push({ name: 'Sınırsız token kullanabilir', included: plan.level });
  } else if (typeof plan.features.maxTokensPerMonth === 'number') {
    features.push({ 
      name: `Ayda ${plan.features.maxTokensPerMonth.toLocaleString('tr-TR')} token kullanabilir`, 
      included: plan.level 
    });
  }

  // Workspace features
  if (plan.features.maxWorkspaces === 'unlimited') {
    features.push({ name: 'Sınırsız workspace oluşturabilir', included: plan.level });
  } else if (typeof plan.features.maxWorkspaces === 'number') {
    features.push({ 
      name: `${plan.features.maxWorkspaces} workspace oluşturabilir`, 
      included: plan.level 
    });
  }

  // Language support
  if (plan.features.languages && plan.features.languages.length > 0) {
    if (plan.features.languages.length > 10) {
      features.push({ name: 'Çok dilli destek (50+ dil)', included: plan.level });
    } else {
      features.push({ 
        name: `${plan.features.languages.length} dil desteği`, 
        included: plan.level 
      });
    }
  }

  // Support
  if (plan.features.support) {
    features.push({ name: plan.features.support, included: plan.level });
  }

  // API Access
  if (plan.features.apiAccess) {
    features.push({ name: 'RESTful API erişimi', included: 'all' });
  }

  // Webhook
  if (plan.features.webhookAccess) {
    features.push({ name: 'Webhook entegrasyonları', included: plan.level });
  }

  // Custom Training
  if (plan.features.customTraining) {
    features.push({ name: 'Özel AI model eğitimi', included: plan.level });
  }

  // Account Manager
  if (plan.features.accountManager) {
    features.push({ name: 'Özel hesap yöneticisi', included: plan.level });
  }

  // Priority Support
  if (plan.features.prioritySupport) {
    features.push({ name: 'Öncelikli destek', included: plan.level });
  }

  // Custom Branding
  if (plan.features.customBranding) {
    features.push({ name: 'Özel marka uyumu', included: plan.level });
  }

  // Advanced SEO
  if (plan.features.advancedSeo) {
    features.push({ name: 'Gelişmiş SEO optimizasyonu', included: plan.level });
  } else {
    features.push({ name: 'Temel SEO optimizasyonu', included: plan.level });
  }

  // Analytics
  if (plan.features.analytics) {
    features.push({ name: 'Gelişmiş Analytics', included: plan.level });
  }

  return features;
}

export async function PricingSection() {
  let plans: PlanDefinition[] = [];
  
  try {
    plans = await getPublicPlans();
  } catch (error) {
    console.error('Failed to fetch plans:', error);
    // Fallback to empty array if fetch fails
  }

  // Sort plans by price (cheapest first) so en ucuz solda
  const sortedPlans = [...plans].sort((a, b) => {
    const priceA = a.price?.monthly || 0;
    const priceB = b.price?.monthly || 0;
    return priceA - priceB;
  });

  // Generate features list from all plans
  const allFeatures: PricingFeature[] = [];
  const featureMap = new Map<string, PricingFeature>();

  sortedPlans.forEach((plan) => {
    const planFeatures = formatPlanFeatures(plan);
    planFeatures.forEach((feature) => {
      const key = feature.name;
      if (!featureMap.has(key)) {
        featureMap.set(key, feature);
      } else {
        const existing = featureMap.get(key)!;
        // If feature is in multiple plans, mark as 'all' or upgrade to higher level
        if (existing.included !== 'all') {
          if (existing.included === 'starter' && feature.included !== 'starter') {
            featureMap.set(key, feature);
          } else if (existing.included === 'pro' && feature.included === 'enterprise') {
            featureMap.set(key, feature);
          }
        }
      }
    });
  });

  allFeatures.push(...Array.from(featureMap.values()));

  return (
    <PricingSectionClient plans={sortedPlans} features={allFeatures} />
  );
}
