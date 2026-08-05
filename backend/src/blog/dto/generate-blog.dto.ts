import { IsString, IsNotEmpty, IsOptional, MinLength, MaxLength, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SeoOptionsDto {
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}

export class GenerateBlogOptionsDto {
  @ValidateNested()
  @Type(() => SeoOptionsDto)
  @IsOptional()
  seo?: SeoOptionsDto;
}

export class GenerateBlogDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(200)
  topic: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  additionalContext?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  tone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  targetAudience?: string;

  @ValidateNested()
  @Type(() => GenerateBlogOptionsDto)
  @IsOptional()
  options?: GenerateBlogOptionsDto;

  @IsString()
  @IsOptional()
  workspaceId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  language?: string; // ISO code, e.g. 'tr', 'en' (default: 'tr')

  @IsString()
  @IsOptional()
  @MaxLength(20)
  length?: string; // 'short' | 'medium' | 'long' (default: 'medium')

  @IsString()
  @IsOptional()
  @MaxLength(50)
  model?: string; // tier ('standard' | 'pro' | 'premium') or concrete model id
}

