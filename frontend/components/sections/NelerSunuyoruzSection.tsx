"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, Target, Sparkles, Send } from "lucide-react"
import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { SectionTitle } from "@/components/ui/section-title"

const steps = [
  {
    step: 1,
    title: "Tanımla",
    description: "Hedef kitleni ve konunu belirle, parametrelerini (ton, uzunluk) seç.",
    icon: Target,
  },
  {
    step: 2,
    title: "Üret",
    description: "AI, görseller ve SEO analizi dahil tam paket bir blog post oluştursun.",
    icon: Sparkles,
  },
  {
    step: 3,
    title: "Yayınla",
    description: "API veya Webhook aracılığıyla içeriği doğrudan sitene gönder.",
    icon: Send,
  },
]

const features = [
  {
    id: 1,
    title: "Akıllı Blog Üretimi",
    category: "AI & SEO Otomasyonu",
    description: "Sadece konuyu girin; AI, SEO analizinden görsel tasarımına kadar her şeyi halletsin. RESTful API ile içerikleri doğrudan kendi platformunuza akıtın.",
    image: "/home.png",
    tags: ["SEO Gömülü", "Görsel Üretimi", "API Entegrasyonu", "Multi-Model"],
  },
  {
    id: 2,
    title: "Merkezi İçerik Yönetimi",
    category: "Operasyonel Verimlilik",
    description: "Üretilen tüm içerikleri tek bir noktadan yönetin. Durum takibi, anlık önizleme ve gelişmiş filtreleme ile yayın sürecinizi hızlandırın.",
    image: "/blogs.png",
    tags: ["İçerik Arşivi", "Yayın Takvimi", "Hızlı Düzenleme"],
  },
  {
    id: 3,
    title: "Şeffaf Analitik & Takip",
    category: "Maliyet Kontrolü",
    description: "Workspace bazlı tüketim verilerini gerçek zamanlı izleyin. İstek sayısı, token kullanımı ve aylık geçmiş ile bütçenizi tam kontrol altında tutun.",
    image: "/kullanım.png",
    tags: ["Gerçek Zamanlı Veri", "Bütçe Yönetimi", "Detaylı Rapor"],
  },
  {
    id: 4,
    title: "Proje Odaklı Workspace'ler",
    category: "Gelişmiş Organizasyon",
    description: "Farklı projelerinizi veya müşterilerinizi birbirinden ayırın. Her çalışma alanına özel API anahtarları ve bağımsız içerik listeleriyle profesyonelce ölçeklenin.",
    image: "/workspaces.png",
    tags: ["White-Label Hazır", "Ekip Yönetimi", "API İzolasyonu"],
  },
]

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
}

export const NelerSunuyoruzSection = () => {
  const cardsRef = useRef<HTMLDivElement>(null)
  const cardsInView = useInView(cardsRef, { once: true, margin: "-80px" })

  return (
    <section id="ozellikler" className="py-20 md:py-10 md:pt-32 pb-4">
      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        <div className="flex items-center justify-between mb-12 md:mb-16">
          <SectionTitle className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight">
            Nasıl çalışır
          </SectionTitle>
          <Link
            href="/solutions"
            className="hidden md:inline-flex items-center gap-2 text-sm transition-colors"
            style={{ color: "#203eec" }}
          >
            Tüm özellikler
            <ArrowUpRight className="w-4 h-4" style={{ color: "#203eec" }} />
          </Link>
        </div>

        {/* 3 adım */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-16 md:mb-20">
          {steps.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.step}
                className="flex gap-4 p-5 md:p-6 rounded-2xl transition-colors"
                style={{
                  border: "1px solid var(--border)",
                  backgroundColor: "var(--card)",
                }}
              >
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold text-lg"
                  style={{
                    background: "linear-gradient(135deg, #203eec 0%, #00d4ff 100%)",
                  }}
                >
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Icon className="w-5 h-5" style={{ color: "#203eec" }} />
                    {item.title}
                  </h3>
                  <p className="text-sm mt-1.5 leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                    {item.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        <motion.div
          ref={cardsRef}
          className="flex flex-col gap-12 md:gap-16"
          initial="hidden"
          animate={cardsInView ? "visible" : "hidden"}
          variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
        >
          {features.map((feature, index) => (
            <motion.div key={feature.id} variants={cardVariants}>
              <Link href="/solutions" className="group block">
                <article
                  className="overflow-hidden rounded-2xl md:rounded-3xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-[var(--border)] bg-[var(--card)]"
                >
                  <div
                    className="relative overflow-hidden rounded-t-2xl md:rounded-t-3xl"
                    style={{ aspectRatio: "2/1", backgroundColor: "var(--secondary)" }}
                  >
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      fill
                      className="object-contain object-center transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4 md:p-6 rounded-b-2xl md:rounded-b-3xl bg-[var(--card)]">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium uppercase tracking-wider mb-1 text-[#203eec]">
                          {feature.category}
                        </p>
                        <h3 className="text-lg md:text-xl font-semibold text-[var(--foreground)]">
                          {feature.title}
                        </h3>
                        <p className="text-sm mt-1 leading-relaxed text-[var(--muted-foreground)]">
                          {feature.description}
                        </p>
                      </div>
                      <ArrowUpRight
                        className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1 text-[#203eec]"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {feature.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 text-xs font-medium rounded-full bg-[var(--secondary)] text-[var(--foreground)]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <div className="md:hidden mt-8 text-center">
          <Link
            href="/solutions"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-full hover:opacity-80 transition-opacity"
            style={{ color: "#203eec", border: "1px solid #203eec" }}
          >
            Tüm özellikler
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
