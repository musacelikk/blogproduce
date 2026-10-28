import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PostLanguage } from '../../entities/post.entity';

/**
 * Partial update: every field is optional and only applied when present, so the
 * dashboard can PATCH one toggle without resending the whole config.
 */
export class UpsertAutopilotConfigDto {
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  /**
   * Upper bound is 14 (twice daily). Beyond that the cadence stops being an
   * editorial calendar and becomes a way to burn a plan's allowance in a day.
   */
  @IsInt()
  @Min(1)
  @Max(14)
  @IsOptional()
  postsPerWeek?: number;

  @IsInt()
  @Min(1)
  @Max(200)
  @IsOptional()
  maxPostsPerMonth?: number;

  /** Tier name or alias — validated through `normalizeTier()` in the service. */
  @IsString()
  @IsOptional()
  @MaxLength(32)
  tier?: string;

  @IsEnum(PostLanguage)
  @IsOptional()
  language?: PostLanguage;

  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Ton en fazla 100 karakter olabilir' })
  tone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(32)
  length?: string;

  @IsBoolean()
  @IsOptional()
  seoMode?: boolean;

  @IsBoolean()
  @IsOptional()
  autoPublish?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Alan tanımı en fazla 500 karakter olabilir' })
  niche?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Hedef kitle en fazla 500 karakter olabilir' })
  targetAudience?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000, { message: 'Anahtar kelimeler en fazla 1000 karakter olabilir' })
  keywords?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000, { message: 'Hariç tutulan konular en fazla 1000 karakter olabilir' })
  excludedTopics?: string;
}
