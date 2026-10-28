import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AutopilotConfig } from './autopilot-config.entity';

export enum TopicIdeaStatus {
  /** Planned and waiting to be picked up by a run. */
  PLANNED = 'planned',
  /** Handed to the generation pipeline; `postId` is set. */
  USED = 'used',
  /** Will not be generated — a duplicate, or it failed to enqueue too often. */
  REJECTED = 'rejected',
}

/**
 * A planned article topic.
 *
 * Topics are produced in **batches** by one cheap LLM call and then consumed one
 * per run. That is the main reason autopilot's planning cost rounds to zero: a
 * per-article planning call would cost more than an order of magnitude more than
 * amortising a single batch across ~25 articles.
 */
@Entity('topic_ideas')
@Index(['configId', 'status'])
export class TopicIdea {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'config_id', type: 'uuid' })
  configId: string;

  @ManyToOne(() => AutopilotConfig, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'config_id' })
  config: AutopilotConfig;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  /** Normalised title, used to deduplicate against existing posts and ideas. */
  @Column({ type: 'varchar', length: 220 })
  slug: string;

  /** The specific angle, so two ideas on one keyword do not become one article twice. */
  @Column({ type: 'text', nullable: true })
  angle: string | null;

  @Column({ name: 'primary_keyword', type: 'varchar', length: 120, nullable: true })
  primaryKeyword: string | null;

  @Column({
    type: 'varchar',
    length: 16,
    default: TopicIdeaStatus.PLANNED,
  })
  status: TopicIdeaStatus;

  @Column({ name: 'post_id', type: 'uuid', nullable: true })
  postId: string | null;

  /**
   * Enqueue attempts. A run that cannot enqueue (quota exhausted, provider down)
   * leaves the idea `planned` so it is retried; after `MAX_ENQUEUE_ATTEMPTS` it
   * is rejected so one poison topic cannot stall the queue forever.
   */
  @Column({ name: 'attempts', type: 'int', default: 0 })
  attempts: number;

  @Column({ name: 'used_at', type: 'timestamp', nullable: true })
  usedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
