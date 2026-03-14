import { IsString, IsUUID, IsOptional, IsEnum, IsArray } from 'class-validator';
import { PostStatus, PostLanguage } from '../../entities/post.entity';

export class CreatePostDto {
  @IsString()
  title: string;

  @IsString()
  slug: string;

  @IsUUID()
  workspaceId: string;

  @IsUUID()
  @IsOptional()
  authorId?: string;

  @IsEnum(PostLanguage)
  @IsOptional()
  language?: PostLanguage;

  @IsEnum(PostStatus)
  @IsOptional()
  status?: PostStatus;

  @IsString()
  @IsOptional()
  excerpt?: string;

  @IsUUID()
  @IsOptional()
  coverImageId?: string;

  @IsString()
  @IsOptional()
  coverImageUrl?: string;

  @IsString()
  @IsOptional()
  coverImageCreditJson?: string; // JSON string

  @IsString()
  @IsOptional()
  canonicalUrl?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsOptional()
  scheduledAt?: Date;
}
