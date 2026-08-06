import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class GrantTokensDto {
  @IsNumber()
  @Min(1)
  tokens: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  amountUsd?: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  note?: string;
}
