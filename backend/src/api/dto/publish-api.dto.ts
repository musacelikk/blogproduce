import { IsUUID, IsOptional, IsString } from 'class-validator';

export class PublishApiDto {
  @IsUUID()
  postId: string;

  @IsString()
  @IsOptional()
  slug?: string;
}

