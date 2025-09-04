import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
const inter = Inter({ subsets: ["latin"] })
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "Wanneer stopt het met regenen? | Regenvoorspelling Nederland - wanneerstopthetmetregenen.nl",
  description:
    "Wanneer stopt het met regenen? Bekijk de actuele regenvoorspelling voor Nederland. Direct antwoord op jouw vraag met KNMI HARMONIE-AROME data. wanneerstopthetmetregenen.nl.",
  generator: "Next.js",
  keywords: "wanneer stopt het met regenen, regen, voorspelling, Nederland, KNMI, weer, regenradar, buien, weerbericht, wanneerstopthetmetregenen.nl",
  viewport: "width=device-width, initial-scale=1",
  openGraph: {
    title: "Wanneer stopt het met regenen? | Regenvoorspelling Nederland",
    description: "Bekijk direct wanneer het stopt met regenen in Nederland. Actuele regenvoorspelling.",
    url: "https://wanneerstopthetmetregenen.nl",
    siteName: "Wanneer stopt het met regenen?",
    images: [
      {
        url: "/globe.svg",
        width: 1200,
        height: 630,
        alt: "Wanneer stopt het met regenen? Regenvoorspelling Nederland",
      },
    ],
    locale: "nl_NL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wanneer stopt het met regenen? | Regenvoorspelling Nederland",
    description: "Bekijk direct wanneer het stopt met regenen in Nederland. Actuele regenvoorspelling.",
    site: "@wanneerstopthetmetregenen",
    images: ["/globe.svg"],
  },
  alternates: {
    canonical: "https://wanneerstopthetmetregenen.nl",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
  "max-snippet": -1,
  "max-image-preview": "large",
  "max-video-preview": -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="nl">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        <meta name="theme-color" content="#2563eb" />
        {/* Structured Data for Rich Results */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "url": "https://wanneerstopthetmetregenen.nl",
            "name": "Wanneer stopt het met regenen?",
            "description": "Bekijk direct wanneer het stopt met regenen in Nederland. Actuele regenvoorspelling.",
            "inLanguage": "nl-NL",
            "image": "https://wanneerstopthetmetregenen.nl/globe.svg",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://wanneerstopthetmetregenen.nl/?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          })
        }} />
      </head>
      <body className={inter.className}>
        <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  )
}
