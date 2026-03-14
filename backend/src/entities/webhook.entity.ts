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

export enum WebhookEvent {
  POST_GENERATED = 'post.generated',
  POST_PUBLISHED = 'post.published',
  POST_UPDATED = 'post.updated',
}

@Entity('webhooks')
@Index(['organizationId', 'projectId'])
@Index(['workspaceId']) // Legacy support
export class Webhook {
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

  @Column({ name: 'workspace_id', type: 'uuid', nullable: true })
  workspaceId: string | null; // Legacy field for backward compatibility

  @Column()
  url: string;

  @Column({ type: 'simple-array', default: '' })
  events: WebhookEvent[];

  @Column({ name: 'secret', type: 'varchar', nullable: true })
  secret: string | null;

  @Column({ default: true })
  active: boolean;

  @Column({ name: 'last_triggered_at', type: 'timestamp', nullable: true })
  lastTriggeredAt: Date | null;

  @Column({ name: 'failure_count', default: 0 })
  failureCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

