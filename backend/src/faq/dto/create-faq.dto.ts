import { IsString, IsEnum, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';
import { FAQType } from '../../entities/faq.entity';

export class CreateFAQDto {
  @IsEnum(FAQType)
  type: FAQType;

  @IsString()
  question: string;

  @IsString()
  answer: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

