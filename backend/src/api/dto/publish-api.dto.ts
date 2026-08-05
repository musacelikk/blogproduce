import { IsUUID, IsOptional, IsString } from 'class-validator';

export class PublishApiDto {
  // Optional here so POST /api/v1/posts/:id:publish can work with an empty body
  // (the controller injects the id from the URL). POST /api/v1/publish still
  // requires it — enforced in ApiService.publish.
  @IsUUID()
  @IsOptional()
  postId?: string;

  @IsString()
  @IsOptional()
  slug?: string;
}

