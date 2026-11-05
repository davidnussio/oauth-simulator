import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import "@workspace/ui/globals.css"
import { Providers } from "@/components/providers"

const fontSans = Geist({ subsets: ["latin"], variable: "--font-sans" })
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

const THEME_SCRIPT = `try{var t=localStorage.getItem("theme")||"dark";var d=document.documentElement;d.classList.remove("light","dark");d.classList.add(t);d.style.colorScheme=t}catch(e){}`

export const metadata: Metadata = {
  title: { default: "OAuth Lab · OAuth 2.0 spiegato for dummies", template: "%s · OAuth Lab" },
  description:
    "Un simulatore interattivo e animato per capire OAuth 2.0 e OpenID Connect passo dopo passo, con un vero server di autorizzazione.",
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#16141f" },
    { media: "(prefers-color-scheme: light)", color: "#fbfbfe" },
  ],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it" className="dark" suppressHydrationWarning>
      <head>
        {/* applica il tema prima del primo paint (niente flash) */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
