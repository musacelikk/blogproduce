import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Post } from './post.entity';
import { Asset } from './asset.entity';

@Entity('post_seo')
export class PostSeo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'post_id', unique: true })
  postId: string;

  @OneToOne(() => Post, (post) => post.seo, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Column({ name: 'meta_title', nullable: true })
  metaTitle: string;

  @Column({ name: 'meta_description', type: 'text', nullable: true })
  metaDescription: string;

  @Column({ name: 'og_title', nullable: true })
  ogTitle: string;

  @Column({ name: 'og_description', type: 'text', nullable: true })
  ogDescription: string;

  @Column({ name: 'og_image_id', nullable: true })
  ogImageId: string;

  @ManyToOne(() => Asset, { nullable: true })
  @JoinColumn({ name: 'og_image_id' })
  ogImage: Asset;

  @Column({ nullable: true, default: 'index,follow' })
  robots: string;

  @Column({ name: 'schema_jsonld', type: 'jsonb', nullable: true })
  schemaJsonld: Record<string, any>;
}

