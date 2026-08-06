import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class GrantTokensDto {
  @IsNumber()
  @Min(1)
  tokens: number;

  /** TRY value of the grant, for reporting. Zero for a goodwill credit. */
  @IsNumber()
  @IsOptional()
  @Min(0)
  amountTry?: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  note?: string;
}
