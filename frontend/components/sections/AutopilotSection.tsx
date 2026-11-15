import Link from 'next/link';
import { ArrowUpRight, CalendarClock, Image as ImageIcon, Link2, ShieldCheck } from 'lucide-react';
import { SectionHeading } from './SectionHeading';
import { AutopilotMockup } from './mockups';

/**
 * Autopilot on the landing page.
 *
 * The product's newest capability and the one that most changes what
 * BlogProduce is — a site you connect rather than a tool you operate — but it
 * was invisible here. Claims are kept to what the feature actually does;
 * `$0.21` is the real Standard-tier projection for a daily cadence, not a
 * round number chosen to look good.
 */
const POINTS = [
  {
    icon: CalendarClock,
    title: 'Kendi konusunu kendi seçer',
    body: 'Sitenizi, sektörünüzü ve hedef kitlenizi okur, bir sonraki 25 konuyu planlar. Kuyruk azaldıkça kendi kendine dolar.',
  },
  {
    icon: ImageIcon,
    title: 'Görseliyle birlikte yazar',
    body: 'Her makaleye konusuna uygun bir kapak görseli seçer. Yazıyı siteniz için yazar, kendi yayınlarınıza içeriden bağlantı verir.',
  },
  {
    icon: Link2,
    title: 'Yayına kendisi alır',
    body: 'İsterseniz doğrudan yayınlar, isterseniz taslakta bekletip onayınızı sorar. Yayınlandığında webhook ile sitenize haber verir.',
  },
  {
    icon: ShieldCheck,
    title: 'Harcama üç yerden sınırlı',
    body: 'Tempo, aylık sert tavan ve planınızın kendi kotası. Hangisi önce dolarsa üretim orada durur — sürpriz fatura yok.',
  },
];

export function AutopilotSection() {
  return (
    <section id="otopilot" className="border-y border-border bg-card py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Otopilot"
          title="Siteyi bağlayın, blogu kendisi yazsın"
          description="Konu seçiminden yayına kadar her adımı otopilot üstlenir. Siz tempoyu ve bütçeyi belirlersiniz."
          action={
            <Link
              href="/dashboard/autopilot"
              className="hidden items-center gap-1.5 text-sm font-medium text-accent-foreground transition-colors duration-base ease-out-quart hover:underline md:inline-flex"
            >
              Otopilotu kur
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          }
        />

        <div className="mt-14 grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
          <dl className="grid gap-x-8 gap-y-9 sm:grid-cols-2 lg:grid-cols-1 lg:gap-y-8">
            {POINTS.map((point) => {
              const Icon = point.icon;
              return (
                <div key={point.title} className="flex gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <dt className="text-sm font-semibold text-foreground-strong">{point.title}</dt>
                    <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {point.body}
                    </dd>
                  </div>
                </div>
              );
            })}
          </dl>

          <div className="lg:sticky lg:top-24">
            <AutopilotMockup />
            <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
              Günde bir makale, standart kalitede, aylık ~$0.21 sağlayıcı maliyeti.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
