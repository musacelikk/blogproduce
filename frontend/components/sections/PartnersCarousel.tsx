"use client"

const partners = ["OpenAI", "Vercel", "Stripe", "AWS", "Google", "Notion", "Figma", "Linear", "Shopify", "Slack"]

export const PartnersCarousel = () => {
  return (
    <section className="py-16 overflow-hidden" style={{ borderTop: "1px solid var(--border)" }}>
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 mb-8">
        <p className="text-sm text-center" style={{ color: "var(--muted-foreground)" }}>
          Dünya çapında lider şirketlerin güvendiği platform
        </p>
      </div>
      <div className="relative">
        <div
          className="absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
          style={{ background: "linear-gradient(90deg, var(--background), transparent)" }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
          style={{ background: "linear-gradient(270deg, var(--background), transparent)" }}
        />
        <div className="flex animate-marquee hover:[animation-play-state:paused]">
          {[...partners, ...partners].map((partner, index) => (
            <div key={`${partner}-${index}`} className="flex items-center justify-center min-w-[200px] px-8">
              <span className="text-2xl md:text-3xl font-semibold whitespace-nowrap" style={{ color: "rgba(107,107,107,0.4)" }}>
                {partner}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
