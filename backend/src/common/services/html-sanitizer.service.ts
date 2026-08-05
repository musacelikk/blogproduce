import { Injectable } from '@nestjs/common';

/**
 * HTML Sanitizer Service
 * Removes potentially dangerous HTML/JavaScript to prevent XSS attacks
 * 
 * Note: For production, consider using a library like DOMPurify or sanitize-html
 * This is a basic implementation
 */
@Injectable()
export class HtmlSanitizerService {
  /**
   * Sanitize HTML content - remove dangerous tags and attributes
   * @param html HTML content to sanitize
   * @param allowHtml If false, strip all HTML tags (default: true)
   * @returns Sanitized HTML
   */
  sanitize(html: string, allowHtml: boolean = true): string {
    if (!html || typeof html !== 'string') {
      return html || '';
    }

    if (!allowHtml) {
      // Strip all HTML tags
      return html.replace(/<[^>]*>/g, '');
    }

    // Allowed HTML tags (safe subset)
    const allowedTags = [
      'p', 'br', 'strong', 'em', 'u', 'b', 'i',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'blockquote', 'code', 'pre',
      'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span',
    ];

    // Allowed attributes
    const allowedAttributes: Record<string, string[]> = {
      a: ['href', 'title', 'target'],
      img: ['src', 'alt', 'title', 'width', 'height'],
      table: ['class'],
      // Heading ids are anchor targets for the generated table of contents
      h1: ['id'],
      h2: ['id'],
      h3: ['id'],
      h4: ['id'],
      h5: ['id'],
      h6: ['id'],
      th: ['scope'],
      td: ['colspan', 'rowspan'],
    };

    // Remove script, style, iframe, object, embed tags and their content
    let sanitized = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');

    // Remove dangerous event handlers (onclick, onerror, etc.)
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');

    // Remove javascript: and data: URLs
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/data:text\/html/gi, '');

    // Basic tag filtering (for production, use a proper library)
    // This is a simplified version - consider using DOMPurify or sanitize-html
    const tagRegex = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
    sanitized = sanitized.replace(tagRegex, (match, tagName) => {
      const lowerTag = tagName.toLowerCase();
      if (!allowedTags.includes(lowerTag)) {
        return ''; // Remove disallowed tags
      }
      return match; // Keep allowed tags
    });

    return sanitized;
  }

  /**
   * Strip all HTML tags and return plain text
   */
  stripHtml(html: string): string {
    return this.sanitize(html, false);
  }

  /**
   * Check if content contains potentially dangerous HTML
   */
  isDangerous(html: string): boolean {
    if (!html || typeof html !== 'string') {
      return false;
    }

    const dangerousPatterns = [
      /<script/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /javascript:/i,
      /on\w+\s*=/i, // Event handlers
      /data:text\/html/i,
    ];

    return dangerousPatterns.some((pattern) => pattern.test(html));
  }
}

