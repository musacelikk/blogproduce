import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Post } from './post.entity';

export enum ContentEditor {
  AI = 'ai',
  HUMAN = 'human',
  SYSTEM = 'system',
}

export enum ContentFormat {
  MD = 'md',
  HTML = 'html',
  JSON = 'json',
}

@Entity('post_revisions')
@Index(['postId', 'version'], { unique: true })
export class PostRevision {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'post_id' })
  postId: string;

  @ManyToOne(() => Post, (post) => post.revisions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Column({ type: 'int' })
  version: number;

  @Column({ type: 'enum', enum: ContentEditor, default: ContentEditor.HUMAN })
  editor: ContentEditor;

  @Column({ name: 'content_format', type: 'enum', enum: ContentFormat, default: ContentFormat.MD })
  contentFormat: ContentFormat;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'content_hash', nullable: true })
  contentHash: string;

  @Column({ name: 'prompt_id', nullable: true })
  promptId: string;

  @Column({ nullable: true })
  model: string;

  @Column({ name: 'tokens_in', type: 'int', nullable: true })
  tokensIn: number;

  @Column({ name: 'tokens_out', type: 'int', nullable: true })
  tokensOut: number;

  @Column({ type: 'text', nullable: true })
  instructions: string;

  @Column({ name: 'input_prompt', type: 'text', nullable: true })
  inputPrompt: string;

  @Column({ name: 'latency_ms', type: 'int', nullable: true })
  latencyMs: number;

  @Column({ nullable: true })
  provider: string;

  @Column({ name: 'response_id', nullable: true })
  responseId: string;

  @CreateDateColumn()
  createdAt: Date;
}

