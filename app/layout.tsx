import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
const inter = Inter({ subsets: ["latin"] })
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "Wanneer stopt het met regenen? - Nederlandse regenvoorspelling",
  description:
    "Nauwkeurige regenvoorspelling voor Nederland. Ontdek wanneer het stopt met regenen met KNMI HARMONIE-AROME data.",
  generator: "v0.app",
  keywords: "regen, voorspelling, Nederland, KNMI, weer, regenradar",
  viewport: "width=device-width, initial-scale=1",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="nl">
      <body className={inter.className}>
        <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  )
}
