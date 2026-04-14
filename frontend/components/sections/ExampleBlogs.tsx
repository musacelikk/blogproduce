'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Calendar, User } from 'lucide-react';

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
    <section className="w-full py-24 px-8 bg-gradient-to-b from-white to-[#fafafa]">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2
            className="text-[40px] leading-tight font-normal text-[#202020] mb-6"
            style={{
              fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
              fontWeight: '400',
            }}
          >
            Örnek Bloglar
          </h2>
          <p
            className="text-lg text-[#666666] max-w-2xl mx-auto"
            style={{
              fontFamily: 'var(--font-sans), "Inter", sans-serif',
            }}
          >
            BlogProduce AI destekli blog üretim API&apos;si ile oluşturulmuş, prompt&apos;a göre özelleştirilmiş ve SEO optimizasyonlu profesyonel blog içeriklerinden örnekler
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {exampleBlogs.map((blog, index) => (
            <motion.article
              key={blog.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-[#e5e5e5]"
            >
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={blog.image}
                  alt={blog.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-[#3B82F6] text-white text-xs font-medium rounded-full">
                    {blog.category}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h3
                  className="text-xl font-medium text-[#202020] mb-3 group-hover:text-[#3B82F6] transition-colors line-clamp-2"
                  style={{
                    fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
                  }}
                >
                  {blog.title}
                </h3>
                <p
                  className="text-base text-[#666666] mb-4 line-clamp-3"
                  style={{
                    fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
                  }}
                >
                  {blog.excerpt}
                </p>
                <div className="flex items-center justify-between text-sm text-[#999999] mb-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{blog.author}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{blog.date}</span>
                  </div>
                </div>
                <Link
                  href={`/example-blogs/${blog.slug}`}
                  className="inline-flex items-center gap-2 text-[#3B82F6] font-medium hover:gap-3 transition-all"
                >
                  <span>Devamını Oku</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

