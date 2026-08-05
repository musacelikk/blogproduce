"use client"

import { useEffect, useState } from "react"

export function GradientBar() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const featuresSection = document.querySelector("#features") || document.querySelector("#ozellikler")
      if (featuresSection) {
        const rect = featuresSection.getBoundingClientRect()
        const isSectionVisible = rect.top < window.innerHeight && rect.bottom > 0
        setIsVisible(isSectionVisible)
      } else {
        setIsVisible(window.scrollY > 100)
      }
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div
      aria-hidden
      className={`bottom-gradient-bar transition-opacity duration-500 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    />
  )
}
