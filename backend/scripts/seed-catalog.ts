/**
 * Seeds (and re-syncs) the commercial catalog: subscription plans and
 * pay-as-you-go token packs.
 *
 *   npm run seed:catalog
 *
 * Upserts by `key`, so it is safe to re-run after editing the blueprints in
 * src/billing/plan-catalog.ts. Prices edited in the admin panel are overwritten
 * by a re-run — treat the blueprints as the source of truth.
 */
import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { PlanDefinition, PlanLevel } from '../src/entities/plan-definition.entity';
import { TokenPack } from '../src/entities/token-pack.entity';
import {
  PLAN_BLUEPRINTS,
  TOKEN_PACK_BLUEPRINTS,
  estimatedArticles,
  planCostAtFullUsageUsd,
  planGrossMarginPct,
} from '../src/billing/plan-catalog';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });

  const plans: Repository<PlanDefinition> = app.get(getRepositoryToken(PlanDefinition));
  const packs: Repository<TokenPack> = app.get(getRepositoryToken(TokenPack));

  console.log('\n── Planlar ──────────────────────────────────────────────');
  for (const blueprint of PLAN_BLUEPRINTS) {
    const existing =
      (await plans.findOne({ where: { key: blueprint.key } })) ??
      (await plans.findOne({ where: { level: blueprint.level as PlanLevel } }));

    const payload: Partial<PlanDefinition> = {
      key: blueprint.key,
      name: blueprint.name,
      level: blueprint.level as PlanLevel,
      description: blueprint.description,
      price: blueprint.price,
      popular: blueprint.popular,
      active: true,
      trialDays: blueprint.trialDays ?? null,
      features: {
        maxBlogs: estimatedArticles(blueprint.tokenAllowance, blueprint.defaultTier),
        maxTokensPerMonth: blueprint.tokenAllowance,
        maxWorkspaces: blueprint.maxWorkspaces,
        allowedTiers: blueprint.allowedTiers,
        defaultTier: blueprint.defaultTier,
        ...blueprint.features,
      },
    };

    if (existing) {
      await plans.update(existing.id, payload);
      console.log(`  güncellendi  ${blueprint.name}`);
    } else {
      await plans.save(plans.create(payload));
      console.log(`  oluşturuldu  ${blueprint.name}`);
    }

    const cost = planCostAtFullUsageUsd(blueprint);
    const margin = planGrossMarginPct(blueprint);
    console.log(
      `               $${blueprint.price.monthly}/ay · ${blueprint.tokenAllowance.toLocaleString('tr-TR')} token` +
        ` · ≈${estimatedArticles(blueprint.tokenAllowance, blueprint.defaultTier)} blog` +
        ` · maliyet $${cost.toFixed(2)} · marj %${margin.toFixed(0)}`,
    );
  }

  console.log('\n── Token paketleri ──────────────────────────────────────');
  for (const [index, blueprint] of TOKEN_PACK_BLUEPRINTS.entries()) {
    const existing = await packs.findOne({ where: { key: blueprint.key } });
    const payload: Partial<TokenPack> = {
      key: blueprint.key,
      name: blueprint.name,
      tokens: blueprint.tokens,
      priceUsd: blueprint.priceUsd,
      popular: blueprint.popular,
      active: true,
      sortOrder: index,
    };

    if (existing) {
      await packs.update(existing.id, payload);
      console.log(`  güncellendi  ${blueprint.name} — $${blueprint.priceUsd}`);
    } else {
      await packs.save(packs.create(payload));
      console.log(`  oluşturuldu  ${blueprint.name} — $${blueprint.priceUsd}`);
    }
  }

  console.log('\nKatalog güncellendi.\n');
  await app.close();
}

run().catch((error) => {
  console.error('Katalog seed edilemedi:', error);
  process.exit(1);
});
