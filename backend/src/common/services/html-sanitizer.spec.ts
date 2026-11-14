import { HtmlSanitizerService } from './html-sanitizer.service';

/**
 * Sanitizer bypass suite.
 *
 * The service was a chain of regex replacements, and the event-handler rule
 * required quoted values — so `<img src=x onerror=alert(1)>` and three other
 * spellings passed straight through. It survived because the only test anyone
 * wrote used the quoted form, which was the single case the regex handled.
 *
 * Every vector below failed against that implementation. Keep them: the point
 * is not that the current library passes, it is that a future "small fix" to
 * how HTML is cleaned has to pass all of them too.
 */
describe('HtmlSanitizerService — XSS vectors', () => {
  const s = new HtmlSanitizerService();

  const vectors: Array<[string, string]> = [
    ['unquoted event handler', '<img src=x onerror=alert(1)>'],
    ['backtick-quoted handler', '<img src=x onerror=`alert(1)`>'],
    ['newline before attribute', '<img src=x\nonerror=alert(1)>'],
    ['uppercase, unquoted', '<IMG SRC=x ONERROR=alert(1)>'],
    ['quoted event handler', '<img src=x onerror="alert(1)">'],
    ['svg onload', '<svg onload=alert(1)>'],
    ['body onload', '<body onload=alert(1)>'],
    ['javascript: href', '<a href=javascript:alert(1)>x</a>'],
    ['JaVaScRiPt: href', '<a href="JaVaScRiPt:alert(1)">x</a>'],
    ['data:text/html href', '<a href="data:text/html;base64,PHNjcmlwdD4=">x</a>'],
    ['vbscript: href', '<a href="vbscript:msgbox(1)">x</a>'],
    ['script element', '<script>alert(1)</script>'],
    ['script with attributes', '<script type="text/javascript">alert(1)</script>'],
    ['iframe', '<iframe src="//evil.example"></iframe>'],
    ['object', '<object data="evil.swf"></object>'],
    ['embed', '<embed src="evil.swf">'],
    ['style element', '<style>body{background:url(javascript:alert(1))}</style>'],
    ['form', '<form action="https://evil.example"><input name="a"></form>'],
    ['meta refresh', '<meta http-equiv="refresh" content="0;url=https://evil.example">'],
    ['img src javascript', '<img src="javascript:alert(1)">'],
  ];

  it.each(vectors)('neutralises %s', (_label, html) => {
    const out = s.sanitize(html, true);

    expect(out).not.toMatch(/\son\w+\s*=/i);
    expect(out).not.toMatch(/javascript:/i);
    expect(out).not.toMatch(/vbscript:/i);
    expect(out).not.toMatch(/data:text\/html/i);
    expect(out).not.toMatch(/<(script|iframe|object|embed|style|form|meta|svg|body)\b/i);
  });

  it('does not leak script contents as text', () => {
    expect(s.sanitize('<script>SECRET_PAYLOAD</script>', true)).not.toContain('SECRET_PAYLOAD');
  });
});

describe('HtmlSanitizerService — legitimate content survives', () => {
  const s = new HtmlSanitizerService();

  it('keeps the markup an article is made of', () => {
    const html =
      '<h2 id="bolum-1">Başlık</h2>' +
      '<p>Bir <strong>kalın</strong>, bir <em>eğik</em> ve bir <code>kod</code>.</p>' +
      '<ul><li>madde</li></ul>' +
      '<blockquote>alıntı</blockquote>';

    expect(s.sanitize(html, true)).toBe(html);
  });

  it('keeps heading ids, which the table of contents links to', () => {
    expect(s.sanitize('<h3 id="alt-baslik">x</h3>', true)).toContain('id="alt-baslik"');
  });

  it('keeps http, https and mailto links', () => {
    expect(s.sanitize('<a href="https://example.com">x</a>', true)).toContain(
      'https://example.com',
    );
    expect(s.sanitize('<a href="http://example.com">x</a>', true)).toContain('http://example.com');
    expect(s.sanitize('<a href="mailto:a@b.co">x</a>', true)).toContain('mailto:a@b.co');
  });

  it('keeps relative links', () => {
    expect(s.sanitize('<a href="/blog/x">x</a>', true)).toContain('href="/blog/x"');
  });

  it('adds noopener to links that open elsewhere', () => {
    // A model-written link to another site must not get a handle on ours.
    const out = s.sanitize('<a href="https://example.com" target="_blank">x</a>', true);
    expect(out).toContain('noopener');
    expect(out).toContain('noreferrer');
  });

  it('keeps tables', () => {
    const html =
      '<table><thead><tr><th scope="col">a</th></tr></thead><tbody><tr><td>b</td></tr></tbody></table>';
    expect(s.sanitize(html, true)).toBe(html);
  });
});

describe('HtmlSanitizerService — text mode', () => {
  const s = new HtmlSanitizerService();

  it('strips every tag but keeps the words', () => {
    expect(s.stripHtml('<p>Merhaba <strong>dünya</strong></p>')).toBe('Merhaba dünya');
  });

  it('drops script contents rather than exposing them as text', () => {
    expect(s.stripHtml('<script>alert(1)</script>Merhaba')).toBe('Merhaba');
  });
});

describe('HtmlSanitizerService — isDangerous', () => {
  const s = new HtmlSanitizerService();

  it('agrees with what sanitize actually removes', () => {
    expect(s.isDangerous('<img src=x onerror=alert(1)>')).toBe(true);
    expect(s.isDangerous('<p>temiz</p>')).toBe(false);
  });

  it('handles empty and non-string input', () => {
    expect(s.isDangerous('')).toBe(false);
    expect(s.isDangerous(undefined as any)).toBe(false);
  });
});

describe('HtmlSanitizerService — stripHtml returns real text, not escaped html', () => {
  const s = new HtmlSanitizerService();

  // sanitize-html escapes what it keeps, so stripping alone turns "Kahve & çay"
  // into "Kahve &amp; çay". A consumer putting that in a page renders the
  // entity literally — the field is documented as text, so it must be text.
  it.each([
    ['Kahve & çay', 'Kahve & çay'],
    ['Fiyat < 100 TL', 'Fiyat < 100 TL'],
    ['Şirket & Ortakları > 2026', 'Şirket & Ortakları > 2026'],
    ['<p>Merhaba <strong>dünya</strong></p>', 'Merhaba dünya'],
  ])('%s -> %s', (input, expected) => {
    expect(s.stripHtml(input)).toBe(expected);
  });

  it('still drops script contents while decoding', () => {
    expect(s.stripHtml('<script>gizli</script>Kahve & çay')).toBe('Kahve & çay');
  });
});
