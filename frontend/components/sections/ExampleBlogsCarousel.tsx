'use client';

import { motion, useInView } from 'framer-motion';
import Image from 'next/image';
import { ArrowRight, Calendar, ChevronLeft, ChevronRight, Globe } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SectionHeading } from '@/components/sections/SectionHeading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type BlogPost = {
  id: string;
  title: string;
  excerpt?: string;
  slug?: string;
  author?: string | { name?: string; email?: string };
  date?: string;
  publishedAt?: string;
  category?: string;
  image?: string;
  coverImageUrl?: string;
  canonicalUrl?: string | null;
};

type ExampleBlogsCarouselProps = {
  blogs: BlogPost[];
};

const mockBlogs: BlogPost[] = [
  {
    id: 'mail-servisi-nedir-1769514242420',
    slug: 'mail-servisi-nedir-1769514242420',
    title: 'Mail Servisi Nedir? Detaylı Bir İnceleme',
    excerpt:
      'Mail servisinin ne olduğu, temel bileşenleri ve e-posta sunucuları hakkında kapsamlı bir rehber.',
    author: 'BlogProduce',
    date: new Date().toISOString(),
    category: 'Teknoloji',
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop',
  },
  {
    id: '1',
    slug: 'yapay-zeka-ile-blog-icerik-uretiminin-gelecegi',
    title: 'Yapay Zeka ile Blog İçerik Üretiminin Geleceği',
    excerpt:
      'Yapay zeka teknolojilerinin blog içerik üretim süreçlerini nasıl dönüştürdüğünü ve gelecekte bizi nelerin beklediğini keşfedin.',
    author: 'Ahmet Yılmaz',
    date: new Date().toISOString(),
    category: 'AI',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop',
  },
  {
    id: '2',
    slug: 'seo-dostu-icerik-uretimi-icin-10-ipucu',
    title: 'SEO Dostu İçerik Üretimi İçin 10 İpucu',
    excerpt:
      'Arama motorları tarafından sevilen, organik trafik çeken blog içerikleri oluşturmanın kanıtlanmış stratejileri.',
    author: 'Ayşe Demir',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Pazarlama',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
  },
  {
    id: '3',
    slug: 'blog-icerik-kalitesini-artirmanin-yollari',
    title: 'Blog İçerik Kalitesini Artırmanın Yolları',
    excerpt:
      'Okuyucularınızın ilgisini çekecek, değer katan ve paylaşılan içerikler üretmek için pratik öneriler.',
    author: 'Mehmet Kaya',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'İçerik',
    image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&h=600&fit=crop',
  },
  {
    id: '4',
    slug: 'ai-destekli-icerik-uretimi-baslangic-kilavuzu',
    title: 'AI Destekli İçerik Üretimi: Başlangıç Kılavuzu',
    excerpt:
      'Yapay zeka ile içerik üretimine başlamak için bilmeniz gerekenler ve en iyi uygulamalar.',
    author: 'Zeynep Özkan',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'AI',
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=600&fit=crop',
  },
];

export const ExampleBlogsCarousel = ({ blogs }: ExampleBlogsCarouselProps) => {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true, margin: '-80px' });
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollability = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollability();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollability);
      window.addEventListener('resize', checkScrollability);
      return () => {
        container.removeEventListener('scroll', checkScrollability);
        window.removeEventListener('resize', checkScrollability);
      };
    }
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
      const newScrollLeft =
        scrollContainerRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount);
      scrollContainerRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getExcerpt = (text?: string, maxLength = 110) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '…';
  };

  const displayBlogs = blogs && blogs.length > 0 ? blogs : mockBlogs;

  return (
    <section className="w-full bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 20 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] as const }}
        >
          <SectionHeading
            eyebrow="Örnek bloglar"
            title="Platformdan çıkan gerçek içerikler"
            description="Hepsi BlogProduce ile üretildi: SEO optimizasyonlu, prompt'a göre özelleştirilmiş ve yayına hazır."
            action={
              <div className="hidden shrink-0 items-center gap-2 md:flex">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => scroll('left')}
                  disabled={!canScrollLeft}
                  className="rounded-full"
                  aria-label="Önceki bloglar"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => scroll('right')}
                  disabled={!canScrollRight}
                  className="rounded-full"
                  aria-label="Sonraki bloglar"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            }
          />
        </motion.div>

        {/* Cards */}
        <div
          ref={scrollContainerRef}
          className="scrollbar-hide mt-14 flex gap-6 overflow-x-auto overflow-y-visible pb-4"
        >
          {displayBlogs.map((blog, index) => (
            <motion.article
              key={blog.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] as const }}
              className="group w-[82vw] shrink-0 cursor-pointer overflow-hidden rounded-xl border border-border bg-card shadow-card transition-[box-shadow,border-color] duration-base ease-out-quart hover:border-strong hover:shadow-card-hover md:w-[360px] lg:w-[380px]"
              whileHover={{ y: -4 }}
              onClick={() => { if (blog.slug) router.push(`/example-blogs/${blog.slug}`); }}
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden border-b border-border bg-surface-sunken">
                <Image
                  src={blog.coverImageUrl || blog.image || '/images/default-blog.jpg'}
                  alt={blog.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 82vw, 380px"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/default-blog.jpg';
                  }}
                />

                {blog.category && (
                  <div className="absolute left-3 top-3">
                    <Badge variant="primary" className="uppercase tracking-wide">
                      {blog.category}
                    </Badge>
                  </div>
                )}
                {blog.canonicalUrl && (
                  <div className="absolute right-3 top-3">
                    <Badge variant="success">
                      <Globe className="h-2.5 w-2.5" />
                      Yayında
                    </Badge>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="mb-2 line-clamp-2 text-base font-semibold leading-snug tracking-tight text-foreground-strong transition-colors duration-base ease-out-quart group-hover:text-primary">
                  {blog.title}
                </h3>
                <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {getExcerpt(blog.excerpt)}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  {(blog.date || blog.publishedAt) ? (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span>{formatDate(blog.date || blog.publishedAt)}</span>
                    </div>
                  ) : <div />}

                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent-foreground transition-all duration-200 group-hover:gap-2">
                    Oku
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};
