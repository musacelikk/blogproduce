'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Calendar, User } from 'lucide-react';
import { SectionHeading } from '@/components/sections/SectionHeading';
import { Badge } from '@/components/ui/badge';

type BlogPost = {
  id: number | string;
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  category: string;
  image: string;
};

const exampleBlogs: BlogPost[] = [
  {
    id: 'mail-servisi-nedir-1769514242420',
    slug: 'mail-servisi-nedir-1769514242420',
    title: 'Mail Servisi Nedir? Detaylı Bir İnceleme',
    excerpt:
      'Mail servisinin ne olduğu, temel bileşenleri ve e-posta sunucuları hakkında kapsamlı bir rehber.',
    author: 'BlogProduce',
    date: '1 Şubat 2026',
    category: 'Teknoloji',
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop',
  },
  {
    id: 2,
    slug: 'yapay-zeka-ile-blog-icerik-uretiminin-gelecegi',
    title: 'Yapay Zeka ile Blog İçerik Üretiminin Geleceği',
    excerpt:
      'Yapay zeka teknolojilerinin blog içerik üretim süreçlerini nasıl dönüştürdüğünü ve gelecekte bizi nelerin beklediğini keşfedin.',
    author: 'Ahmet Yılmaz',
    date: '15 Aralık 2024',
    category: 'Teknoloji',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop',
  },
  {
    id: 3,
    slug: 'seo-dostu-icerik-uretimi-icin-10-ipucu',
    title: 'SEO Dostu İçerik Üretimi İçin 10 İpucu',
    excerpt:
      'Arama motorları tarafından sevilen, organik trafik çeken blog içerikleri oluşturmanın kanıtlanmış stratejileri.',
    author: 'Ayşe Demir',
    date: '12 Aralık 2024',
    category: 'Pazarlama',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
  },
];

export const ExampleBlogs = () => {
  return (
    <section className="w-full bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <SectionHeading
            align="center"
            eyebrow="Örnek bloglar"
            title="Platformdan çıkan gerçek içerikler"
            description="Hepsi BlogProduce ile üretildi: prompt'a göre özelleştirilmiş, SEO optimizasyonlu ve yayına hazır."
          />
        </motion.div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {exampleBlogs.map((blog, index) => (
            <motion.article
              key={blog.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group overflow-hidden rounded-xl border border-border bg-card shadow-card transition-[box-shadow,border-color,transform] duration-base ease-out-quart hover:-translate-y-0.5 hover:border-strong hover:shadow-card-hover"
            >
              <div className="relative h-48 overflow-hidden border-b border-border bg-surface-sunken">
                <Image
                  src={blog.image}
                  alt={blog.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute left-4 top-4">
                  <Badge variant="primary">{blog.category}</Badge>
                </div>
              </div>
              <div className="p-6">
                <h3 className="mb-3 line-clamp-2 text-lg font-semibold tracking-tight text-foreground-strong transition-colors duration-base ease-out-quart group-hover:text-primary">
                  {blog.title}
                </h3>
                <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {blog.excerpt}
                </p>
                <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{blog.author}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{blog.date}</span>
                  </div>
                </div>
                <Link
                  href={`/example-blogs/${blog.slug}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-accent-foreground transition-all hover:gap-3"
                >
                  <span>Devamını Oku</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

