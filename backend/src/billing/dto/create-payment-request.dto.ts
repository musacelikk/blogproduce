import { IsBoolean, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreatePaymentRequestDto {
  @IsIn(['plan', 'token_pack'])
  type: 'plan' | 'token_pack';

  /** Required when type is 'plan'. */
  @IsString()
  @IsOptional()
  @MaxLength(64)
  planKey?: string;

  /** Required when type is 'token_pack'. */
  @IsUUID()
  @IsOptional()
  packId?: string;

  /** Plans only: buy the yearly price instead of the monthly one. */
  @IsBoolean()
  @IsOptional()
  yearly?: boolean;
}
