import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { Toaster } from "@/components/ui/toaster"


const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true
})



export const metadata: Metadata = {
  metadataBase: new URL('https://gudtek.club'),
  title: {
    default: 'GUD TEK | Premium Solana Memecoin | $GUDTEK Token',
    template: '%s | GUD TEK - Solana Memecoin'
  },
  description: 'GUD TEK ($GUDTEK) - The premium Solana memecoin for crypto enthusiasts. Play Token Dodge, join the community, and ride the next big Solana pump with GUDTEK.',
  keywords: [
    'gudtek', 'solana', 'memecoin', 'solana memecoin', 'bonk', 'hackathon', 
    '$gudtek', 'solana token', 'crypto', 'defi', 'web3', 'blockchain',
    'solana ecosystem', 'meme token', 'crypto gaming', 'token dodge',
    'solana gaming', 'crypto community', 'memecoin pump', 'solana pump',
    'crypto investment', 'solana trading', 'meme coins', 'altcoin',
    'cryptocurrency', 'digital assets', 'solana network', 'spl token'
  ],
  authors: [{ name: 'GUD TEK Team' }],
  creator: 'GUD TEK',
  publisher: 'GUD TEK',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://gudtek.club',
    siteName: 'GUD TEK',
    title: 'GUD TEK | Premium Solana Memecoin | $GUDTEK Token',
    description: 'The premium Solana memecoin for crypto enthusiasts. Play Token Dodge, join the community, and ride the next big Solana pump with GUDTEK.',
    images: [
      {
        url: '/images/gudtek-og.png',
        width: 1200,
        height: 630,
        alt: 'GUD TEK - Premium Solana Memecoin',
        type: 'image/png',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@gudtek_official',
    creator: '@gudtek_official',
    title: 'GUD TEK | Premium Solana Memecoin | $GUDTEK Token',
    description: 'The premium Solana memecoin for crypto enthusiasts. Play Token Dodge, join the community, and ride the next big Solana pump.',
    images: ['/images/gudtek-og.png'],
  },
  alternates: {
    canonical: 'https://gudtek.club',
  },
  category: 'cryptocurrency',
  classification: 'Business',
  other: {
    'crypto-token': 'GUDTEK',
    'blockchain': 'Solana',
    'token-type': 'SPL',
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        {/* Essential Mobile Optimization */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="GUD TEK Game" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="HandheldFriendly" content="true" />
        <meta name="MobileOptimized" content="320" />
        
        {/* Touch and Gesture Optimization */}
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="apple-touch-fullscreen" content="yes" />
        
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#f97316" />
        <meta name="msapplication-TileColor" content="#f97316" />
        
        {/* Crypto & Financial Meta Tags */}
        <meta name="financial-content" content="cryptocurrency, blockchain, tokens" />
        <meta name="investment-risk" content="high-risk" />
        <meta name="target-audience" content="crypto enthusiasts, defi users, solana community" />
        
        {/* Performance & Technical */}
        {process.env.NODE_ENV === 'production' && (
          <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests" />
        )}
        <meta name="referrer" content="origin-when-cross-origin" />
        
        {/* JSON-LD Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "GUD TEK",
              "alternateName": "GUDTEK",
              "url": "https://gudtek.club",
              "logo": "https://gudtek.club/images/gudtek-logo.png",
              "description": "Premium Solana memecoin for crypto enthusiasts",
              "foundingDate": "2024",
              "industry": "Cryptocurrency",
              "sameAs": [
                "https://twitter.com/gudtek_official",
                "https://t.me/gudtek_official"
              ],
              "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "GUDTEK Services",
                "itemListElement": [
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Product",
                      "name": "GUDTEK Token",
                      "description": "Premium Solana memecoin token"
                    }
                  },
                  {
                    "@type": "Offer", 
                    "itemOffered": {
                      "@type": "VideoGame",
                      "name": "Token Dodge Game",
                      "description": "Play-to-earn crypto game on Solana"
                    }
                  }
                ]
              }
            })
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  )
}
