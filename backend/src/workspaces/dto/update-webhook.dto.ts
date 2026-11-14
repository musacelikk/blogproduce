import { IsArray, IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';
import { IsPublicHttpsUrl } from '../../common/validators/is-public-https-url.validator';
import { WebhookEvent } from '../../entities/webhook.entity';

/**
 * Webhook update.
 *
 * Deliberately a class rather than `Partial<CreateWebhookDto>`: `Partial<T>` is
 * a TypeScript type that erases to `Object` at runtime, so class-validator
 * finds no metadata and validates **nothing**. That is how this path came to
 * accept any URL at all while creation was properly restricted — a webhook
 * could be registered at a public https endpoint and then repointed at
 * 169.254.169.254.
 */
export class UpdateWebhookDto {
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @IsPublicHttpsUrl({ message: 'Webhook URL must point to a public https host' })
  @IsOptional()
  url?: string;

  @IsArray()
  @IsEnum(WebhookEvent, { each: true })
  @IsOptional()
  events?: WebhookEvent[];

  @IsString()
  @IsOptional()
  secret?: string;
}
