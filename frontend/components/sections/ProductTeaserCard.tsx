'use client';

import { ArrowUpRight, Code2, Search, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

type ProductTeaserCardProps = {
  dailyVolume?: string;
  dailyVolumeLabel?: string;
  headline?: string;
  subheadline?: string;
  primaryButtonText?: string;
  primaryButtonHref?: string;
  secondaryButtonText?: string;
  secondaryButtonHref?: string;
};

const valuePills = [
  { icon: Code2, label: 'API ile sitene direkt göm' },
  { icon: Search, label: 'SEO için çok etkili' },
  { icon: Zap, label: 'Kurulumu çok basit' },
];

export const ProductTeaserCard = (props: ProductTeaserCardProps) => {
  const router = useRouter();
  const {
    dailyVolumeLabel = 'GÜNLÜK ÜRETİLEN BLOG',
    headline = "SEO'ya uygun blog içeriği. API ile sitenize direkt gömün.",
    subheadline =
      "Prompt yazın, AI ile özgün blog üretin. RESTful API ile içeriği sitenize, uygulamanıza veya otomasyona tek satırla entegre edin. Çok basit — dakikalar içinde hazır.",
    primaryButtonText = 'Ücretsiz Dene',
    primaryButtonHref = '#pricing',
    secondaryButtonText = 'API Dokümantasyonu',
    secondaryButtonHref = '/docs',
  } = props;

  return (
    <>
      {/* Hero — full bleed gradient */}
      <section
        id="home"
        className="relative w-full overflow-hidden bg-gradient-to-b from-slate-50 via-blue-50/30 to-white pt-24 md:pt-28 lg:pt-32 pb-14 md:pb-20 lg:pb-24"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.12),transparent)] pointer-events-none" />
        <div className="absolute top-0 right-0 w-[60%] h-[70%] bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.08),transparent_50%)] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
            <div className="max-md:max-w-xl md:max-w-2xl lg:max-w-none">
              <p
                className="inline-flex items-center gap-1.5 text-xs md:text-sm font-medium uppercase tracking-widest text-blue-600 mb-6"
                style={{ fontFamily: 'var(--font-mono), "JetBrains Mono", monospace' }}
              >
                {dailyVolumeLabel}
                <ArrowUpRight className="w-4 h-4" />
              </p>
              <h1
                className="text-3xl md:text-[2.25rem] lg:text-5xl xl:text-[3.25rem] font-semibold leading-[1.15] tracking-tight text-slate-900 mb-4 md:mb-5 lg:mb-6"
                style={{ fontFamily: 'var(--font-display), "Space Grotesk", sans-serif' }}
              >
                {headline}
              </h1>
              <p
                className="text-base md:text-[1.0625rem] lg:text-lg text-slate-600 leading-relaxed max-w-xl mb-6 md:mb-8"
                style={{ fontFamily: 'var(--font-sans), "Inter", sans-serif' }}
              >
                {subheadline}
              </p>

              <div className="flex flex-wrap gap-2 mb-6 md:mb-8">
                {valuePills.map(({ icon: Icon, label }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-2 px-3.5 py-2 md:px-4 md:py-2 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200/80 text-slate-700 text-xs md:text-sm font-medium shadow-sm"
                    style={{ fontFamily: 'var(--font-sans), "Inter", sans-serif' }}
                  >
                    <Icon className="w-4 h-4 text-blue-500" />
                    {label}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => router.push('/login')}
                  className="inline-flex items-center justify-center px-6 py-3.5 rounded-2xl bg-blue-600 text-white font-semibold text-base shadow-lg shadow-blue-600/25 hover:bg-blue-700 hover:shadow-blue-600/30 transition-all duration-200"
                  style={{ fontFamily: 'var(--font-display), "Space Grotesk", sans-serif' }}
                >
                  {primaryButtonText}
                </button>
                <Link
                  href={secondaryButtonHref}
                  className="inline-flex items-center justify-center px-6 py-3.5 rounded-2xl border-2 border-slate-900 text-slate-900 font-semibold text-base hover:bg-slate-900 hover:text-white transition-all duration-200"
                  style={{ fontFamily: 'var(--font-display), "Space Grotesk", sans-serif' }}
                >
                  {secondaryButtonText}
                </Link>
              </div>
            </div>

            <div className="relative lg:pl-8 order-first lg:order-none max-w-2xl mx-auto lg:max-w-none lg:mx-0">
              <div className="relative rounded-2xl md:rounded-3xl overflow-hidden shadow-xl md:shadow-2xl shadow-slate-200/60 ring-1 ring-slate-200/80 bg-white aspect-[4/3] max-h-[280px] md:max-h-[360px] lg:max-h-[420px]">
                <Image
                  src="/images/Gemini_Generated_Image_5oknoz5oknoz5okn.png"
                  alt="BlogProduce — AI destekli blog üretimi"
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              </div>
              <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-2xl bg-blue-500/10 blur-2xl" />
              <div className="absolute -top-2 -right-2 w-32 h-32 rounded-full bg-blue-400/10 blur-2xl" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
