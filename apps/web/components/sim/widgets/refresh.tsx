"use client"

import { useState } from "react"
import { RefreshCw, Undo2 } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { form, recordedFetch } from "@/lib/sim/http"
import type { Exchange, TokenResponse } from "@/lib/sim/types"
import { HttpView } from "../http-view"
import { useSim } from "../context"
import { ActionButton, Callout } from "./shared"
import { TokensView } from "./tokens-view"

export function RefreshWidget() {
  const { creds, data, patch, complete, record, flow, done } = useSim()
  const [busy, setBusy] = useState(false)
  const [last, setLast] = useState<Exchange>()

  if (!creds) return null
  const rt = data.tokens?.refresh_token

  if (!rt && !data.usedRefresh) {
    return (
      <Callout tone="info" title="Nessun refresh token ricevuto">
        Probabilmente hai tolto la spunta a <code>offline_access</code> nel consenso: è proprio a questo che serve! Senza
        quel permesso, quando il token scade l&apos;app deve rimandarti al login.
        {!done.has("refresh") && (
          <Button size="sm" className="mt-2 flex" onClick={() => complete("refresh")}>
            Ho capito
          </Button>
        )}
      </Callout>
    )
  }

  async function send(token: string, label: string) {
    setBusy(true)
    const ex = await recordedFetch("refresh", label, "/api/oauth/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: form({
        grant_type: "refresh_token",
        refresh_token: token,
        client_id: creds!.client_id,
        client_secret: flow.confidential ? creds!.client_secret : undefined,
      }),
    })
    record(ex)
    setLast(ex)
    setBusy(false)
    if (ex.response!.status === 200) {
      patch({ tokens: ex.response!.body as TokenResponse, usedRefresh: token })
      complete("refresh")
    }
  }

  const err = last && last.response!.status >= 400 ? (last.response!.body as TokenResponse) : null

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {rt && (
          <ActionButton busy={busy} onClick={() => send(rt, "Rinnovo token")}>
            <RefreshCw /> Rinnova il token
          </ActionButton>
        )}
        {data.usedRefresh && (
          <ActionButton variant="outline" busy={busy} onClick={() => send(data.usedRefresh!, "Riuso vecchio refresh token")}>
            <Undo2 /> Riusa il vecchio refresh token
          </ActionButton>
        )}
      </div>
      {err && (
        <Callout tone="error" title={`LabID dice: ${err.error}`}>
          {err.error_description} Se un ladro avesse copiato il vecchio refresh token, ora non gli servirebbe più.
        </Callout>
      )}
      {!err && last && data.tokens && (
        <>
          <Callout title="Token rinnovati senza rifare il login!">
            Nota che anche il refresh token è cambiato (rotazione).
          </Callout>
          <TokensView tokens={data.tokens} />
        </>
      )}
      {last && <HttpView exchange={last} />}
    </div>
  )
}
