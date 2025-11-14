import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ClauseCraft - Agentic Document Editor',
  description: 'AI-powered document editor with line-based editing and citations',
  icons: {
    icon: '/images/title.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
