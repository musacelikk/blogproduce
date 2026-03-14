import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';
import { JobType } from '../../entities/job.entity';

export class CreateJobDto {
  @IsEnum(JobType)
  type: JobType;

  @IsString()
  @IsOptional()
  input?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
