import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'WiFi Sensing RuView',
  description: 'Real-time WiFi CSI sensing dashboard — ESP32-S3',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  )
}
