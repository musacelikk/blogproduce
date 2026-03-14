import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../entities/post.entity';
import { UnsplashService } from '../unsplash/unsplash.service';

export interface SeoMetadata {
  metaTitle: string;
  metaDescription: string;
  titleAlternatives: string[];
  h1Structure: string[];
  h2Structure: string[];
  faq: Array<{ question: string; answer: string }>;
  jsonLdSchema: {
    article?: Record<string, any>;
    faqPage?: Record<string, any>;
  };
  internalLinks: Array<{ text: string; url: string; anchor: string }>;
  slug: string;
  canonicalUrl: string;
  tableOfContents: Array<{ id: string; title: string; level: number }>;
  coverImagePrompt: string;
  coverImageAltText: string;
  coverImageUrl?: string;
  coverImageCredit?: {
    name: string;
    photographerUrl: string;
    photoUrl: string;
  };
  readabilityScore: number;
  aiFootprintReduced: boolean;
}

@Injectable()
export class SeoService {
  private openai: OpenAI;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    private unsplashService: UnsplashService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async generateSeoMetadata(
    title: string,
    content: string,
    topic: string,
    workspaceId?: string,
  ): Promise<SeoMetadata> {
      const [
      metaTags,
      titleAlternatives,
      headingStructure,
      faq,
      jsonLd,
      internalLinks,
      slug,
      canonical,
      toc,
      coverImage,
      readability,
      aiReduction,
    ] = await Promise.all([
      this.generateMetaTags(title, content),
      this.generateTitleAlternatives(title, topic),
      this.analyzeHeadingStructure(content),
      this.generateFaq(content, topic),
      this.generateJsonLdSchema(title, content, topic),
      this.suggestInternalLinks(content, topic, workspaceId),
      this.generateSlug(title),
      this.generateCanonicalUrl(title),
      this.generateTableOfContents(content),
      this.generateCoverImageMetadata(title, topic),
      this.analyzeReadability(content),
      this.reduceAiFootprint(content),
    ]);

    // Search for cover image from Unsplash if prompt is available
    let coverImageUrl: string | undefined;
    let coverImageCredit: { name: string; photographerUrl: string; photoUrl: string } | undefined;
    
    if (coverImage.prompt) {
      try {
        const searchQuery = this.extractSearchQueryFromPrompt(coverImage.prompt, topic);
        const photos = await this.unsplashService.searchPhotos(searchQuery, 1, 1);
        if (photos && photos.length > 0) {
          const photo = photos[0];
          coverImageUrl = photo.urls.regular || photo.urls.full;
          coverImageCredit = {
            name: photo.user.name,
            photographerUrl: photo.user.links.html,
            photoUrl: photo.links.html,
          };
          // Trigger download tracking (async, don't wait)
          this.unsplashService.triggerDownload(photo.id).catch(() => {
            // Ignore errors
          });
        }
      } catch (error) {
        console.error('Error searching cover image from Unsplash:', error);
        // Continue without cover image if Unsplash fails
      }
    }

    return {
      metaTitle: metaTags.title,
      metaDescription: metaTags.description,
      titleAlternatives,
      h1Structure: headingStructure.h1,
      h2Structure: headingStructure.h2,
      faq,
      jsonLdSchema: jsonLd,
      internalLinks,
      slug,
      canonicalUrl: canonical,
      tableOfContents: toc,
      coverImagePrompt: coverImage.prompt,
      coverImageAltText: coverImage.altText,
      coverImageUrl,
      coverImageCredit,
      readabilityScore: readability,
      aiFootprintReduced: aiReduction,
    };
  }

  private async generateMetaTags(title: string, content: string): Promise<{ title: string; description: string }> {
    if (!this.openai) {
      return {
        title: title.substring(0, 60),
        description: content.substring(0, 160).replace(/\n/g, ' ').trim(),
      };
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an SEO expert. Generate optimized meta title (max 60 chars) and meta description (max 160 chars) for blog posts. Return JSON: {title: string, description: string}',
          },
          {
            role: 'user',
            content: `Title: ${title}\n\nContent preview: ${content.substring(0, 500)}\n\nGenerate SEO-optimized meta tags.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
      });

      const response = completion.choices[0]?.message?.content;
      if (response) {
        try {
          const parsed = JSON.parse(response);
          return {
            title: parsed.title?.substring(0, 60) || title.substring(0, 60),
            description: parsed.description?.substring(0, 160) || content.substring(0, 160).replace(/\n/g, ' ').trim(),
          };
        } catch (parseError) {
          // If JSON parsing fails, extract from text
          const titleMatch = response.match(/"title"\s*:\s*"([^"]+)"/i) || response.match(/title[:\s]+(.+)/i);
          const descMatch = response.match(/"description"\s*:\s*"([^"]+)"/i) || response.match(/description[:\s]+(.+)/i);
          return {
            title: titleMatch?.[1]?.substring(0, 60) || title.substring(0, 60),
            description: descMatch?.[1]?.substring(0, 160) || content.substring(0, 160).replace(/\n/g, ' ').trim(),
          };
        }
      }
    } catch (error) {
      console.error('Error generating meta tags:', error);
    }

    return {
      title: title.substring(0, 60),
      description: content.substring(0, 160).replace(/\n/g, ' ').trim(),
    };
  }

  private async generateTitleAlternatives(title: string, topic: string): Promise<string[]> {
    if (!this.openai) {
      return [title];
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Generate 3-5 alternative SEO-friendly titles for a blog post. Return JSON array of strings.',
          },
          {
            role: 'user',
            content: `Original title: ${title}\nTopic: ${topic}\n\nGenerate alternative titles.`,
          },
        ],
        temperature: 0.8,
        max_tokens: 200,
      });

      const response = completion.choices[0]?.message?.content;
      if (response) {
        try {
          const parsed = JSON.parse(response);
          return Array.isArray(parsed) ? parsed : [title];
        } catch (parseError) {
          // If JSON parsing fails, try to extract array from text
          const arrayMatch = response.match(/\[(.*?)\]/s);
          if (arrayMatch) {
            try {
              const parsed = JSON.parse(arrayMatch[0]);
              return Array.isArray(parsed) ? parsed : [title];
            } catch {
              // Fallback: split by lines and extract titles
              const lines = response.split('\n').filter((l) => l.trim().length > 0);
              return lines.slice(0, 5).map((l) => l.replace(/^[-*]\s*/, '').trim()).filter((l) => l.length > 0);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error generating title alternatives:', error);
    }

    return [title];
  }

  private async analyzeHeadingStructure(content: string): Promise<{ h1: string[]; h2: string[] }> {
    const h1Matches = content.match(/^#\s+(.+)$/gm) || [];
    const h2Matches = content.match(/^##\s+(.+)$/gm) || [];

    return {
      h1: h1Matches.map((m) => m.replace(/^#\s+/, '').trim()),
      h2: h2Matches.map((m) => m.replace(/^##\s+/, '').trim()),
    };
  }

  private async generateFaq(content: string, topic: string): Promise<Array<{ question: string; answer: string }>> {
    if (!this.openai) {
      return [];
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Generate 3-5 relevant FAQ questions and answers based on the blog content. Return JSON array: [{question: string, answer: string}]. Answers should be concise (2-3 sentences).',
          },
          {
            role: 'user',
            content: `Topic: ${topic}\n\nContent: ${content.substring(0, 1500)}\n\nGenerate FAQ.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const response = completion.choices[0]?.message?.content;
      if (response) {
        try {
          const parsed = JSON.parse(response);
          return Array.isArray(parsed) ? parsed : [];
        } catch (parseError) {
          // If JSON parsing fails, try to extract FAQ from text
          const questions = response.match(/question[:\s]+(.+?)(?:\n|answer)/gi) || [];
          const answers = response.match(/answer[:\s]+(.+?)(?:\n|question|$)/gi) || [];
          const faq = [];
          for (let i = 0; i < Math.min(questions.length, answers.length, 5); i++) {
            faq.push({
              question: questions[i].replace(/question[:\s]+/i, '').trim(),
              answer: answers[i].replace(/answer[:\s]+/i, '').trim(),
            });
          }
          return faq;
        }
      }
    } catch (error) {
      console.error('Error generating FAQ:', error);
    }

    return [];
  }

  private async generateJsonLdSchema(
    title: string,
    content: string,
    topic: string,
  ): Promise<{ article?: Record<string, any>; faqPage?: Record<string, any> }> {
    const articleSchema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description: content.substring(0, 200).replace(/\n/g, ' ').trim(),
      about: topic,
    };

    return {
      article: articleSchema,
    };
  }

  private async suggestInternalLinks(
    content: string,
    topic: string,
    workspaceId?: string,
  ): Promise<Array<{ text: string; url: string; anchor: string }>> {
    if (!workspaceId) {
      return [];
    }

    try {
      const existingPosts = await this.postsRepository.find({
        where: { workspaceId },
        select: ['id', 'title', 'slug'],
        take: 10,
        order: { createdAt: 'DESC' },
      });

      if (existingPosts.length === 0) {
        return [];
      }

      if (!this.openai) {
        return existingPosts.slice(0, 3).map((post) => ({
          text: post.title,
          url: `/blog/${post.slug}`,
          anchor: post.title.toLowerCase().replace(/\s+/g, '-'),
        }));
      }

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Analyze content and suggest 2-4 relevant internal links from existing posts. Return JSON array: [{text: string, url: string, anchor: string}].',
          },
          {
            role: 'user',
            content: `Current content: ${content.substring(0, 1000)}\n\nAvailable posts:\n${existingPosts.map((p) => `- ${p.title} (slug: ${p.slug})`).join('\n')}\n\nSuggest relevant internal links.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      });

      const response = completion.choices[0]?.message?.content;
      if (response) {
        try {
          const parsed = JSON.parse(response);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        } catch (parseError) {
          // If JSON parsing fails, create links from existing posts
          return existingPosts.slice(0, 3).map((post) => ({
            text: post.title,
            url: `/blog/${post.slug}`,
            anchor: post.title.toLowerCase().replace(/\s+/g, '-'),
          }));
        }
      }
    } catch (error) {
      console.error('Error suggesting internal links:', error);
    }

    return [];
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
  }

  private generateCanonicalUrl(title: string): string {
    const slug = this.generateSlug(title);
    return `/blog/${slug}`;
  }

  private async generateTableOfContents(content: string): Promise<Array<{ id: string; title: string; level: number }>> {
    const headings = content.match(/^(#{1,3})\s+(.+)$/gm) || [];
    return headings.map((heading, index) => {
      const level = (heading.match(/^#+/) || [''])[0].length;
      const title = heading.replace(/^#+\s+/, '').trim();
      const id = `heading-${index}`;
      return { id, title, level };
    });
  }

  private async generateCoverImageMetadata(title: string, topic: string): Promise<{ prompt: string; altText: string }> {
    if (!this.openai) {
      return {
        prompt: `Professional blog cover image for: ${topic}`,
        altText: `Cover image for ${title}`,
      };
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Generate a detailed image generation prompt and SEO-friendly alt text. Return JSON: {prompt: string, altText: string}.',
          },
          {
            role: 'user',
            content: `Blog title: ${title}\nTopic: ${topic}\n\nGenerate image prompt and alt text.`,
          },
        ],
        temperature: 0.8,
        max_tokens: 200,
      });

      const response = completion.choices[0]?.message?.content;
      if (response) {
        try {
          const parsed = JSON.parse(response);
          return {
            prompt: parsed.prompt || `Professional blog cover image for: ${topic}`,
            altText: parsed.altText || `Cover image for ${title}`,
          };
        } catch (parseError) {
          // If JSON parsing fails, extract from text
          const promptMatch = response.match(/prompt[:\s]+(.+?)(?:\n|alt)/i);
          const altMatch = response.match(/alt[^:]*[:\s]+(.+?)(?:\n|$)/i);
          return {
            prompt: promptMatch?.[1]?.trim() || `Professional blog cover image for: ${topic}`,
            altText: altMatch?.[1]?.trim() || `Cover image for ${title}`,
          };
        }
      }
    } catch (error) {
      console.error('Error generating cover image metadata:', error);
    }

    return {
      prompt: `Professional blog cover image for: ${topic}`,
      altText: `Cover image for ${title}`,
    };
  }

  private async analyzeReadability(content: string): Promise<number> {
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const words = content.split(/\s+/).filter((w) => w.length > 0);
    const paragraphs = content.split(/\n\n/).filter((p) => p.trim().length > 0);

    const avgWordsPerSentence = words.length / sentences.length;
    const avgSentencesPerParagraph = sentences.length / paragraphs.length;

    let score = 100;
    if (avgWordsPerSentence > 20) score -= 10;
    if (avgWordsPerSentence > 25) score -= 10;
    if (avgSentencesPerParagraph > 5) score -= 10;
    if (avgSentencesPerParagraph > 8) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  private async reduceAiFootprint(content: string): Promise<boolean> {
    if (!this.openai) {
      return false;
    }

    try {
      const aiPatterns = [
        /In conclusion/gi,
        /In summary/gi,
        /It is important to note/gi,
        /Furthermore/gi,
        /Moreover/gi,
        /Additionally/gi,
        /It should be noted/gi,
      ];

      const hasAiPatterns = aiPatterns.some((pattern) => pattern.test(content));
      return hasAiPatterns;
    } catch (error) {
      console.error('Error checking AI footprint:', error);
      return false;
    }
  }

  private extractSearchQueryFromPrompt(prompt: string, topic: string): string {
    // Extract keywords from prompt for Unsplash search
    // Remove common words and keep meaningful keywords
    const stopWords = ['professional', 'blog', 'cover', 'image', 'for', 'showing', 'modern', 'clean', 'design', 'color', 'scheme'];
    const words = prompt
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 3 && !stopWords.includes(word))
      .slice(0, 3); // Take first 3 meaningful words

    if (words.length > 0) {
      return words.join(' ');
    }

    // Fallback to topic keywords
    const topicWords = topic
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 3)
      .slice(0, 2);

    return topicWords.length > 0 ? topicWords.join(' ') : topic.substring(0, 50);
  }
}

