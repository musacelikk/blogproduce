"use client"

import {
  ContentListMockup,
  GeneratorMockup,
  UsageMockup,
  WorkspacesMockup,
} from "@/components/sections/mockups"
import Link from "next/link"
import { ArrowUpRight, Target, Sparkles, Send } from "lucide-react"
import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { SectionHeading } from "@/components/sections/SectionHeading"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const steps = [
  {
    step: 1,
    title: "Tanımla",
    description: "Hedef kitleni ve konunu belirle, ton ve uzunluk parametrelerini seç.",
    icon: Target,
  },
  {
    step: 2,
    title: "Üret",
    description: "AI, görseller ve SEO analizi dahil tam paket bir blog yazısı oluştursun.",
    icon: Sparkles,
  },
  {
    step: 3,
    title: "Yayınla",
    description: "API veya webhook ile içeriği doğrudan sitene gönder.",
    icon: Send,
  },
]

const features = [
  {
    id: 1,
    title: "Akıllı Blog Üretimi",
    category: "AI & SEO Otomasyonu",
    description:
      "Konuyu girin; AI, SEO analizinden görsel üretimine kadar her adımı tamamlasın. RESTful API ile içerikleri doğrudan kendi platformunuza akıtın.",
    Mockup: GeneratorMockup,
    tags: ["SEO Gömülü", "Görsel Üretimi", "API Entegrasyonu", "Multi-Model"],
  },
  {
    id: 2,
    title: "Merkezi İçerik Yönetimi",
    category: "Operasyonel Verimlilik",
    description:
      "Tüm içerikleri tek panelden yönetin. Durum takibi, anlık önizleme ve gelişmiş filtreleme ile yayın süreciniz hızlanır.",
    Mockup: ContentListMockup,
    tags: ["İçerik Arşivi", "Yayın Takvimi", "Hızlı Düzenleme"],
  },
  {
    id: 3,
    title: "Şeffaf Analitik & Takip",
    category: "Maliyet Kontrolü",
    description:
      "Workspace bazlı tüketimi gerçek zamanlı izleyin. İstek sayısı, token kullanımı ve aylık geçmişle bütçeniz kontrol altında kalır.",
    Mockup: UsageMockup,
    tags: ["Gerçek Zamanlı Veri", "Bütçe Yönetimi", "Detaylı Rapor"],
  },
  {
    id: 4,
    title: "Proje Odaklı Workspace'ler",
    category: "Gelişmiş Organizasyon",
    description:
      "Projelerinizi ve müşterilerinizi birbirinden ayırın. Her çalışma alanına özel API anahtarı ve bağımsız içerik listesiyle ölçeklenin.",
    Mockup: WorkspacesMockup,
    tags: ["White-Label Hazır", "Ekip Yönetimi", "API İzolasyonu"],
  },
]

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
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
    <section id="ozellikler" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Nasıl çalışır"
          title="Üç adımda fikirden yayına"
          description="Konuyu tanımlayın, AI üretsin, içerik API üzerinden sitenizde yayınlansın."
          action={
            <Link
              href="/solutions"
              className="hidden items-center gap-1.5 text-sm font-medium text-accent-foreground transition-colors duration-base ease-out-quart hover:underline md:inline-flex"
            >
              Tüm özellikler
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          }
        />

        {/* 3 adım */}
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {steps.map((item) => {
            const Icon = item.icon
            return (
              <Card key={item.step} className="p-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                    0{item.step}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-foreground-strong">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </Card>
            )
          })}
        </div>

        <motion.div
          ref={cardsRef}
          className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:mt-20"
          initial="hidden"
          animate={cardsInView ? "visible" : "hidden"}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          {features.map((feature) => (
            <motion.div key={feature.id} variants={cardVariants}>
              <Link href="/solutions" className="group block h-full">
                <Card variant="interactive" className="h-full overflow-hidden">
                  {/* Token-built mockup rather than a screenshot: themes
                      correctly and cannot go stale as the product moves. */}
                  <div className="overflow-hidden border-b border-border bg-surface-sunken p-4">
                    <feature.Mockup className="transition-transform duration-500 ease-out-quart group-hover:scale-[1.02]" />
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-eyebrow">{feature.category}</p>
                        <h3 className="mt-2 text-lg font-semibold tracking-tight text-foreground-strong">
                          {feature.title}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                      <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-accent-foreground opacity-0 transition-opacity duration-base ease-out-quart group-hover:opacity-100" />
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {feature.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-10 text-center md:hidden">
          <Button asChild variant="outline" size="lg">
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
