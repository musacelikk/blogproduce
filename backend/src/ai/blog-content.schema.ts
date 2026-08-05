/**
 * Canonical blog generation output contract.
 * Shared by both providers (OpenAI strict json_schema / Anthropic structured outputs):
 * every object must set additionalProperties:false and list all properties as required.
 */

export interface GeneratedBlogContent {
  title: string;
  excerpt: string;
  content: string; // Full article in Markdown, starts with a single H1
  metadata: {
    toc: Array<{ id: string; title: string; level: number }>;
    faq: Array<{ question: string; answer: string }>;
    seo: {
      metaTitle: string;
      metaDescription: string;
      ogTitle: string;
      ogDescription: string;
      keywords: string[];
      slug: string;
    };
  };
}

export const BLOG_CONTENT_SCHEMA_NAME = 'blog_content';

export const BLOG_CONTENT_JSON_SCHEMA: Record<string, any> = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'excerpt', 'content', 'metadata'],
  properties: {
    title: {
      type: 'string',
      description: 'Final article title (same as the H1 in content, without the # prefix)',
    },
    excerpt: {
      type: 'string',
      description: 'Compelling 140-160 character plain-text summary. No markdown.',
    },
    content: {
      type: 'string',
      description:
        'The complete article in Markdown. Starts with exactly one H1 line, then the full body with H2/H3 sections.',
    },
    metadata: {
      type: 'object',
      additionalProperties: false,
      required: ['toc', 'faq', 'seo'],
      properties: {
        toc: {
          type: 'array',
          description: 'Table of contents built from the H2/H3 headings in content',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['id', 'title', 'level'],
            properties: {
              id: { type: 'string', description: 'kebab-case slug of the heading' },
              title: { type: 'string' },
              level: { type: 'number', description: '2 for H2, 3 for H3' },
            },
          },
        },
        faq: {
          type: 'array',
          description: '4-6 questions readers genuinely ask about this topic, with concise expert answers',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['question', 'answer'],
            properties: {
              question: { type: 'string' },
              answer: { type: 'string' },
            },
          },
        },
        seo: {
          type: 'object',
          additionalProperties: false,
          required: ['metaTitle', 'metaDescription', 'ogTitle', 'ogDescription', 'keywords', 'slug'],
          properties: {
            metaTitle: { type: 'string', description: 'Max ~60 characters, primary keyword near the front' },
            metaDescription: { type: 'string', description: '140-160 characters, includes a reason to click' },
            ogTitle: { type: 'string' },
            ogDescription: { type: 'string' },
            keywords: { type: 'array', items: { type: 'string' }, description: '5-8 target keywords/phrases' },
            slug: { type: 'string', description: 'kebab-case URL slug in the article language (ASCII only)' },
          },
        },
      },
    },
  },
};
