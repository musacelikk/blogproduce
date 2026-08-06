"use client"

const partners = ["OpenAI", "Vercel", "Stripe", "AWS", "Google", "Notion", "Figma", "Linear", "Shopify", "Slack"]

export const PartnersCarousel = () => {
  return (
    <section className="overflow-hidden py-16 sm:py-20">
      <div className="mx-auto mb-10 max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-eyebrow">
          Dünya çapında lider ekiplerin güvendiği altyapı
        </p>
      </div>
      <div className="relative">
        <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-24 bg-[linear-gradient(90deg,var(--background),transparent)]" />
        <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-24 bg-[linear-gradient(270deg,var(--background),transparent)]" />
        <div className="flex animate-marquee hover:[animation-play-state:paused]">
          {[...partners, ...partners].map((partner, index) => (
            <div
              key={`${partner}-${index}`}
              className="flex min-w-[180px] items-center justify-center px-8"
            >
              <span className="whitespace-nowrap text-xl font-semibold tracking-tight text-muted-foreground/60 transition-colors duration-base ease-out-quart hover:text-muted-foreground md:text-2xl">
                {partner}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
