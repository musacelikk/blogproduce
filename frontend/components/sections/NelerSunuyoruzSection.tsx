"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, Target, Sparkles, Send } from "lucide-react"
import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { SectionTitle } from "@/components/ui/section-title"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

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
    <section id="ozellikler" className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex items-end justify-between gap-6 sm:mb-16">
          <SectionTitle className="text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl">
            Nasıl çalışır
          </SectionTitle>
          <Link
            href="/solutions"
            className="hidden items-center gap-1.5 text-sm font-medium text-accent-foreground transition-colors hover:underline md:inline-flex"
          >
            Tüm özellikler
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {/* 3 adım */}
        <div className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-3 lg:mb-20">
          {steps.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.step}
                className="flex gap-4 rounded-xl border border-border bg-card p-6 shadow-card transition-shadow hover:shadow-card-hover"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-base font-semibold text-primary-foreground">
                  {item.step}
                </div>
                <div className="min-w-0">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                    <Icon className="h-5 w-5 text-primary" />
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        <motion.div
          ref={cardsRef}
          className="flex flex-col gap-8 lg:gap-12"
          initial="hidden"
          animate={cardsInView ? "visible" : "hidden"}
          variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
        >
          {features.map((feature) => (
            <motion.div key={feature.id} variants={cardVariants}>
              <Link href="/solutions" className="group block">
                <article className="overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated">
                  <div className="relative aspect-[2/1] overflow-hidden bg-secondary">
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      fill
                      className="object-contain object-center transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent-foreground">
                          {feature.category}
                        </p>
                        <h3 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
                          {feature.title}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                      <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-accent-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {feature.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </article>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-8 text-center md:hidden">
          <Button asChild variant="outline">
            <Link href="/solutions">
              Tüm özellikler
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
