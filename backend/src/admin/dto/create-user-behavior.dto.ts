import { IsEnum, IsOptional, IsString, IsUUID, IsNumber } from 'class-validator';
import { BehaviorType } from '../../entities/user-behavior.entity';

export class CreateUserBehaviorDto {
  @IsEnum(BehaviorType, { message: 'behaviorType must be a valid BehaviorType' })
  behaviorType: BehaviorType;

  @IsUUID('4', { each: false })
  @IsOptional()
  userId?: string | null;

  @IsString()
  @IsOptional()
  page?: string | null;

  @IsString()
  @IsOptional()
  sessionId?: string | null;

  @IsOptional()
  data?: Record<string, any> | null;

  @IsNumber()
  @IsOptional()
  duration?: number | null;

  @IsString()
  @IsOptional()
  ipAddress?: string | null;

  @IsString()
  @IsOptional()
  userAgent?: string | null;
}

