import Image from 'next/image';
import { notFound } from 'next/navigation';

interface PublicPost {
  id: string;
  title: string;
  slug?: string;
  excerpt?: string;
  content_markdown?: string;
  content_html?: string;
  coverImageUrl?: string;
  publishedAt?: string;
  author?: {
    name?: string;
    email?: string;
  } | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.blogenerate.com';

async function getExampleBlog(slug: string): Promise<PublicPost | null> {
  try {
    const params = new URLSearchParams({ slug });
    const res = await fetch(`${API_BASE_URL}/posts/public?${params.toString()}`, {
      // Public marketing sayfası, hafif cache edilebilir
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    const items = data?.data ?? data;
    const post: PublicPost | undefined = Array.isArray(items) ? items[0] : items;
    if (!post || !post.id) {
      return null;
    }

    return post;
  } catch {
    return null;
  }
}

interface PageProps {
  params: {
    id: string; // slug olarak kullanıyoruz
  };
}

// ```json ... ``` gibi code fence'leri temizle
function stripCodeFences(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  let text = raw.trim();

  if (text.startsWith('```')) {
    const firstNewline = text.indexOf('\n');
    if (firstNewline !== -1) {
      text = text.slice(firstNewline + 1);
    }
    const lastFence = text.lastIndexOf('```');
    if (lastFence !== -1) {
      text = text.slice(0, lastFence);
    }
  }

  return text.trim();
}

// Basit bir markdown → HTML dönüştürücü (başlıklar, listeler, paragraf yapısı)
function formatMarkdownToHtml(md: string): string {
  if (!md || typeof md !== 'string') return '';

  let html = md
    .replace(/^### (.*$)/gim, '<h3 class="example-blog-h3">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="example-blog-h2">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="example-blog-h1">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-[#202020]">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
    .replace(/^- (.*$)/gim, '<li class="example-blog-li">$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li class="example-blog-li">$1</li>');

  const paragraphs = html.split(/\n\n+/).filter((p) => p.trim());
  const listItemClass = 'example-blog-li';
  const liOpen = `<li class="${listItemClass}">`;
  html = paragraphs
    .map((p) => {
      const trimmed = p.trim();
      if (trimmed.startsWith('<h')) return trimmed;
      if (trimmed.startsWith(liOpen) || trimmed.startsWith('<li')) {
        const lis = trimmed.match(/<li[^>]*>[\s\S]*?<\/li>/g) || [];
        if (lis.length) return `<ul class="example-blog-ul">${lis.join('')}</ul>`;
      }
      return `<p class="example-blog-p">${trimmed.replace(/\n/g, '<br />')}</p>`;
    })
    .join('');

  return html;
}

// Backend'den gelen HTML'deki başlıklara sınıf ekle (stil garantisi)
function ensureHeadingClasses(html: string): string {
  return html
    .replace(/<h1(?:\s[^>]*)?>/gi, '<h1 class="example-blog-h1">')
    .replace(/<h2(?:\s[^>]*)?>/gi, '<h2 class="example-blog-h2">')
    .replace(/<h3(?:\s[^>]*)?>/gi, '<h3 class="example-blog-h3">')
    .replace(/<p(?:\s[^>]*)?>/gi, '<p class="example-blog-p">');
}

// Canonical JSON veya markdown içeriğini tam blog HTML'ine çevir
function buildContentHtml(post: any): string {
  // 1) Eğer backend zaten HTML verdiyse ve JSON gibi görünmüyorsa direkt kullan
  if (typeof post.content_html === 'string') {
    const trimmed = post.content_html.trim();
    if (trimmed.startsWith('<')) {
      return ensureHeadingClasses(trimmed);
    }
  }

  const rawCandidate: string | undefined =
    typeof post.content_markdown === 'string'
      ? post.content_markdown
      : typeof post.content === 'string'
      ? post.content
      : undefined;

  if (!rawCandidate) {
    if (typeof post.content_html === 'string') {
      const t = post.content_html.trim();
      if (t.startsWith('<')) return ensureHeadingClasses(t);
    }
    return '';
  }

  const raw = stripCodeFences(rawCandidate);

  // 2) JSON ise: title + intro/body/content + sections'tan tam makale üret
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const parts: string[] = [];

      if (parsed.title && typeof parsed.title === 'string') {
        parts.push(`# ${parsed.title}`);
      }

      if (parsed.intro && typeof parsed.intro === 'string') {
        parts.push(parsed.intro);
      }

      if (parsed.body && typeof parsed.body === 'string') {
        parts.push(parsed.body);
      }

      if (parsed.content && typeof parsed.content === 'string') {
        parts.push(parsed.content);
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
              if (typeof c === 'string' && c.trim()) {
                sectionBlocks.push(c.trim());
              }
            });
          }

          if (typeof section.body === 'string' && section.body.trim()) {
            sectionBlocks.push(section.body.trim());
          }

          if (Array.isArray(section.paragraphs)) {
            section.paragraphs.forEach((para: any) => {
              if (typeof para === 'string' && para.trim()) {
                sectionBlocks.push(para.trim());
              }
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
                  if (typeof para === 'string' && para.trim()) {
                    sectionBlocks.push(para.trim());
                  }
                });
              }
            });
          }

          if (sectionBlocks.length) {
            parts.push(sectionBlocks.join('\n\n'));
          }
        });
      }

      const markdown = parts.join('\n\n').trim();
      if (markdown) {
        return formatMarkdownToHtml(markdown);
      }
    }
  } catch {
    // JSON değilse markdown olarak devam edeceğiz
  }

  // 3) Fallback: tamamını markdown olarak yorumla
  return formatMarkdownToHtml(raw);
}

export default async function ExampleBlogDetailPage({ params }: PageProps) {
  const slug = params.id;
  const post = await getExampleBlog(slug);

  if (!post) {
    return notFound();
  }

  const title = post.title;
  const authorName = post.author?.name || post.author?.email || 'BlogGenerator';
  const publishedAt = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : undefined;

  const contentHtml = buildContentHtml(post);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
      <main className="max-w-4xl mx-auto px-4 md:px-6 lg:px-0 pt-24 pb-16">
        <header className="mb-8 md:mb-10">
          <p className="text-sm text-[#203eec] mb-2">Örnek Blog</p>
          <h1
            className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-[#202020] mb-4"
          >
            {title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-[#666666]">
            <span>{authorName}</span>
            {publishedAt && (
              <>
                <span className="w-1 h-1 rounded-full bg-[#d4d4d4]" />
                <span>{publishedAt}</span>
              </>
            )}
          </div>
        </header>

        {post.coverImageUrl && (
          <div className="relative w-full h-64 md:h-80 lg:h-[360px] rounded-2xl overflow-hidden mb-10">
            <Image
              src={post.coverImageUrl}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>
        )}

        {contentHtml && (
          <article
            className="example-blog-article max-w-none text-[#202020]"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        )}
      </main>
    </div>
  );
}

