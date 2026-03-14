/**
 * Content Format Conversion Utilities
 * Converts between JSON, Markdown, and HTML formats
 */

import { ContentFormat } from '../../entities/post-revision.entity';
import { markdownToHtml } from './markdown-to-html.util';

/**
 * Content structure stored as JSON
 * Simple structure: { content: string, metadata?: any }
 * For structured content, use blocks array
 */
export interface ContentJson {
  content: string; // Primary content (markdown or plain text)
  metadata?: {
    blocks?: Array<{
      type: string;
      level?: number;
      content: string;
      language?: string;
      [key: string]: any;
    }>;
    [key: string]: any;
  };
}

/**
 * Canonical blog JSON schema: { title?, intro?, body?, content?, sections?: [...] }
 * Returns true if parsed looks like canonical schema (has title and/or sections).
 */
function isCanonicalBlogJson(parsed: any): boolean {
  if (!parsed || typeof parsed !== 'object') return false;
  return (
    (typeof parsed.title === 'string' && parsed.title.trim() !== '') ||
    (Array.isArray(parsed.sections) && parsed.sections.length > 0)
  );
}

/**
 * Convert canonical blog JSON (title, content, sections, subsections) to full markdown.
 */
function canonicalJsonToMarkdown(parsed: any): string {
  const parts: string[] = [];

  if (typeof parsed.title === 'string' && parsed.title.trim()) {
    parts.push(`# ${parsed.title.trim()}`);
  }
  if (typeof parsed.intro === 'string' && parsed.intro.trim()) {
    parts.push(parsed.intro.trim());
  }
  if (typeof parsed.body === 'string' && parsed.body.trim()) {
    parts.push(parsed.body.trim());
  }
  if (typeof parsed.content === 'string' && parsed.content.trim()) {
    parts.push(parsed.content.trim());
  }

  if (Array.isArray(parsed.sections)) {
    parsed.sections.forEach((section: any) => {
      if (!section || typeof section !== 'object') return;
      const sectionBlocks: string[] = [];
      const heading = (section.title || section.heading) as string | undefined;

      if (heading && typeof heading === 'string') {
        sectionBlocks.push(`## ${heading.trim()}`);
      }
      if (typeof section.content === 'string' && section.content.trim()) {
        sectionBlocks.push(section.content.trim());
      } else if (Array.isArray(section.content)) {
        section.content.forEach((c: any) => {
          if (typeof c === 'string' && c.trim()) sectionBlocks.push(c.trim());
        });
      }
      if (typeof section.body === 'string' && section.body.trim()) {
        sectionBlocks.push(section.body.trim());
      }
      if (Array.isArray(section.paragraphs)) {
        section.paragraphs.forEach((para: any) => {
          if (typeof para === 'string' && para.trim()) sectionBlocks.push(para.trim());
        });
      }
      if (Array.isArray(section.subsections)) {
        section.subsections.forEach((sub: any) => {
          if (!sub || typeof sub !== 'object') return;
          const subHeading = (sub.title || sub.heading) as string | undefined;
          if (subHeading && typeof subHeading === 'string') {
            sectionBlocks.push(`### ${subHeading.trim()}`);
          }
          if (typeof sub.content === 'string' && sub.content.trim()) {
            sectionBlocks.push(sub.content.trim());
          }
          if (Array.isArray(sub.paragraphs)) {
            sub.paragraphs.forEach((para: any) => {
              if (typeof para === 'string' && para.trim()) sectionBlocks.push(para.trim());
            });
          }
        });
      }
      if (sectionBlocks.length) {
        parts.push(sectionBlocks.join('\n\n'));
      }
    });
  }

  return parts.join('\n\n').trim();
}

/**
 * Convert JSON content to Markdown.
 * Supports both ContentJson (content + metadata.blocks) and canonical blog JSON (title, sections).
 */
export function jsonToMarkdown(jsonContent: ContentJson | string): string {
  try {
    let parsed: any;
    if (typeof jsonContent === 'string') {
      try {
        parsed = JSON.parse(jsonContent);
      } catch {
        return jsonContent;
      }
    } else {
      parsed = jsonContent;
    }

    if (isCanonicalBlogJson(parsed)) {
      return canonicalJsonToMarkdown(parsed);
    }

    const content = parsed as ContentJson;
    if (content.metadata?.blocks && Array.isArray(content.metadata.blocks)) {
      return convertBlocksToMarkdown(content.metadata.blocks);
    }
    return content.content || '';
  } catch {
    return typeof jsonContent === 'string' ? jsonContent : (jsonContent as ContentJson).content || '';
  }
}

/**
 * Convert JSON content to HTML
 */
export function jsonToHtml(jsonContent: ContentJson | string): string {
  try {
    const markdown = jsonToMarkdown(jsonContent);
    return markdownToHtml(markdown);
  } catch (error) {
    // If conversion fails, return as HTML string if possible
    if (typeof jsonContent === 'string') {
      try {
        const parsed = JSON.parse(jsonContent);
        if (parsed.content) {
          return markdownToHtml(parsed.content);
        }
      } catch {
        // If it's already HTML, return as-is
        return jsonContent;
      }
    }
    return '';
  }
}

/**
 * Convert Markdown to JSON format
 */
export function markdownToJson(markdown: string, metadata?: any): ContentJson {
  return {
    content: markdown,
    metadata: metadata || {},
  };
}

/**
 * Convert HTML to JSON format (via markdown)
 * Note: HTML to Markdown conversion is lossy, so we store HTML in content
 */
export function htmlToJson(html: string, metadata?: any): ContentJson {
  return {
    content: html,
    metadata: {
      ...metadata,
      format: 'html',
    },
  };
}

/**
 * Convert blocks array to Markdown
 */
function convertBlocksToMarkdown(blocks: Array<{ type: string; level?: number; content: string; language?: string; [key: string]: any }>): string {
  return blocks.map(block => {
    switch (block.type) {
      case 'heading':
        const level = block.level || 1;
        const headingPrefix = '#'.repeat(Math.min(level, 6));
        return `${headingPrefix} ${block.content}`;
      
      case 'paragraph':
        return block.content;
      
      case 'code':
        const lang = block.language || '';
        return `\`\`\`${lang}\n${block.content}\n\`\`\``;
      
      case 'list':
        if (block.ordered) {
          return block.items?.map((item: string, index: number) => `${index + 1}. ${item}`).join('\n') || '';
        } else {
          return block.items?.map((item: string) => `- ${item}`).join('\n') || '';
        }
      
      case 'quote':
        return `> ${block.content}`;
      
      case 'link':
        return `[${block.text || block.content}](${block.url})`;
      
      case 'image':
        return `![${block.alt || ''}](${block.url})`;
      
      default:
        return block.content || '';
    }
  }).join('\n\n');
}

/**
 * Parse format string to ContentFormat enum
 */
export function parseFormat(format?: string): ContentFormat | null {
  if (!format) return null;
  
  const normalized = format.toLowerCase().trim();
  
  switch (normalized) {
    case 'json':
      return ContentFormat.JSON;
    case 'markdown':
    case 'md':
      return ContentFormat.MD;
    case 'html':
      return ContentFormat.HTML;
    default:
      return null;
  }
}

/**
 * Convert content based on requested format
 */
export function convertContentFormat(
  content: string,
  fromFormat: ContentFormat,
  toFormat: ContentFormat | 'markdown' | 'html' | 'json',
): string {
  if (content == null || typeof content !== 'string') return '';
  // Normalize toFormat to ContentFormat enum
  let targetFormat: ContentFormat;
  if (typeof toFormat === 'string') {
    if (toFormat === 'markdown' || toFormat === 'md') {
      targetFormat = ContentFormat.MD;
    } else if (toFormat === 'html') {
      targetFormat = ContentFormat.HTML;
    } else if (toFormat === 'json') {
      targetFormat = ContentFormat.JSON;
    } else {
      // Unknown format, return as-is
      return content;
    }
  } else {
    targetFormat = toFormat;
  }

  // If same format, return as-is
  if (fromFormat === targetFormat) {
    return content;
  }

  // Convert based on source format
  if (fromFormat === ContentFormat.JSON) {
    if (targetFormat === ContentFormat.MD) {
      return jsonToMarkdown(content);
    } else if (targetFormat === ContentFormat.HTML) {
      return jsonToHtml(content);
    }
    return content; // Already JSON
  } else if (fromFormat === ContentFormat.MD) {
    if (targetFormat === ContentFormat.JSON) {
      const json = markdownToJson(content);
      return JSON.stringify(json);
    } else if (targetFormat === ContentFormat.HTML) {
      return markdownToHtml(content);
    }
    return content; // Already Markdown
  } else if (fromFormat === ContentFormat.HTML) {
    if (targetFormat === ContentFormat.JSON) {
      const json = htmlToJson(content);
      return JSON.stringify(json);
    } else if (targetFormat === ContentFormat.MD) {
      // HTML to Markdown conversion is complex, use simple approach
      // For production, consider using a library like turndown
      return content.replace(/<[^>]+>/g, ''); // Strip HTML tags as fallback
    }
    return content; // Already HTML
  }

  return content;
}

