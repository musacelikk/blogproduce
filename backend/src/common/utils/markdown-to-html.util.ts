import { marked } from 'marked';

marked.setOptions({
  gfm: true, // tables, strikethrough, autolinks — the AI pipeline emits GFM tables
  breaks: false,
});

/**
 * Convert Markdown to HTML.
 *
 * This output is what integrators embed as `content_html`, so it goes through a real
 * parser rather than regex substitution (the previous hand-rolled version collapsed
 * newlines before its line-anchored list/blockquote rules ran, which silently destroyed
 * every list and blockquote). Callers are still expected to run the result through
 * HtmlSanitizerService before returning it.
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) {
    return '';
  }

  try {
    return marked.parse(markdown, { async: false }) as string;
  } catch {
    // Never fail a response over a formatting edge case — fall back to escaped text.
    const escaped = markdown
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<p>${escaped.replace(/\n{2,}/g, '</p><p>')}</p>`;
  }
}

/**
 * Calculate reading time in minutes
 * Average reading speed: 200-250 words per minute
 */
export function calculateReadingTime(content: string, wordsPerMinute: number = 225): number {
  if (!content) {
    return 0;
  }

  // Remove markdown syntax and count words
  const plainText = content
    .replace(/#{1,6}\s+/g, '') // Remove headers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
    .replace(/`([^`]+)`/g, '$1') // Remove code
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/[^\w\s]/g, ' ') // Remove special characters
    .trim();

  const wordCount = plainText.split(/\s+/).filter(word => word.length > 0).length;
  const readingTime = Math.ceil(wordCount / wordsPerMinute);

  return Math.max(1, readingTime); // Minimum 1 minute
}

