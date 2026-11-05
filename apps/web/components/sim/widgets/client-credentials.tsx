"use client"

import { useState } from "react"
import { Send } from "lucide-react"

import { form, recordedFetch } from "@/lib/sim/http"
import type { Exchange, TokenResponse } from "@/lib/sim/types"
import { HttpView } from "../http-view"
import { useSim } from "../context"
import { ActionButton, Callout, Experiment } from "./shared"
import { TokensView } from "./tokens-view"

export function ClientCredentialsWidget() {
  const { creds, data, patch, complete, record } = useSim()
  const [busy, setBusy] = useState(false)
  const [greedy, setGreedy] = useState(false)
  const [last, setLast] = useState<Exchange>()
  if (!creds) return null

  async function send() {
    setBusy(true)
    const ex = await recordedFetch("cc-token", "Client credentials", "/api/oauth/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: form({
        grant_type: "client_credentials",
        client_id: creds!.client_id,
        client_secret: creds!.client_secret,
        scope: greedy ? "reports:read photo" : "reports:read",
      }),
    })
    record(ex)
    setLast(ex)
    setBusy(false)
    if (ex.response!.status === 200) {
      patch({ tokens: ex.response!.body as TokenResponse })
      complete("cc-token")
    }
  }

  const err = last && last.response!.status >= 400 ? (last.response!.body as TokenResponse) : null

  return (
    <div className="space-y-4">
      <Experiment on={greedy} onChange={setGreedy}>
        il servizio prova a chiedere anche le <code>photo</code> di un utente.
      </Experiment>
      <ActionButton busy={busy} onClick={send}>
        <Send /> Chiedi il token
      </ActionButton>
      {err && (
        <Callout tone="error" title={`LabID dice: ${err.error}`}>
          {err.error_description}
        </Callout>
      )}
      {!err && data.tokens && (
        <>
          <Callout title="Token ottenuto, senza nessun utente coinvolto.">
            Guarda il campo <code>sub</code>: è il client stesso.
          </Callout>
          <TokensView tokens={data.tokens} />
        </>
      )}
      {last && <HttpView exchange={last} />}
    </div>
  )
}
