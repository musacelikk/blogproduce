import { IsIn, IsNumber, IsOptional, Min } from 'class-validator';

export class ProjectPlanDto {
  @IsNumber()
  @Min(1)
  tokenAllowance: number;

  @IsNumber()
  @Min(0)
  monthlyPrice: number;

  @IsIn(['standard', 'pro', 'premium'])
  @IsOptional()
  tier?: string;
}
