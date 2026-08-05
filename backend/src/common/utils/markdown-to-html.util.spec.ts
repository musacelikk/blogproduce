import { calculateReadingTime, markdownToHtml } from './markdown-to-html.util';

describe('markdownToHtml', () => {
  it('renders unordered lists as real list markup', () => {
    // The previous converter collapsed newlines before its line-anchored list rule
    // ran, so every list silently came out as <br />-separated text.
    const html = markdownToHtml('Intro\n\n- one\n- two\n- three\n');
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>one</li>');
    expect(html).toContain('<li>three</li>');
    expect(html).not.toContain('- one');
  });

  it('renders ordered lists', () => {
    const html = markdownToHtml('1. first\n2. second\n');
    expect(html).toContain('<ol>');
    expect(html).toContain('<li>first</li>');
  });

  it('renders blockquotes', () => {
    const html = markdownToHtml('> quoted line\n');
    expect(html).toContain('<blockquote>');
    expect(html).toContain('quoted line');
  });

  it('renders GFM tables (the pipeline emits them for comparisons)', () => {
    const html = markdownToHtml('| A | B |\n|---|---|\n| 1 | 2 |\n');
    expect(html).toContain('<table>');
    expect(html).toContain('<th>A</th>');
    expect(html).toContain('<td>2</td>');
  });

  it('gives headings an id so table-of-contents links resolve', () => {
    expect(markdownToHtml('## Neden Önemli\n')).toContain('id=');
  });

  it('renders headings and inline emphasis', () => {
    const html = markdownToHtml('# Title\n\nSome **bold** and *italic* text.');
    expect(html).toMatch(/<h1[^>]*>Title<\/h1>/);
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');
  });

  it('returns an empty string for empty input', () => {
    expect(markdownToHtml('')).toBe('');
    expect(markdownToHtml(undefined as unknown as string)).toBe('');
  });
});

describe('calculateReadingTime', () => {
  it('never reports less than a minute', () => {
    expect(calculateReadingTime('short text')).toBe(1);
  });

  it('scales with word count', () => {
    const words = Array.from({ length: 900 }, () => 'kelime').join(' ');
    expect(calculateReadingTime(words)).toBe(4); // 900 / 225
  });
});
