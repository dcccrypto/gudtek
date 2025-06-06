import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Gud Tek - Hackathon-Powered BONK Tech | Solana Meme Coin',
  description: 'Gud Tek is a revolutionary hackathon-powered BONK tech project on Solana. Join the community, track live charts, and be part of the future of decentralized technology.',
  keywords: 'Gud Tek, BONK, Solana, cryptocurrency, meme coin, hackathon, blockchain, DeFi, crypto trading',
  authors: [{ name: 'Gud Tek Team' }],
  creator: 'Gud Tek',
  publisher: 'Gud Tek',
  robots: 'index, follow',
  openGraph: {
    title: 'Gud Tek - Hackathon-Powered BONK Tech',
    description: 'Revolutionary hackathon-powered BONK tech on Solana. Track live charts, join our community, and experience the future of decentralized technology.',
    url: 'https://gudtek.com',
    siteName: 'Gud Tek',
    images: [
      {
        url: '/images/gudtek-logo.png',
        width: 1200,
        height: 630,
        alt: 'Gud Tek Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gud Tek - Hackathon-Powered BONK Tech',
    description: 'Revolutionary hackathon-powered BONK tech on Solana. Join the community and experience the future!',
    images: ['/images/gudtek-logo.png'],
    creator: '@GudTekOfficial',
  },
  alternates: {
    canonical: 'https://gudtek.com',
  },
  verification: {
    // Add verification codes when available
    // google: 'verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#f97316" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
