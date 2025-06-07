import './globals.css'
import { Inter } from 'next/font/google'
import SolanaProvider from '@/components/SolanaProvider'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Gud Tek - First BONK Hackathon Winner #1 | Solana Meme Coin',
  description: 'Gud Tek made history as the first ever BONK hackathon project and #1 winner on hackathon.letsbonk.fun. Revolutionary hackathon-powered BONK tech on Solana blockchain.',
  keywords: 'Gud Tek, BONK, Solana, cryptocurrency, meme coin, hackathon winner, blockchain, DeFi, crypto trading, hackathon.letsbonk.fun',
  authors: [{ name: 'Gud Tek Team' }],
  creator: 'Gud Tek',
  publisher: 'Gud Tek',
  robots: 'index, follow',
  openGraph: {
    title: 'Gud Tek - First BONK Hackathon Winner #1',
    description: 'Historic achievement: First ever BONK hackathon project and #1 winner. Experience revolutionary hackathon-powered BONK tech on Solana.',
    url: 'https://gudtek.com',
    siteName: 'Gud Tek',
    images: [
      {
        url: 'https://gudtek.com/images/gudtek-og-image.png',
        width: 1200,
        height: 630,
        alt: 'Gud Tek - First BONK Hackathon Winner',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gud Tek - First BONK Hackathon Winner #1',
    description: 'Historic achievement: First ever BONK hackathon project and #1 winner on hackathon.letsbonk.fun',
    creator: '@gudtek',
    images: ['https://gudtek.com/images/gudtek-og-image.png'],
  },
  icons: {
    icon: [
      { url: '/Untitleddesign(5).svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    shortcut: '/Untitleddesign(5).svg'
  },
  manifest: '/site.webmanifest',
  alternates: {
    canonical: 'https://gudtek.com',
  },
  verification: {
    google: 'your-google-verification-code',
  },
  category: 'Cryptocurrency',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preload" href="/bonk1-bonk-logo.svg" as="image" type="image/svg+xml" />
        <link rel="preload" href="/Untitleddesign(5).svg" as="image" type="image/svg+xml" />
        <link rel="preload" href="/x (1).svg" as="image" type="image/svg+xml" />
        <meta name="theme-color" content="#f97316" />
        <meta name="msapplication-TileColor" content="#f97316" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className={inter.className}>
        <SolanaProvider>
          {children}
          <Toaster />
        </SolanaProvider>
      </body>
    </html>
  )
}
