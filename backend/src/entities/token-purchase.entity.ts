import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { TokenPack } from './token-pack.entity';

export enum TokenPurchaseStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  REFUNDED = 'refunded',
}

/** Immutable ledger of top-up purchases — the audit trail behind `users.token_balance`. */
@Entity('token_purchases')
@Index(['userId', 'createdAt'])
export class TokenPurchase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'token_pack_id', type: 'uuid', nullable: true })
  tokenPackId: string | null;

  @ManyToOne(() => TokenPack, { nullable: true })
  @JoinColumn({ name: 'token_pack_id' })
  tokenPack: TokenPack | null;

  /** Denormalised so historical rows survive catalog edits. */
  @Column({ type: 'bigint' })
  tokens: number;

  /** TRY — what the customer actually paid. */
  @Column({ name: 'amount_try', type: 'decimal', precision: 12, scale: 2 })
  amountTry: number;

  /** Historical USD amount from before the TRY switch. */
  @Column({ name: 'amount_usd', type: 'decimal', precision: 10, scale: 2, nullable: true })
  amountUsd: number | null;

  @Column({
    type: 'enum',
    enum: TokenPurchaseStatus,
    default: TokenPurchaseStatus.COMPLETED,
  })
  status: TokenPurchaseStatus;

  /** Free-form: payment provider reference, or an admin note for manual grants. */
  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
