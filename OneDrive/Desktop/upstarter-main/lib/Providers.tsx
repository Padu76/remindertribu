'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'

interface ProvidersProps {
  children: ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider
      // Refetch session ogni 5 minuti per mantenere token fresh
      refetchInterval={5 * 60}
      // Refetch quando la finestra torna in focus
      refetchOnWindowFocus={true}
      // Refetch quando si rileva che il token è scaduto
      refetchWhenOffline={false}
    >
      {children}
    </SessionProvider>
  )
}