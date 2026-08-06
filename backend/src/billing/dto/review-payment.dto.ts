import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewPaymentDto {
  /** Bank statement reference, or the reason for a rejection. */
  @IsString()
  @IsOptional()
  @MaxLength(500)
  note?: string;
}
