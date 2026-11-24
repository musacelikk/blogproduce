import {
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  IsBoolean,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PostLanguage } from '../../entities/post.entity';
import { ContentFormat } from '../../entities/post-revision.entity';

export class GeneratePostDto {
  @IsUUID()
  workspaceId: string;

  @IsEnum(PostLanguage)
  @IsOptional()
  language?: PostLanguage;

  @IsString()
  @MinLength(5, { message: 'Konu en az 5 karakter olmalı' })
  @MaxLength(200, { message: 'Konu en fazla 200 karakter olabilir' })
  topic: string;

  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Ton en fazla 100 karakter olabilir' })
  tone?: string;

  @IsString()
  @IsOptional()
  length?: string;

  @IsBoolean()
  @IsOptional()
  seoMode?: boolean;

  @IsString()
  @IsOptional()
  model?: string; // tier ('standard'|'pro'|'premium' / 'ucuz'|'orta'|'pahalı') or concrete model id (gpt-4.1-mini, gpt-4.1, claude-opus-5)

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

  @IsUUID()
  @IsOptional()
  targetId?: string;
}
