"use client"

import Link from "next/link"
import { ArrowDown } from "lucide-react"

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
    <section className="min-h-screen flex flex-col justify-center pt-20 relative overflow-hidden" id="features">
      <div
        className="absolute pointer-events-none animate-orb-rotate -z-10"
        style={{
          right: "-8rem",
          top: "8rem",
          width: "600px",
          height: "600px",
        }}
      >
        <div
          className="w-full h-full rounded-full"
          style={{
            background: "radial-gradient(ellipse at center, rgba(32,62,236,0.25) 0%, rgba(0,212,255,0.15) 40%, rgba(139,92,246,0.08) 70%, transparent 100%)",
            filter: "blur(60px)",
          }}
        />
      </div>

      <div
        className="absolute pointer-events-none -z-10"
        style={{
          left: "-4rem",
          bottom: "10rem",
          width: "400px",
          height: "400px",
        }}
      >
        <div
          className="w-full h-full rounded-full"
          style={{
            background: "radial-gradient(ellipse at center, rgba(0,212,255,0.12) 0%, rgba(32,62,236,0.06) 50%, transparent 100%)",
            filter: "blur(80px)",
          }}
        />
      </div>

      <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-20 md:py-32 md:pb-4 pb-4 pt-4 md:pt-32">
        <div className="max-w-4xl">
          <p
            className="mb-6 text-lg font-normal"
            style={{ color: "var(--muted-foreground)" }}
          >
            AI destekli blog üretim platformu — SEO optimizasyonlu içerikler
          </p>

          <h1 className="font-mono font-normal text-5xl md:text-7xl leading-[1] tracking-tight">
            {words.map((word, index) => (
              <span
                key={index}
                className={`hero-word py-2 ${word === "AI" ? "" : ""}`}
                style={{
                  animationDelay: `${index * 0.08}s`,
                  marginRight: index < words.length - 1 ? "0.25em" : "0",
                  ...(word === "AI"
                    ? {
                        background: "linear-gradient(135deg, #ff006e 0%, #8b5cf6 33%, #203eec 66%, #00d4ff 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        filter:
                          "drop-shadow(0 0 20px rgba(255,0,110,0.3)) drop-shadow(0 0 30px rgba(139,92,246,0.3)) drop-shadow(0 0 40px rgba(0,212,255,0.2))",
                      }
                    : {}),
                }}
              >
                {word}
              </span>
            ))}
          </h1>

          <p
            className="mt-8 max-w-xl leading-relaxed text-left text-lg"
            style={{ color: "var(--muted-foreground)" }}
          >
            Sadece bir başlık veya anahtar kelime girin; BlogProduce SEO uyumlu içeriği, görselleri ve meta etiketleriyle birlikte dakikalar içinde hazırlasın. RESTful API ile sisteminize anında entegre edin.
          </p>

          <div className="flex flex-row items-start gap-4 mt-10">
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white rounded-full transition-all relative overflow-hidden group"
              style={{
                background: "linear-gradient(135deg, #203eec 0%, #00d4ff 100%)",
                boxShadow: "0 4px 20px rgba(32, 62, 236, 0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 8px 30px rgba(32, 62, 236, 0.5), 0 0 40px rgba(0, 212, 255, 0.3)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(32, 62, 236, 0.3)"
              }}
            >
              <span className="relative z-10">Ücretsiz Başla</span>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl bg-gradient-to-r from-[#203eec] to-[#00d4ff]" />
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 px-8 py-4 text-base font-medium transition-colors"
              style={{ color: "#203eec" }}
            >
              API Dokümantasyonu
              <ArrowDown className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      <div
        className="w-full mt-16 md:mt-24"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="max-w-[1280px] mx-auto px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
            {stats.map((stat, index) => (
              <div
                key={stat.value}
                className="py-8 px-6 flex flex-col gap-2"
                style={{
                  borderRight: index < stats.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <span
                  className="text-2xl md:text-3xl font-semibold tracking-tight"
                  style={{ color: "#203eec" }}
                >
                  {stat.value}
                </span>
                <p
                  className="text-xs leading-relaxed whitespace-pre-line"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
