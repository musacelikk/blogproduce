import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Organization } from './organization.entity';
import { Project } from './project.entity';
import * as crypto from 'crypto';

@Entity('api_keys')
@Index(['keyHash'], { unique: true })
@Index(['clientId'], { unique: true })
@Index(['organizationId', 'projectId'])
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'key_hash', unique: true })
  keyHash: string; // SHA-256 hash of the API key (never store plaintext)

  @Column({ name: 'client_id', unique: true })
  clientId: string; // Public identifier (e.g., bg_client_xxxxx)

  @Column({ name: 'client_secret_hash' })
  clientSecretHash: string; // SHA-256 hash of client_secret (for HMAC signing)

  @Column({ name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'project_id' })
  projectId: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ type: 'varchar', nullable: true })
  name: string;

  @Column({ name: 'last_used_at', type: 'timestamp', nullable: true })
  lastUsedAt: Date | null;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @Column({ default: true })
  active: boolean;

  // Rate Limiting & Quota
  @Column({ name: 'requests_per_minute', type: 'int', default: 60, nullable: true })
  requestsPerMinute: number | null; // null = unlimited

  @Column({ name: 'daily_generate_limit', type: 'int', default: 100, nullable: true })
  dailyGenerateLimit: number | null; // null = unlimited

  @Column({ name: 'monthly_token_budget', type: 'bigint', default: 1000000, nullable: true })
  monthlyTokenBudget: number | null; // null = unlimited (in tokens, not USD)

  @Column({ name: 'current_month_tokens_used', type: 'bigint', default: 0 })
  currentMonthTokensUsed: number; // Reset monthly

  @Column({ name: 'current_month_reset_date', type: 'date', nullable: true })
  currentMonthResetDate: Date | null; // Track when to reset monthly budget

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper method to hash API key or secret
  static hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  // Helper method to generate client ID
  static generateClientId(): string {
    const randomBytes = crypto.randomBytes(16);
    return `bg_client_${randomBytes.toString('hex')}`;
  }

  // Helper method to generate client secret
  static generateClientSecret(): string {
    const randomBytes = crypto.randomBytes(32);
    return `bg_secret_${randomBytes.toString('hex')}`;
  }
}

