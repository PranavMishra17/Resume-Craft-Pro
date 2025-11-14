import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Resume-Craft-Pro - AI-Powered Resume Optimization',
  description: 'Optimize your resume for any job with AI-powered keyword analysis and format-preserving LaTeX/DOCX editing',
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
