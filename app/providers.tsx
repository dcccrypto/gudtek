'use client'

import SolanaProvider from '@/components/SolanaProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SolanaProvider>
      {children}
    </SolanaProvider>
  )
} 