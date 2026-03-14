import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiKey } from './api-key.entity';

@Entity('api_key_rate_limits')
@Index(['apiKeyId', 'windowStart'], { unique: true })
@Index(['apiKeyId', 'date'])
export class ApiKeyRateLimit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'api_key_id' })
  apiKeyId: string;

  @ManyToOne(() => ApiKey)
  @JoinColumn({ name: 'api_key_id' })
  apiKey: ApiKey;

  // For RPM tracking: windowStart is the minute timestamp
  @Column({ name: 'window_start', type: 'timestamp' })
  windowStart: Date;

  // For daily tracking: date is YYYY-MM-DD
  @Column({ type: 'date' })
  date: Date;

  @Column({ name: 'request_count', type: 'int', default: 0 })
  requestCount: number;

  @Column({ name: 'generate_count', type: 'int', default: 0 })
  generateCount: number; // Separate counter for generate requests

  @CreateDateColumn()
  createdAt: Date;
}

