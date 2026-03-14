"use client"

import Link from "next/link"
import Image from "next/image"
import { Github, Linkedin, Twitter, Mail } from "lucide-react"

const socialLinks = [
  { href: "https://twitter.com", icon: Twitter, label: "Twitter" },
  { href: "https://linkedin.com", icon: Linkedin, label: "LinkedIn" },
  { href: "https://github.com", icon: Github, label: "GitHub" },
  { href: "mailto:hello@blogenerate.com", icon: Mail, label: "Email" },
]

const footerLinks = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/solutions", label: "Çözümler" },
  { href: "/pricing", label: "Fiyatlandırma" },
  { href: "/docs", label: "API Docs" },
  { href: "/about", label: "Hakkımızda" },
  { href: "/contact", label: "İletişim" },
  { href: "/faq", label: "SSS" },
]

const legalLinks = [
  { href: "/kvkk", label: "KVKK" },
  { href: "/privacy", label: "Gizlilik" },
  { href: "/terms", label: "Şartlar" },
  { href: "/cookie", label: "Çerezler" },
]

export const Footer = () => {
  return (
    <footer style={{ borderTop: "1px solid var(--border)" }}>
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5 text-xl font-semibold tracking-tight">
              <Image
                src="/images/logo.png"
                alt="BlogGenerator"
                width={400}
                height={400}
                className="w-44 h-44 object-contain"
              />
            </Link>
            <p
              className="mt-4 text-sm max-w-xs leading-relaxed"
              style={{ color: "var(--muted-foreground)" }}
            >
              AI destekli blog içerik üretim platformu. Prompt yazın, SEO uyumlu profesyonel blog içerikleri dakikalar içinde hazır.
            </p>
            <div className="flex items-center gap-3 mt-6">
              {socialLinks.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  className="p-2 rounded-full transition-colors"
                  style={{ backgroundColor: "var(--secondary)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(32, 62, 236, 0.1)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--secondary)"
                  }}
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" style={{ color: "#203eec" }} />
                </Link>
              ))}
            </div>
            <div className="mt-4">
              <Link
                href="mailto:hello@blogenerate.com"
                className="text-sm transition-colors hover:underline"
                style={{ color: "#203eec" }}
              >
                hello@blogenerate.com
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4">Sayfalar</h4>
            <ul className="space-y-3">
              {footerLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors"
                    style={{ color: "var(--muted-foreground)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "var(--foreground)" }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted-foreground)" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4">Güncel Kalın</h4>
            <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>
              Güncellemeler ve içerik ipuçları için bültenimize katılın.
            </p>
            <form className="flex flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="E-posta adresiniz"
                className="px-4 py-2.5 text-sm rounded-xl border-0 outline-none focus:ring-2"
                style={{
                  backgroundColor: "var(--secondary)",
                  color: "var(--foreground)",
                }}
              />
              <button
                type="submit"
                className="px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-all"
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
                Abone Ol
              </button>
            </form>
          </div>
        </div>

        <div
          className="flex flex-col md:flex-row items-center justify-between gap-4 mt-16 pt-8"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            © {new Date().getFullYear()} Skytech Veri Bilişim Hizmetleri A.Ş. Tüm hakları saklıdır.
          </p>
          <div className="flex items-center gap-6">
            {legalLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-xs transition-colors"
                style={{ color: "var(--muted-foreground)" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--foreground)" }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted-foreground)" }}
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
