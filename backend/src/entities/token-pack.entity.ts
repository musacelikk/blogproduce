import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Pay-as-you-go top-up catalog. Purchased tokens are added to
 * `users.token_balance` and spent only after the monthly plan allowance
 * is exhausted, so a top-up is never "wasted" on a light month.
 */
@Entity('token_packs')
export class TokenPack {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Stable identifier used by the seeder to upsert (e.g. 'topup-1m'). */
  @Column({ unique: true })
  key: string;

  @Column()
  name: string;

  @Column({ type: 'bigint' })
  tokens: number;

  @Column({ name: 'price_usd', type: 'decimal', precision: 10, scale: 2 })
  priceUsd: number;

  @Column({ default: false })
  popular: boolean;

  @Column({ default: true })
  active: boolean;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
