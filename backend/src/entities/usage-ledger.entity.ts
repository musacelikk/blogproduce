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

@Entity('usage_ledger')
@Index(['userId', 'month'], { unique: true })
export class UsageLedger {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 7 })
  month: string; // Format: YYYY-MM (e.g., "2024-12")

  @Column({ name: 'estimated_cost_usd', type: 'decimal', precision: 10, scale: 4, default: 0 })
  estimatedCostUsd: number;

  @Column({ name: 'tokens_in', type: 'bigint', default: 0 })
  tokensIn: number;

  @Column({ name: 'tokens_out', type: 'bigint', default: 0 })
  tokensOut: number;

  @Column({ name: 'request_count', type: 'int', default: 0 })
  requestCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @CreateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

