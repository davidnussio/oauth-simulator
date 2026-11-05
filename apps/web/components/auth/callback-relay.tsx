"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Loader2, Smartphone } from "lucide-react"

export function CallbackRelay() {
  const [standalone, setStandalone] = useState(false)
  const [href, setHref] = useState("")

  useEffect(() => {
    const h = window.location.href
    if (window.parent !== window) {
      window.parent.postMessage({ type: "oauth-lab:callback", href: h }, window.location.origin)
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- legge la URL solo lato client
      setStandalone(true)
      setHref(h)
    }
  }, [])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklch,var(--actor-app)_22%,transparent),transparent_60%)] p-6 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-actor-app text-white">
        <Smartphone />
      </span>
      {standalone ? (
        <>
          <h1 className="font-semibold">Callback ricevuta</h1>
          <code className="max-w-xl rounded-lg bg-muted p-3 text-xs break-all">{href}</code>
          <Link href="/" className="text-sm text-primary underline">
            Torna al simulatore
          </Link>
        </>
      ) : (
        <>
          <Loader2 className="size-5 animate-spin text-actor-app" />
          <p className="text-sm text-muted-foreground">Ritorno all&apos;App Foto con la risposta…</p>
        </>
      )}
    </div>
  )
}
