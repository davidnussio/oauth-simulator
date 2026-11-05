"use client"

import { useSearchParams } from "next/navigation"
import { useSyncExternalStore } from "react"
import { OctagonAlert } from "lucide-react"

import { withBase } from "@/lib/base-path"
import { parseScopes } from "@/lib/oauth/scopes"
import { CLIENT_PREFIX } from "@/lib/oauth/server"
import { AuthorizeForm } from "./authorize-form"

const subscribe = () => () => {}

/** Valida i parametri della richiesta prima di mostrare login e consenso. */
export function AuthorizeGate() {
  const sp = useSearchParams()
  const origin = useSyncExternalStore(subscribe, () => window.location.origin, () => null)
  if (!origin) return null

  const p = Object.fromEntries(sp.entries()) as Record<string, string | undefined>
  const expected = `${origin}${withBase("/callback")}`
  const problems: string[] = []
  if (!p.client_id?.startsWith(CLIENT_PREFIX)) problems.push("client_id mancante o sconosciuto")
  if (p.redirect_uri !== expected) problems.push(`redirect_uri non registrato (atteso ${expected})`)
  if (p.response_type !== "code" && p.response_type !== "token") problems.push("response_type deve essere code o token")

  if (problems.length) {
    return (
      <div className="glass w-full max-w-md rounded-2xl p-6">
        <div className="mb-3 flex items-center gap-2 font-semibold text-destructive">
          <OctagonAlert className="size-5" /> Richiesta non valida
        </div>
        <p className="mb-3 text-sm text-muted-foreground">
          Il server di autorizzazione <b>non reindirizza</b> verso l&apos;app quando client o redirect_uri non sono
          affidabili: potrebbe essere un tentativo di furto del codice.
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {problems.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </div>
    )
  }

  return <AuthorizeForm params={p} scopes={parseScopes(p.scope)} />
}
