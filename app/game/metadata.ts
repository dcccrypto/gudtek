import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Token Dodge Game | Play-to-Earn Solana Game | GUD TEK',
  description: 'Play Token Dodge - the ultimate Solana memecoin game! Catch $GUDTEK tokens, avoid scams, and compete for weekly airdrops. Connect your Solana wallet to start playing.',
  keywords: [
    'token dodge', 'solana game', 'crypto game', 'play to earn', 'p2e',
    'gudtek game', 'memecoin game', 'solana gaming', 'blockchain game',
    'crypto gaming', 'web3 game', 'defi game', 'token collection',
    'solana ecosystem', 'wallet gaming', 'crypto rewards', 'game airdrop'
  ],
  openGraph: {
    title: 'Token Dodge Game | Play-to-Earn Solana Game | GUD TEK',
    description: 'Play Token Dodge - the ultimate Solana memecoin game! Catch $GUDTEK tokens, avoid scams, and compete for weekly airdrops.',
    images: [
      {
        url: '/images/token-dodge-game.png',
        width: 1200,
        height: 630,
        alt: 'Token Dodge Game - Solana Play-to-Earn',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Token Dodge Game | Play-to-Earn Solana Game',
    description: 'Play Token Dodge and earn $GUDTEK tokens! The ultimate Solana memecoin game.',
    images: ['/images/token-dodge-game.png'],
  },
  alternates: {
    canonical: 'https://gudtek.club/game',
  },
} 