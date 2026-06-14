import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Homefood Happiness',
  description: 'Local business manager for a home food operation.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
