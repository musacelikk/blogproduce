"use client"

import Link from "next/link"
import Image from "next/image"
import { Github, Linkedin, Twitter, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const socialLinks = [
  { href: "https://twitter.com", icon: Twitter, label: "Twitter" },
  { href: "https://linkedin.com", icon: Linkedin, label: "LinkedIn" },
  { href: "https://github.com", icon: Github, label: "GitHub" },
  { href: "mailto:hello@blogproduce.com", icon: Mail, label: "E-posta" },
]

const productLinks = [
  { href: "/solutions", label: "Çözümler" },
  { href: "/pricing", label: "Fiyatlandırma" },
  { href: "/docs", label: "API Dokümantasyonu" },
  { href: "/faq", label: "SSS" },
]

const companyLinks = [
  { href: "/about", label: "Hakkımızda" },
  { href: "/contact", label: "İletişim" },
  { href: "/", label: "Ana Sayfa" },
]

const legalLinks = [
  { href: "/kvkk", label: "KVKK" },
  { href: "/privacy", label: "Gizlilik" },
  { href: "/terms", label: "Şartlar" },
  { href: "/cookie", label: "Çerezler" },
]

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Link href="/" className="inline-flex items-center" aria-label="BlogProduce ana sayfa">
              <Image
                src="/images/logo.png"
                alt="BlogProduce"
                width={400}
                height={400}
                className="h-10 w-auto object-contain"
              />
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted-foreground">
              AI destekli blog içerik üretim platformu. Prompt yazın, SEO uyumlu profesyonel blog
              içerikleri dakikalar içinde hazır.
            </p>
            <Link
              href="mailto:hello@blogproduce.com"
              className="mt-5 inline-block text-sm font-medium text-accent-foreground transition-colors duration-fast ease-out-quart hover:underline"
            >
              hello@blogproduce.com
            </Link>
            <div className="mt-6 flex items-center gap-2">
              {socialLinks.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface-raised text-muted-foreground transition-colors duration-fast ease-out-quart hover:border-strong hover:bg-accent hover:text-accent-foreground"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-eyebrow">Ürün</h4>
            <ul className="mt-5 space-y-3">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors duration-fast ease-out-quart hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-eyebrow">Kurumsal</h4>
            <ul className="mt-5 space-y-3">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors duration-fast ease-out-quart hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-4">
            <div className="rounded-xl border border-border bg-surface-sunken p-6">
              <h4 className="text-sm font-semibold text-foreground-strong">Güncel kalın</h4>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Ürün güncellemeleri ve içerik ipuçları için bültenimize katılın. Ayda bir e-posta,
                spam yok.
              </p>
              <form className="mt-5 flex flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
                <Input type="email" placeholder="E-posta adresiniz" aria-label="E-posta adresiniz" />
                <Button type="submit">Abone Ol</Button>
              </form>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()}{" "}
            <a
              href="https://bilalorhanlar.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors duration-fast ease-out-quart hover:text-foreground"
            >
              Bilal ORHANLAR
            </a>
            . Tüm hakları saklıdır.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {legalLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-xs text-muted-foreground transition-colors duration-fast ease-out-quart hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
