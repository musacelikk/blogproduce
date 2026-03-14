import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Organization } from './organization.entity';
import { Project } from './project.entity';
import { Post } from './post.entity';

export enum UsageEventType {
  POST_GENERATED = 'post.generated',
  POST_PUBLISHED = 'post.published',
  API_CALL = 'api.call',
  STORAGE_USED = 'storage.used',
}

@Entity('usage_events')
@Index(['organizationId', 'projectId'])
@Index(['organizationId', 'createdAt'])
@Index(['eventType', 'createdAt'])
export class UsageEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @Column({ name: 'post_id', type: 'uuid', nullable: true })
  postId: string | null;

  @ManyToOne(() => Post, { nullable: true })
  @JoinColumn({ name: 'post_id' })
  post: Post | null;

  @Column({ type: 'enum', enum: UsageEventType })
  eventType: UsageEventType;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    [key: string]: any;
  } | null;

  @Column({ name: 'tokens_used', type: 'integer', nullable: true })
  tokensUsed: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cost: number | null;

  @Column({ type: 'jsonb', nullable: true })
  details: {
    [key: string]: any;
  } | null;

  @Column({ type: 'integer', nullable: true })
  units: number | null;

  @CreateDateColumn()
  createdAt: Date;
}

