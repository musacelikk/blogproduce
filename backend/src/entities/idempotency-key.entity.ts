import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Organization } from './organization.entity';
import { Project } from './project.entity';

@Entity('idempotency_keys')
@Index(['organizationId', 'projectId', 'key'], { unique: true })
@Index(['key'])
export class IdempotencyKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'project_id' })
  projectId: string;

  @Column()
  key: string; // Idempotency-Key header value

  @Column({ type: 'jsonb' })
  requestHash: string; // Hash of request body for validation

  @Column({ type: 'jsonb' })
  response: {
    statusCode: number;
    body: any;
  };

  @Column({ name: 'expires_at' })
  expiresAt: Date; // 24 hours from creation

  @CreateDateColumn()
  createdAt: Date;
}

