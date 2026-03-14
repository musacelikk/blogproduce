import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';
import { JobStatus } from '../../entities/job.entity';

export class UpdateJobDto {
  @IsEnum(JobStatus)
  @IsOptional()
  status?: JobStatus;

  @IsString()
  @IsOptional()
  output?: string;

  @IsString()
  @IsOptional()
  error?: string;
}
