'use client';

import { motion, useInView } from 'framer-motion';
import Image from 'next/image';
import { ArrowRight, Calendar, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
    author: 'BlogGenerator',
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
    <section className="w-full py-16 md:py-24 px-4 md:px-6 lg:px-8" style={{ background: 'var(--background)' }}>
      <div className="max-w-[1280px] mx-auto">

        {/* Header */}
        <div ref={headerRef} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 md:mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] as const }}
          >
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3"
              style={{
                background: 'linear-gradient(135deg,#203eec15,#00d4ff15)',
                border: '1px solid #203eec30',
                color: '#203eec',
              }}
            >
              <Sparkles className="w-3 h-3" />
              AI Üretildi
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight text-foreground">
              Örnek Bloglar
            </h2>
            <p className="mt-2 text-sm md:text-base text-muted-foreground max-w-lg">
              BlogGenerator ile üretilmiş, SEO optimizasyonlu ve prompt&apos;a göre özelleştirilmiş profesyonel içerikler
            </p>
          </motion.div>

          {/* Nav buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={headerInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="hidden md:flex items-center gap-2 flex-shrink-0"
          >
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}
              aria-label="Önceki bloglar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}
              aria-label="Sonraki bloglar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>

        {/* Cards */}
        <div
          ref={scrollContainerRef}
          className="flex gap-5 overflow-x-auto overflow-y-visible pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {displayBlogs.map((blog, index) => (
            <motion.article
              key={blog.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] as const }}
              className="group relative flex-shrink-0 w-[82vw] md:w-[360px] lg:w-[380px] rounded-2xl overflow-hidden cursor-pointer"
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                transition: 'box-shadow 0.3s, border-color 0.3s, transform 0.3s',
              }}
              whileHover={{ y: -4 }}
              onClick={() => { if (blog.slug) router.push(`/example-blogs/${blog.slug}`); }}
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
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
                {/* Gradient overlay */}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 60%)' }} />

                {blog.category && (
                  <div className="absolute top-3 left-3">
                    <span
                      className="px-2.5 py-1 text-[10px] font-semibold text-white rounded-full tracking-wide uppercase"
                      style={{ background: 'linear-gradient(135deg,#203eec,#00d4ff)' }}
                    >
                      {blog.category}
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-base font-semibold tracking-tight text-foreground mb-2 line-clamp-2 leading-snug group-hover:text-[#203eec] transition-colors duration-200">
                  {blog.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                  {getExcerpt(blog.excerpt)}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  {(blog.date || blog.publishedAt) ? (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{formatDate(blog.date || blog.publishedAt)}</span>
                    </div>
                  ) : <div />}

                  <span
                    className="inline-flex items-center gap-1 text-xs font-semibold transition-all duration-200 group-hover:gap-2"
                    style={{ color: '#203eec' }}
                  >
                    Oku
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>

              {/* Hover border glow */}
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ boxShadow: 'inset 0 0 0 1.5px #203eec40' }}
              />
            </motion.article>
          ))}
        </div>
      </div>

      <style jsx>{`
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </section>
  );
};
