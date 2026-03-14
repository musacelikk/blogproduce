export interface SeoOptions {
  enabled?: boolean;
}

export interface GenerateBlogOptions {
  seo?: SeoOptions;
}

export interface GenerateBlogRequest {
  topic: string;
  additionalContext?: string;
  tone?: string;
  targetAudience?: string;
  options?: GenerateBlogOptions;
  workspaceId?: string;
}

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

export interface GenerateBlogResponse {
  success: boolean;
  message?: string;
  data?: {
    title: string;
    content: string;
    seo?: SeoMetadata;
  };
  error?: string;
}

