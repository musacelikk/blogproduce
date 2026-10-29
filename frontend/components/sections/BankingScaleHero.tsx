"use client"

import { GeneratorMockup } from "@/components/sections/mockups"
import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

const stats = [
  { value: "3B+", label: "Günlük üretilen blog içeriği" },
  { value: "%99", label: "Google EEAT ve SEO uyumluluğu" },
  { value: "50+", label: "Desteklenen içerik dili" },
  { value: "100+", label: "API'yi kullanan geliştirici" },
]

export const BankingScaleHero = () => {
  return (
    <section
      id="features"
      className="relative overflow-hidden border-b border-border bg-background"
    >
      {/* Soft brand wash — token based, purely decorative */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-40 -z-10 h-[620px] w-[620px] rounded-full bg-accent blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-32 -z-10 h-[420px] w-[420px] rounded-full bg-secondary blur-3xl"
      />

      <div className="mx-auto max-w-7xl px-4 pb-20 pt-32 sm:px-6 sm:pb-28 sm:pt-40 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-accent-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              AI destekli blog üretim platformu
            </span>

            <h1 className="mt-6 text-balance text-display-xl text-foreground-strong">
              Blog İçeriklerinizi Otopilota Bağlayın
            </h1>

            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Bir başlık girin; SEO uyumlu içerik, görselleri ve meta etiketleriyle birlikte
              dakikalar içinde yayına hazır olsun.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Button asChild size="xl">
                <Link href="/register">
                  Ücretsiz Başla
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="xl">
                <Link href="/docs">API Dokümantasyonu</Link>
              </Button>
            </div>

            <p className="mt-5 text-sm text-muted-foreground">
              Kredi kartı gerekmez · RESTful API ile birkaç satırda entegre
            </p>
          </div>

          {/* Ürün görüntüsü — statik ekran görüntüsü değil, token'lardan kurulu
              bir mockup: her iki temada da doğru görünür ve ürün değiştikçe
              eskimez. */}
          <div className="relative lg:pl-4">
            <GeneratorMockup />
          </div>
        </div>
      </div>

      {/* Güven şeridi */}
      <div className="border-t border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <dl className="grid grid-cols-2 md:grid-cols-4">
            {stats.map((stat, index) => (
              <div
                key={stat.value}
                className={`flex flex-col gap-1.5 px-2 py-8 sm:px-6 ${
                  index < stats.length - 1 ? "md:border-r md:border-border" : ""
                }`}
              >
                <dt className="text-2xl font-semibold tracking-tight text-primary tabular-nums md:text-3xl">
                  {stat.value}
                </dt>
                <dd className="text-sm leading-relaxed text-muted-foreground">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
