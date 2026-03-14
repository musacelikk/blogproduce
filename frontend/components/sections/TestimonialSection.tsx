"use client"

import { useState } from "react"
import { SectionTitle } from "@/components/ui/section-title"

const testimonials = [
  { id: 1, quote: "İçerik üreticisi olarak bloglar ve tanıtım metinleri için sürekli metin yazıyordum. BlogGenerator tam da aradığım tek duraklı çözüm oldu. Haftalarca süren işi günler içinde yapıyorum.", author: "Ayşe K.", role: "Pazarlama Müdürü", company: "TechStartup", blurColor: "bg-blue-500" },
  { id: 2, quote: "API ile kendi sitemize entegre ettik. Dakikalar içinde SEO uyumlu, özgün bloglar üretiyoruz. Ekip olarak hem zaman hem maliyet kazandık. Kesinlikle tavsiye ederim.", author: "Mehmet Y.", role: "Teknik Lead", company: "DevAgency", blurColor: "bg-purple-500" },
  { id: 3, quote: "50+ dil desteği harika. Uluslararası pazarlarda içerik üretmek artık çok kolay. SEO meta verileri otomatik oluşturuluyor, zamandan büyük tasarruf.", author: "Zeynep A.", role: "Dijital Pazarlama Uzmanı", company: "GrowthCo", blurColor: "bg-emerald-500" },
  { id: 4, quote: "Workspace yönetimi çok pratik. Her müşteri için ayrı çalışma alanı, ayrı API anahtarı. Ajans olarak çalışırken bu özellik hayat kurtarıyor.", author: "Burak D.", role: "Kurucu", company: "ContentAgency", blurColor: "bg-orange-500" },
  { id: 5, quote: "Token kullanım raporları sayesinde maliyetleri tam olarak takip edebiliyoruz. Şeffaf fiyatlandırma ve gerçek zamanlı analitik — mükemmel bir ürün.", author: "Selin T.", role: "Ürün Yöneticisi", company: "SaaSCo", blurColor: "bg-pink-500" },
  { id: 6, quote: "Görsel destekli blog üretimi özelliği bizi çok etkiledi. Yazı ve görsel birlikte çıkıyor, içeriği doğrudan yayınlayabiliyoruz. Süper pratik.", author: "Deniz M.", role: "İçerik Direktörü", company: "MediaHouse", blurColor: "bg-cyan-500" },
  { id: 7, quote: "RESTful API dökümanı çok temiz ve anlaşılır. Entegrasyon sadece birkaç saat sürdü. Destek ekibi de çok yardımsever. Harika deneyim.", author: "Can Ö.", role: "Backend Geliştirici", company: "TechFirm", blurColor: "bg-rose-500" },
]

export const TestimonialSection = () => {
  const [isPaused, setIsPaused] = useState(false)
  const duplicated = [...testimonials, ...testimonials]
  const duplicatedReverse = [...testimonials.slice().reverse(), ...testimonials.slice().reverse()]
  const mobileList = testimonials.slice(0, 6)

  return (
    <section id="testimonials" className="py-20 overflow-hidden md:py-32 relative" style={{ paddingBottom: 0 }}>
      <div className="absolute bottom-0 left-0 right-0 h-96 pointer-events-none z-20 hidden lg:block" style={{ background: "linear-gradient(to top, var(--background), rgba(255,255,255,0.8), transparent)" }} />

      <div className="hidden lg:block pl-6 md:pl-12">
        <div className="mb-12 md:mb-16 max-w-[1280px]">
          <SectionTitle className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight">
            Müşterilerimiz ne diyor?
          </SectionTitle>
        </div>
        <div className="relative mb-6">
          <div className="flex gap-6 animate-scroll-left" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)} style={{ animationPlayState: isPaused ? "paused" : "running" }}>
            {duplicated.map((t, i) => (
              <article key={`${t.id}-${i}`} className="relative flex-shrink-0 w-[400px] p-6 md:p-8 overflow-hidden rounded-3xl hover:shadow-lg transition-shadow" style={{ border: "1px solid #f0f0f0", backgroundColor: "var(--card)" }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0" style={{ background: "linear-gradient(135deg, #203eec 0%, #00d4ff 100%)" }}>{t.author.charAt(0)}</div>
                  <div>
                    <div className="font-semibold text-sm">{t.author}</div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{t.role} · {t.company}</div>
                  </div>
                </div>
                <blockquote className="text-base leading-relaxed font-semibold relative z-10" style={{ color: "#0a0a0a" }}>&ldquo;{t.quote}&rdquo;</blockquote>
                <div className={`absolute -bottom-12 -right-12 w-48 h-48 ${t.blurColor} rounded-full opacity-10`} style={{ filter: "blur(72px)" }} />
              </article>
            ))}
          </div>
        </div>
        <div className="relative">
          <div className="flex gap-6 animate-scroll-right" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)} style={{ animationPlayState: isPaused ? "paused" : "running" }}>
            {duplicatedReverse.map((t, i) => (
              <article key={`r-${t.id}-${i}`} className="relative flex-shrink-0 w-[400px] p-6 md:p-8 overflow-hidden rounded-3xl hover:shadow-lg transition-shadow" style={{ border: "1px solid #f0f0f0", backgroundColor: "var(--card)" }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0" style={{ background: "linear-gradient(135deg, #203eec 0%, #00d4ff 100%)" }}>{t.author.charAt(0)}</div>
                  <div>
                    <div className="font-semibold text-sm">{t.author}</div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{t.role} · {t.company}</div>
                  </div>
                </div>
                <blockquote className="text-base leading-relaxed font-semibold relative z-10" style={{ color: "#0a0a0a" }}>&ldquo;{t.quote}&rdquo;</blockquote>
                <div className={`absolute -bottom-12 -right-12 w-48 h-48 ${t.blurColor} rounded-full opacity-10`} style={{ filter: "blur(72px)" }} />
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:hidden max-w-[1280px] mx-auto px-6 md:px-12">
        <div className="mb-12 md:mb-16">
          <SectionTitle className="text-3xl md:text-4xl font-semibold tracking-tight">Müşterilerimiz ne diyor?</SectionTitle>
        </div>
        <div className="relative">
          {mobileList.map((t, index) => (
            <div key={t.id} className="sticky pt-10" style={{ top: `${80 + index * 10}px`, zIndex: index + 1 }}>
              <article className="relative p-6 overflow-hidden rounded-3xl" style={{ border: "1px solid #f0f0f0", backgroundColor: "var(--card)" }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0" style={{ background: "linear-gradient(135deg, #203eec 0%, #00d4ff 100%)" }}>{t.author.charAt(0)}</div>
                  <div>
                    <div className="font-semibold text-sm">{t.author}</div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{t.role} · {t.company}</div>
                  </div>
                </div>
                <blockquote className="text-base leading-relaxed font-semibold relative z-10" style={{ color: "#0a0a0a" }}>&ldquo;{t.quote}&rdquo;</blockquote>
                <div className={`absolute -bottom-12 -right-12 w-48 h-48 ${t.blurColor} rounded-full opacity-10`} style={{ filter: "blur(72px)" }} />
              </article>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none z-10 lg:hidden" style={{ background: "linear-gradient(to top, var(--background), rgba(255,255,255,0.9), transparent)" }} />
    </section>
  )
}
