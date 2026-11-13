import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** Site creation over the partner API. The workspace comes from the API key. */
export class CreateSiteApiDto {
  @IsString()
  @MinLength(1, { message: 'Site adı gerekli' })
  @MaxLength(200, { message: 'Site adı en fazla 200 karakter olabilir' })
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(253, { message: 'Alan adı en fazla 253 karakter olabilir' })
  domain?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000, { message: 'Açıklama en fazla 1000 karakter olabilir' })
  description?: string;
}
