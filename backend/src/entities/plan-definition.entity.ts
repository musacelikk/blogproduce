import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PlanLevel {
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
    maxTokensPerMonth: number | 'unlimited';
    maxWorkspaces: number | 'unlimited';
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

  @Column({ default: true })
  active: boolean;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

