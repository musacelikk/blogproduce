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

export enum EventType {
  PAGE_VIEW = 'page_view',
  CLICK = 'click',
  FORM_SUBMIT = 'form_submit',
  BUTTON_CLICK = 'button_click',
  LINK_CLICK = 'link_click',
  SEARCH = 'search',
  DOWNLOAD = 'download',
  VIDEO_PLAY = 'video_play',
  VIDEO_PAUSE = 'video_pause',
  CUSTOM = 'custom',
}

@Entity('event_tracking')
@Index(['userId', 'createdAt'])
@Index(['eventType', 'createdAt'])
@Index(['page', 'createdAt'])
export class EventTracking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: EventType })
  eventType: EventType;

  @Column({ type: 'varchar', length: 255 })
  eventName: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  page: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  referrer: string | null;

  @Column({ type: 'jsonb', nullable: true })
  properties: Record<string, any> | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  @Index()
  ipAddress: string | null;

  @Column({ type: 'text', nullable: true })
  userAgent: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  sessionId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

