import { IsString, IsUrl, IsArray, IsEnum, IsOptional } from 'class-validator';
import { WebhookEvent } from '../../entities/webhook.entity';

export class CreateWebhookDto {
  @IsUrl()
  url: string;

  @IsArray()
  @IsEnum(WebhookEvent, { each: true })
  events: WebhookEvent[];

  @IsString()
  @IsOptional()
  secret?: string;
}

