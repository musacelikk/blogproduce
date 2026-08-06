import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PlanLevel {
  /** 7-day free trial granted at registration. */
  TRIAL = 'trial',
  STARTER = 'starter',
  PROFESSIONAL = 'pro',
  ENTERPRISE = 'enterprise',
}

@Entity('plan_definitions')
export class PlanDefinition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: PlanLevel })
  level: PlanLevel;

  @Column({ type: 'jsonb' })
  price: {
    monthly: number;
    yearly: number;
  };

  @Column({ type: 'jsonb' })
  features: {
    maxBlogs: number | 'unlimited';
    /** Monthly token allowance; resets each calendar month. */
    maxTokensPerMonth: number | 'unlimited';
    maxWorkspaces: number | 'unlimited';
    /** Model tiers this plan may generate with ('standard' | 'pro' | 'premium'). */
    allowedTiers?: string[];
    /** Tier used when the caller does not name one. */
    defaultTier?: string;
    languages: string[];
    support: string;
    apiAccess: boolean;
    customTraining: boolean;
    accountManager: boolean;
    prioritySupport: boolean;
    webhookAccess: boolean;
    customBranding: boolean;
    advancedSeo: boolean;
    analytics: boolean;
  };

  @Column({ default: false })
  popular: boolean;

  /** Stable identifier used to upsert from the seed catalog. */
  @Column({ type: 'varchar', nullable: true, unique: true })
  key: string | null;

  /** Free-trial length in days. Only set on the trial plan. */
  @Column({ name: 'trial_days', type: 'int', nullable: true })
  trialDays: number | null;

  @Column({ default: true })
  active: boolean;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

