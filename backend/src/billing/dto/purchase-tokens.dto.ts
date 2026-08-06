import { IsOptional, IsString, MaxLength } from 'class-validator';

export class PurchaseTokensDto {
  /** Payment provider reference for the captured charge. */
  @IsString()
  @IsOptional()
  @MaxLength(200)
  reference?: string;
}
