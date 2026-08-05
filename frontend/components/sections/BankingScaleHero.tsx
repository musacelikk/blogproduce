"use client"

import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

const stats = [
  { value: "3K+", label: "Günlük üretilen\nblog içeriği" },
  { value: "%99", label: "Google EEAT ve SEO Uyumluluk Garantisi" },
  { value: "50+", label: "Global Dil Desteği" },
  { value: "100+", label: "BlogProduce\nkullanan geliştirici" },
]

export const BankingScaleHero = () => {
  const titleText = "Blog İçeriklerinizi Otopilota Bağlayın"
  const words = titleText.split(" ")

  return (
    <section
      id="features"
      className="relative overflow-hidden border-b border-border bg-background"
    >
      {/* Soft brand wash — token based, purely decorative */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-32 -z-10 h-[560px] w-[560px] rounded-full bg-accent blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-24 -z-10 h-[380px] w-[380px] rounded-full bg-secondary blur-3xl"
      />

      <div className="mx-auto max-w-7xl px-4 pb-16 pt-32 sm:px-6 sm:pb-24 sm:pt-40 lg:px-8">
        <div className="max-w-4xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            AI destekli blog üretim platformu
          </span>

          <h1 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {words.map((word, index) => (
              <span
                key={`${word}-${index}`}
                className="hero-word mr-[0.25em] py-1 last:mr-0"
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                {word}
              </span>
            ))}
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Sadece bir başlık veya anahtar kelime girin; BlogProduce SEO uyumlu içeriği, görselleri
            ve meta etiketleriyle birlikte dakikalar içinde hazırlasın. RESTful API ile sisteminize
            anında entegre edin.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/register">
                Ücretsiz Başla
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/docs">API Dokümantasyonu</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <dl className="grid grid-cols-2 md:grid-cols-4">
            {stats.map((stat, index) => (
              <div
                key={stat.value}
                className={`flex flex-col gap-2 px-6 py-8 ${
                  index < stats.length - 1 ? "md:border-r md:border-border" : ""
                }`}
              >
                <dt className="text-2xl font-semibold tracking-tight text-primary md:text-3xl">
                  {stat.value}
                </dt>
                <dd className="whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
