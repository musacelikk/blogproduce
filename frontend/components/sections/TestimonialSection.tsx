"use client"

import { SectionTitle } from "@/components/ui/section-title"

type Testimonial = {
  id: number
  quote: string
  author: string
  role: string
  company: string
}

const testimonials: Testimonial[] = [
  { id: 1, quote: "İçerik üreticisi olarak bloglar ve tanıtım metinleri için sürekli metin yazıyordum. BlogProduce tam da aradığım tek duraklı çözüm oldu. Haftalarca süren işi günler içinde yapıyorum.", author: "Ayşe K.", role: "Pazarlama Müdürü", company: "TechStartup" },
  { id: 2, quote: "API ile kendi sitemize entegre ettik. Dakikalar içinde SEO uyumlu, özgün bloglar üretiyoruz. Ekip olarak hem zaman hem maliyet kazandık. Kesinlikle tavsiye ederim.", author: "Mehmet Y.", role: "Teknik Lead", company: "DevAgency" },
  { id: 3, quote: "50+ dil desteği harika. Uluslararası pazarlarda içerik üretmek artık çok kolay. SEO meta verileri otomatik oluşturuluyor, zamandan büyük tasarruf.", author: "Zeynep A.", role: "Dijital Pazarlama Uzmanı", company: "GrowthCo" },
  { id: 4, quote: "Workspace yönetimi çok pratik. Her müşteri için ayrı çalışma alanı, ayrı API anahtarı. Ajans olarak çalışırken bu özellik hayat kurtarıyor.", author: "Burak D.", role: "Kurucu", company: "ContentAgency" },
  { id: 5, quote: "Token kullanım raporları sayesinde maliyetleri tam olarak takip edebiliyoruz. Şeffaf fiyatlandırma ve gerçek zamanlı analitik — mükemmel bir ürün.", author: "Selin T.", role: "Ürün Yöneticisi", company: "SaaSCo" },
  { id: 6, quote: "Görsel destekli blog üretimi özelliği bizi çok etkiledi. Yazı ve görsel birlikte çıkıyor, içeriği doğrudan yayınlayabiliyoruz. Süper pratik.", author: "Deniz M.", role: "İçerik Direktörü", company: "MediaHouse" },
  { id: 7, quote: "RESTful API dökümanı çok temiz ve anlaşılır. Entegrasyon sadece birkaç saat sürdü. Destek ekibi de çok yardımsever. Harika deneyim.", author: "Can Ö.", role: "Backend Geliştirici", company: "TechFirm" },
]

function TestimonialCard({ testimonial, className = "" }: { testimonial: Testimonial; className?: string }) {
  return (
    <article
      className={`rounded-xl border border-border bg-card p-6 shadow-card transition-shadow hover:shadow-card-hover md:p-8 ${className}`}
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground">
          {testimonial.author.charAt(0)}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground">{testimonial.author}</div>
          <div className="text-xs text-muted-foreground">
            {testimonial.role} · {testimonial.company}
          </div>
        </div>
      </div>
      <blockquote className="text-base font-medium leading-relaxed text-foreground">
        &ldquo;{testimonial.quote}&rdquo;
      </blockquote>
    </article>
  )
}

export const TestimonialSection = () => {
  const duplicated = [...testimonials, ...testimonials]
  const duplicatedReverse = [...testimonials.slice().reverse(), ...testimonials.slice().reverse()]
  const mobileList = testimonials.slice(0, 6)

  return (
    <section id="testimonials" className="relative overflow-hidden py-16 sm:py-24">
      {/* Desktop — dual marquee */}
      <div className="hidden lg:block">
        <div className="mx-auto mb-12 max-w-7xl px-4 sm:px-6 lg:mb-16 lg:px-8">
          <SectionTitle className="text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl">
            Müşterilerimiz ne diyor?
          </SectionTitle>
        </div>
        <div className="mb-6 flex animate-scroll-left gap-6 hover:[animation-play-state:paused]">
          {duplicated.map((t, i) => (
            <TestimonialCard key={`${t.id}-${i}`} testimonial={t} className="w-[400px] shrink-0" />
          ))}
        </div>
        <div className="flex animate-scroll-right gap-6 hover:[animation-play-state:paused]">
          {duplicatedReverse.map((t, i) => (
            <TestimonialCard key={`r-${t.id}-${i}`} testimonial={t} className="w-[400px] shrink-0" />
          ))}
        </div>
      </div>

      {/* Mobile — stacked cards */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:hidden lg:px-8">
        <div className="mb-12">
          <SectionTitle className="text-3xl font-semibold tracking-tight md:text-4xl">
            Müşterilerimiz ne diyor?
          </SectionTitle>
        </div>
        <div className="relative">
          {mobileList.map((t, index) => (
            <div
              key={t.id}
              className="sticky pt-10"
              style={{ top: `${80 + index * 10}px`, zIndex: index + 1 }}
            >
              <TestimonialCard testimonial={t} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
