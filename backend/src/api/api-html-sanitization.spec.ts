import { HtmlSanitizerService } from '../common/services/html-sanitizer.service';
import { convertContentFormat } from '../common/utils/content-format.util';
import { ContentFormat } from '../entities/post-revision.entity';

/**
 * `content_html` leaving the partner API must be sanitized.
 *
 * Two read surfaces serve HTML and only `blog.service` sanitized it;
 * `api.service` — the one customers integrate against, and the one the docs
 * point WordPress receivers at — handed `convertContentFormat` output straight
 * out. Articles are model-written from customer-supplied topics, so the markup
 * is not ours to trust.
 */
describe('partner API html sanitization', () => {
  const sanitizer = new HtmlSanitizerService();

  const payloads: Array<[string, string]> = [
    ['script tag', '# T\n\n<script>alert(1)</script>'],
    ['event handler', '# T\n\n<img src=x onerror="alert(1)">'],
    ['javascript: href', '# T\n\n<a href="javascript:alert(1)">x</a>'],
    ['iframe', '# T\n\n<iframe src="https://evil.example"></iframe>'],
  ];

  it.each(payloads)('strips %s from converted html', (_label, markdown) => {
    const json = JSON.stringify({ content: markdown, metadata: {} });
    const raw = convertContentFormat(json, ContentFormat.JSON, ContentFormat.HTML);

    const clean = sanitizer.sanitize(raw, true);

    expect(clean).not.toMatch(/<script/i);
    expect(clean).not.toMatch(/onerror=/i);
    expect(clean).not.toMatch(/javascript:/i);
    expect(clean).not.toMatch(/<iframe/i);
  });

  it('keeps the actual article intact', () => {
    const json = JSON.stringify({
      content: '# Başlık\n\nBir **paragraf** ve [bir link](https://example.com).',
      metadata: {},
    });
    const raw = convertContentFormat(json, ContentFormat.JSON, ContentFormat.HTML);

    const clean = sanitizer.sanitize(raw, true);

    expect(clean).toContain('Başlık');
    expect(clean).toMatch(/<strong>paragraf<\/strong>/);
    expect(clean).toContain('https://example.com');
  });
});
