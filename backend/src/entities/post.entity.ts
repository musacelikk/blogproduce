import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  OneToMany,
  ManyToMany,
  JoinColumn,
  JoinTable,
  Index,
} from 'typeorm';
import { Workspace } from './workspace.entity';
import { Organization } from './organization.entity';
import { Project } from './project.entity';
import { User } from './user.entity';
import { PostRevision } from './post-revision.entity';
import { PostSeo } from './post-seo.entity';
import { PostAsset } from './post-asset.entity';
import { Tag } from './tag.entity';
import { Asset } from './asset.entity';

export enum PostStatus {
  DRAFT = 'draft',
  REVIEW = 'review',
  SCHEDULED = 'scheduled',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  QUEUED = 'queued',
  GENERATING = 'generating',
  GENERATED = 'generated',
  FAILED = 'failed',
}

export enum PostLanguage {
  TR = 'tr',
  EN = 'en',
}

@Entity('posts')
// Unique index only applies when both organizationId and projectId are not null
@Index(['organizationId', 'projectId', 'slug'], { unique: true, where: '"organization_id" IS NOT NULL AND "project_id" IS NOT NULL' })
@Index(['organizationId', 'projectId'])
@Index(['organizationId'])
@Index(['projectId'])
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId: string | null; // Nullable during migration from workspace-based to multi-tenant

  @ManyToOne(() => Organization, { nullable: true })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization | null;

  @Column({ name: 'project_id', type: 'uuid', nullable: true })
  projectId: string | null; // Nullable during migration from workspace-based to multi-tenant

  @ManyToOne(() => Project, { nullable: true })
  @JoinColumn({ name: 'project_id' })
  project: Project | null;

  // Keep workspace for backward compatibility during migration
  @Column({ name: 'workspace_id', nullable: true })
  workspaceId: string | null;

  @ManyToOne(() => Workspace, { nullable: true })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace | null;

  @Column({ name: 'author_id', nullable: true })
  authorId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column({ type: 'enum', enum: PostLanguage, default: PostLanguage.TR })
  language: PostLanguage;

  @Column({ type: 'enum', enum: PostStatus, default: PostStatus.DRAFT })
  status: PostStatus;

  @Column()
  title: string;

  @Column({ unique: false })
  slug: string;

  @Column({ type: 'text', nullable: true })
  excerpt: string;

  @Column({ name: 'cover_image_id', nullable: true })
  coverImageId: string;

  @ManyToOne(() => Asset, { nullable: true })
  @JoinColumn({ name: 'cover_image_id' })
  coverImage: Asset;

  @Column({ name: 'cover_image_url', type: 'text', nullable: true })
  coverImageUrl: string;

  @Column({ name: 'cover_image_credit_json', type: 'jsonb', nullable: true })
  coverImageCreditJson: {
    name: string;
    photographerUrl: string;
    photoUrl: string;
  } | null;

  @Column({ name: 'canonical_url', nullable: true })
  canonicalUrl: string;

  @Column({ name: 'published_at', type: 'timestamp', nullable: true })
  publishedAt: Date | null;

  @Column({ name: 'scheduled_at', type: 'timestamp', nullable: true })
  scheduledAt: Date | null;

  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError: string | null;

  @Column({ name: 'hidden_by_admin', type: 'boolean', default: false })
  hiddenByAdmin: boolean;

  @Column({ name: 'hidden_at', type: 'timestamp', nullable: true })
  hiddenAt: Date | null;

  @Column({ name: 'hidden_reason', type: 'text', nullable: true })
  hiddenReason: string | null;

  @OneToMany(() => PostRevision, (revision) => revision.post)
  revisions: PostRevision[];

  @OneToOne(() => PostSeo, (seo) => seo.post, { cascade: true })
  seo: PostSeo;

  @ManyToMany(() => Tag, (tag) => tag.posts)
  @JoinTable({
    name: 'post_tags',
    joinColumn: { name: 'post_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags: Tag[];

  @OneToMany(() => PostAsset, (postAsset) => postAsset.post)
  postAssets: PostAsset[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
