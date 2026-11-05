"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"

import { withBase } from "@/lib/base-path"
import type { Credentials } from "@/lib/sim/types"
import { ensureServiceWorker } from "@/lib/sw"

const KEY = "oauth-lab:credentials"

type Ctx = { creds: Credentials | null; regenerate: () => Promise<void>; loading: boolean }
const CredentialsContext = createContext<Ctx>({ creds: null, regenerate: async () => {}, loading: true })

/**
 * Come nel playground di oauth.com: alla prima visita registriamo un client
 * e un utente di prova. Restano salvati nel browser.
 */
export function CredentialsProvider({ children }: { children: React.ReactNode }) {
  const [creds, setCreds] = useState<Credentials | null>(null)
  const [loading, setLoading] = useState(true)

  // registra client + utente (dopo aver attivato il Service Worker che fa da server)
  const register = useCallback(async () => {
    await ensureServiceWorker()
    const r = await fetch(withBase("/api/oauth/register"), { method: "POST" })
    const c = (await r.json()) as Credentials
    localStorage.setItem(KEY, JSON.stringify(c))
    setCreds(c)
    setLoading(false)
  }, [])

  const regenerate = useCallback(async () => {
    setLoading(true)
    await register()
  }, [register])

  useEffect(() => {
    const saved = localStorage.getItem(KEY)
    const c = saved ? (JSON.parse(saved) as Credentials) : null
    // se l'app gira su un altro host/percorso il redirect_uri va rigenerato
    if (c?.redirect_uri === `${window.location.origin}${withBase("/callback")}`) {
      void ensureServiceWorker().then(() => {
        setCreds(c)
        setLoading(false)
      })
    } else {
      void ensureServiceWorker().then(register)
    }
  }, [register])

  return <CredentialsContext value={{ creds, regenerate, loading }}>{children}</CredentialsContext>
}

export const useCredentials = () => useContext(CredentialsContext)
