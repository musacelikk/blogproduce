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
import { Post } from './post.entity';

export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('generation_jobs')
@Index(['organizationId', 'projectId'])
@Index(['postId'])
@Index(['status'])
export class GenerationJob {
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

  @Column({ name: 'post_id' })
  postId: string;

  @ManyToOne(() => Post)
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Column({ type: 'enum', enum: JobStatus, default: JobStatus.PENDING })
  status: JobStatus;

  /**
   * Which pipeline stage is running right now, for progress display.
   *
   * Varchar, not an enum: the pipeline's shape depends on the tier (standard
   * skips the editor pass) and on `AI_PIPELINE_MODE`, so the set of values a
   * job can report is a property of configuration, not of the schema.
   */
  @Column({ name: 'stage', type: 'varchar', length: 16, nullable: true })
  stage: string | null;

  @Column({ type: 'jsonb', nullable: true })
  requestData: {
    topic: string;
    language?: string;
    tone?: string;
    keywords?: string[];
    outline?: string;
    length?: string;
    sources?: string[];
    seo?: any;
    options?: any;
    seoMode?: boolean;
    model?: string;
    additionalContext?: string;
    targetAudience?: string;
  } | null;

  @Column({ type: 'text', nullable: true })
  error: string | null;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'processing_time_ms', type: 'integer', nullable: true })
  processingTimeMs: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
