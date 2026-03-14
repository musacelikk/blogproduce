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

export enum ActivityType {
  USER = 'user',
  BLOG = 'blog',
  SYSTEM = 'system',
  AUTH = 'auth',
}

export enum ActivitySeverity {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

@Entity('activity_logs')
@Index(['userId', 'createdAt'])
@Index(['type', 'createdAt'])
@Index(['severity', 'createdAt'])
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ActivityType })
  type: ActivityType;

  @Column({ type: 'varchar', length: 255 })
  action: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  targetType: string | null;

  @Column({ type: 'uuid', nullable: true })
  targetId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  targetName: string | null;

  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, any> | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  @Index()
  ipAddress: string | null;

  @Column({ type: 'text', nullable: true })
  userAgent: string | null;

  @Column({ type: 'enum', enum: ActivitySeverity, default: ActivitySeverity.INFO })
  severity: ActivitySeverity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

