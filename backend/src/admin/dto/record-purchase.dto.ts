import { IsString, IsOptional, IsNumber, IsEnum, Min } from 'class-validator';
import { BillingPeriod } from '../../entities/subscription.entity';
import { PaymentMethod } from '../../entities/payment.entity';

export class RecordPurchaseDto {
  @IsString()
  userId: string;

  @IsString()
  planId: string;

  @IsEnum(BillingPeriod)
  billingPeriod: BillingPeriod;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
