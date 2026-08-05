import { IsString, IsUrl, IsArray, IsEnum, IsOptional } from 'class-validator';
import { IsPublicHttpsUrl } from '../../common/validators/is-public-https-url.validator';
import { WebhookEvent } from '../../entities/webhook.entity';

export class CreateWebhookDto {
  // https-only and public hosts only — an unrestricted URL turns the webhook
  // sender into an SSRF proxy into our own network.
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @IsPublicHttpsUrl({ message: 'Webhook URL must point to a public https host' })
  url: string;

  @IsArray()
  @IsEnum(WebhookEvent, { each: true })
  events: WebhookEvent[];

  @IsString()
  @IsOptional()
  secret?: string;
}

