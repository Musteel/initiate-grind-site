import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Deadlock Trainer',
    template: '%s · Deadlock Trainer',
  },
  description:
    'Improve your Deadlock gameplay through interactive video puzzles. Watch real game situations, make decisions, and learn from the outcomes.',
  keywords: ['Deadlock', 'MOBA', 'trainer', 'puzzles', 'gameplay', 'esports', 'Valve'],
  authors: [{ name: 'Deadlock Trainer' }],
  openGraph: {
    title: 'Deadlock Trainer',
    description: 'Improve your Deadlock gameplay through interactive video puzzles.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Deadlock Trainer',
    description: 'Improve your Deadlock gameplay through interactive video puzzles.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  themeColor: '#0a0b0d',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
