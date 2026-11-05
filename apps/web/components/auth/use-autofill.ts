"use client"

import { useEffect } from "react"

/** Il simulatore (finestra padre) può inviare le credenziali per il "compila per me". */
export function useAutofill(fill: (u: string, p: string) => void) {
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return
      const d = e.data as { type?: string; username?: string; password?: string }
      if (d?.type === "oauth-lab:autofill" && d.username && d.password) fill(d.username, d.password)
    }
    window.addEventListener("message", onMsg)
    return () => window.removeEventListener("message", onMsg)
  }, [fill])
}
