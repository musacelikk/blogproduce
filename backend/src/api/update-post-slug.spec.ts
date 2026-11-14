import { validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdatePostApiDto } from './dto/update-post-api.dto';

/**
 * `slug` was `@IsString()` with nothing else, so any string reached
 * `post.slug`. It then travels into URLs, a WordPress `post_name` and
 * customers' own routing — markup and traversal sequences alike.
 */
function rejects(slug: string): boolean {
  return validateSync(plainToInstance(UpdatePostApiDto, { slug }), { whitelist: true }).length > 0;
}

describe('UpdatePostApiDto slug', () => {
  it.each([
    ['markup', '"><script>alert(1)</script>'],
    ['path traversal', '../../etc/passwd'],
    ['spaces and ampersand', 'Büyük Harf & Boşluk'],
    ['uppercase', 'Not-Lowercase'],
    ['leading hyphen', '-leading'],
    ['trailing hyphen', 'trailing-'],
    ['double hyphen', 'double--hyphen'],
    ['url', 'https://evil.example/x'],
  ])('rejects %s', (_label, slug) => {
    expect(rejects(slug)).toBe(true);
  });

  it.each(['normal-slug', 'seo-uyumlu-urun-aciklamasi-rehberi', 'tek', 'a1-b2-c3'])(
    'accepts %s',
    (slug) => {
      expect(rejects(slug)).toBe(false);
    },
  );

  it('stays optional — a partial update need not send it', () => {
    expect(
      validateSync(plainToInstance(UpdatePostApiDto, { title: 'x' }), { whitelist: true }),
    ).toHaveLength(0);
  });
});
