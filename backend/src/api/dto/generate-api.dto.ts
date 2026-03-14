import { IsString, IsOptional, IsEnum, IsBoolean, MaxLength, MinLength, IsObject, IsArray } from 'class-validator';
import { PostLanguage } from '../../entities/post.entity';
import { ContentFormat } from '../../entities/post-revision.entity';

export class SeoOptionsDto {
  @IsString()
  @IsOptional()
  metaDescription?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keywords?: string[];

  @IsString()
  @IsOptional()
  canonicalUrl?: string;

  @IsObject()
  @IsOptional()
  schema?: Record<string, any>; // JSON-LD schema
}

export class GenerateOptionsDto {
  @IsBoolean()
  @IsOptional()
  images?: boolean;

  @IsBoolean()
  @IsOptional()
  faq?: boolean;

  @IsBoolean()
  @IsOptional()
  schema?: boolean;
}

export class GenerateApiDto {
  @IsString()
  @MinLength(5, { message: 'Konu en az 5 karakter olmalı' })
  @MaxLength(200, { message: 'Konu en fazla 200 karakter olabilir' })
  topic: string;

  @IsEnum(PostLanguage)
  @IsOptional()
  language?: PostLanguage;

  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Ton en fazla 100 karakter olabilir' })
  tone?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keywords?: string[];

  @IsString()
  @IsOptional()
  outline?: string;

  @IsString()
  @IsOptional()
  length?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  sources?: string[];

  @IsObject()
  @IsOptional()
  seo?: SeoOptionsDto;

  @IsObject()
  @IsOptional()
  options?: GenerateOptionsDto;

  // Legacy fields (backward compatibility)
  @IsBoolean()
  @IsOptional()
  seoMode?: boolean;

  @IsString()
  @IsOptional()
  model?: string; // 'gpt-4o-mini' | 'gpt-4.1-mini' | 'gpt-4.1'

  @IsString()
  @IsOptional()
  @MaxLength(1000, { message: 'Ek bağlam en fazla 1000 karakter olabilir' })
  additionalContext?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Hedef kitle en fazla 100 karakter olabilir' })
  targetAudience?: string;

  @IsEnum(ContentFormat)
  @IsOptional()
  format?: ContentFormat;

  @IsString()
  @IsOptional()
  coverImageUrl?: string;

  @IsString()
  @IsOptional()
  coverImageCreditJson?: string; // JSON string
}

