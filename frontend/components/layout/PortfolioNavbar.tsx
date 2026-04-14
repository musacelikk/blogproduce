"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import Image from "next/image"

const navItems = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/solutions", label: "Çözümler" },
  { href: "/pricing", label: "Fiyatlandırma" },
  { href: "/faq", label: "SSS" },
  { href: "/docs", label: "Docs" },
]

export const PortfolioNavbar = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname?.startsWith(href) ?? false
  }

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          backgroundColor: isScrolled ? "rgba(255,255,255,0.85)" : "transparent",
          backdropFilter: isScrolled ? "blur(12px)" : "none",
          borderBottom: isScrolled ? "1px solid var(--border)" : "none",
        }}
      >
        <div className="max-w-[1280px] mx-auto px-6 md:px-12">
          <nav className="flex items-center justify-between h-16 md:h-20">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-lg font-semibold tracking-tight"
              style={{ color: "var(--foreground)" }}
            >
              <Image
                src="/images/logo.png"
                alt="BlogProduce"
                width={400}
                height={400}
                className="w-44 h-44 object-contain"
              />
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm transition-colors"
                  style={{
                    color: isActive(item.href) ? "var(--foreground)" : "var(--muted-foreground)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--foreground)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = isActive(item.href)
                      ? "var(--foreground)"
                      : "var(--muted-foreground)"
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium transition-colors rounded-full"
                style={{ color: "var(--muted-foreground)" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--foreground)" }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted-foreground)" }}
              >
                Giriş
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-full text-white transition-all hover:shadow-xl relative overflow-hidden group"
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
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -mr-2"
              aria-label="Menüyü aç"
            >
              <Menu className="w-5 h-5" style={{ color: "var(--foreground)" }} />
            </button>
          </nav>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          style={{ backgroundColor: "var(--background)" }}
        >
          <div className="flex flex-col h-full p-6">
            <div className="flex items-center justify-between">
              <Link
                href="/"
                className="flex items-center gap-2 text-lg font-semibold tracking-tight"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Image
                  src="/images/logo.png"
                  alt="BlogProduce"
                  width={400}
                  height={400}
                  className="w-44 h-44 object-contain"
                />
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 -mr-2"
                aria-label="Menüyü kapat"
              >
                <X className="w-5 h-5" style={{ color: "var(--foreground)" }} />
              </button>
            </div>

            <nav className="flex flex-col gap-6 mt-12">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-3xl font-semibold transition-colors"
                  style={{ color: "var(--foreground)" }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-auto flex flex-col gap-3">
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-3 px-5 rounded-full text-center font-medium transition-colors"
                style={{
                  color: "var(--muted-foreground)",
                  border: "1px solid var(--border)",
                }}
              >
                Giriş
              </Link>
              <Link
                href="/register"
                onClick={() => setIsMobileMenuOpen(false)}
                className="inline-flex items-center justify-center w-full px-5 py-3.5 text-base font-semibold rounded-full text-white transition-all relative overflow-hidden group"
                style={{
                  background: "linear-gradient(135deg, #203eec 0%, #00d4ff 100%)",
                  boxShadow: "0 4px 20px rgba(32, 62, 236, 0.3)",
                }}
              >
                <span className="relative z-10">Ücretsiz Başla</span>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl bg-gradient-to-r from-[#203eec] to-[#00d4ff]" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
