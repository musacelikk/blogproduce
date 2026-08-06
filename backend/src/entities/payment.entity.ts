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
import { User } from './user.entity';
import { Subscription } from './subscription.entity';
import { PlanDefinition } from './plan-definition.entity';
import { TokenPack } from './token-pack.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  BANK_TRANSFER = 'bank_transfer',
  PAYPAL = 'paypal',
  OTHER = 'other',
}

/**
 * Both the sales ledger and the bank-transfer inbox.
 *
 * We collect by havale/EFT, which has no callback: the customer creates a
 * `pending` row, transfers the amount quoting `referenceCode`, and an admin
 * matches the bank statement and confirms it. Fulfilment (activating the plan or
 * crediting tokens) hangs off that confirmation, never off row creation — a
 * pending row must never grant anything.
 */
@Entity('payments')
@Index(['userId', 'createdAt'])
@Index(['subscriptionId'])
@Index(['status', 'createdAt'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'subscription_id', nullable: true })
  subscriptionId: string | null;

  @ManyToOne(() => Subscription, { nullable: true })
  @JoinColumn({ name: 'subscription_id' })
  subscription: Subscription | null;

  @Column({ name: 'plan_id', nullable: true })
  planId: string | null;

  @ManyToOne(() => PlanDefinition, { nullable: true })
  @JoinColumn({ name: 'plan_id' })
  plan: PlanDefinition | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'TRY' })
  currency: string;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'enum', enum: PaymentMethod, nullable: true })
  paymentMethod: PaymentMethod | null;

  @Column({ name: 'transaction_id', type: 'varchar', length: 255, nullable: true })
  transactionId: string | null;

  @Column({ name: 'external_id', type: 'varchar', length: 255, nullable: true })
  externalId: string | null; // Payment gateway transaction ID

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date | null;

  // ── Bank transfer (havale/EFT) ──────────────────────────────────────────

  /**
   * Short code the customer writes in the transfer description. This is the only
   * link between a bank statement line and an account, so it is unique and uses
   * an alphabet without look-alike characters.
   */
  @Column({ name: 'reference_code', type: 'varchar', length: 32, nullable: true, unique: true })
  referenceCode: string | null;

  /** Set when the purchase is a pay-as-you-go top-up rather than a plan. */
  @Column({ name: 'token_pack_id', type: 'uuid', nullable: true })
  tokenPackId: string | null;

  @ManyToOne(() => TokenPack, { nullable: true })
  @JoinColumn({ name: 'token_pack_id' })
  tokenPack: TokenPack | null;

  /** Tokens to credit on confirmation. Denormalised so catalog edits cannot alter a sold order. */
  @Column({ type: 'bigint', nullable: true })
  tokens: number | null;

  /** 'monthly' | 'yearly' — which price the plan was bought at. */
  @Column({ name: 'billing_period', type: 'varchar', length: 16, nullable: true })
  billingPeriod: string | null;

  /** Admin who confirmed or rejected, for the audit trail. */
  @Column({ name: 'reviewed_by_id', type: 'uuid', nullable: true })
  reviewedById: string | null;

  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

