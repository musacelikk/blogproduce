import { IsString, IsOptional, MinLength, IsUrl } from 'class-validator';

export class CreateWorkspaceDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsUrl({}, { message: 'Site URL must be a valid URL' })
  @IsOptional()
  siteUrl?: string;
}
