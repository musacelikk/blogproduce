import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdatePostApiDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  excerpt?: string;

  @IsString()
  @IsOptional()
  content?: string;

  /**
   * Constrained to the shape `toSlug()` produces. A slug reaches URLs, a
   * WordPress `post_name` and customers' own routing, so accepting free text
   * here let `"><script>` and `../../etc/passwd` through to all of them.
   */
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug yalnızca küçük harf, rakam ve tire içerebilir',
  })
  @MaxLength(220, { message: 'Slug en fazla 220 karakter olabilir' })
  @IsOptional()
  slug?: string;
}
