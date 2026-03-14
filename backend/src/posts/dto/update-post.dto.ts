import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { CreatePostDto } from './create-post.dto';
import { ContentFormat } from '../../entities/post-revision.entity';

export class UpdatePostDto extends PartialType(CreatePostDto) {
  @IsString()
  @IsOptional()
  content?: string;

  @IsEnum(ContentFormat)
  @IsOptional()
  contentFormat?: ContentFormat;
}
