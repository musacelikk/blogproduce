"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,box-shadow] duration-base ease-out-quart",
          isScrolled
            ? "border-b border-border bg-card/85 shadow-card backdrop-blur-md"
            : "border-b border-transparent bg-transparent",
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex h-16 items-center justify-between md:h-20">
            <Link href="/" className="flex items-center" aria-label="BlogProduce ana sayfa">
              <Image
                src="/images/logo.png"
                alt="BlogProduce"
                width={400}
                height={400}
                priority
                className="h-10 w-auto object-contain"
              />
            </Link>

            <div className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm transition-colors duration-fast ease-out-quart",
                    isActive(item.href)
                      ? "bg-accent font-medium text-accent-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="hidden items-center gap-2 md:flex">
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Giriş</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Ücretsiz Başla</Link>
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(true)}
              className="-mr-2 md:hidden"
              aria-label="Menüyü aç"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </nav>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-background md:hidden">
          <div className="flex h-full flex-col p-6">
            <div className="flex items-center justify-between">
              <Link
                href="/"
                className="flex items-center"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="BlogProduce ana sayfa"
              >
                <Image
                  src="/images/logo.png"
                  alt="BlogProduce"
                  width={400}
                  height={400}
                  className="h-10 w-auto object-contain"
                />
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(false)}
                className="-mr-2"
                aria-label="Menüyü kapat"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <nav className="mt-12 flex flex-col divide-y divide-border border-y border-border">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "py-4 text-2xl font-semibold tracking-tight transition-colors duration-fast ease-out-quart",
                    isActive(item.href)
                      ? "text-accent-foreground"
                      : "text-foreground-strong hover:text-primary",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-auto flex flex-col gap-3 pt-8">
              <Button asChild variant="outline" size="xl">
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  Giriş
                </Link>
              </Button>
              <Button asChild size="xl">
                <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                  Ücretsiz Başla
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
