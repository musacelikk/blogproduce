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

export enum BehaviorType {
  SESSION_START = 'session_start',
  SESSION_END = 'session_end',
  PAGE_VIEW = 'page_view',
  TIME_ON_PAGE = 'time_on_page',
  SCROLL_DEPTH = 'scroll_depth',
  MOUSE_MOVEMENT = 'mouse_movement',
  KEYSTROKE = 'keystroke',
  FORM_INTERACTION = 'form_interaction',
  ERROR = 'error',
  CUSTOM = 'custom',
}

@Entity('user_behaviors')
@Index(['userId', 'createdAt'])
@Index(['behaviorType', 'createdAt'])
@Index(['sessionId', 'createdAt'])
export class UserBehavior {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: BehaviorType })
  behaviorType: BehaviorType;

  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  page: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @Index()
  sessionId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, any> | null;

  @Column({ type: 'integer', nullable: true })
  duration: number | null; // milliseconds

  @Column({ type: 'varchar', length: 45, nullable: true })
  @Index()
  ipAddress: string | null;

  @Column({ type: 'text', nullable: true })
  userAgent: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

