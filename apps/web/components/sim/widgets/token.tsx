"use client"

import { useState } from "react"
import { Send } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { form, recordedFetch } from "@/lib/sim/http"
import type { Exchange, TokenResponse } from "@/lib/sim/types"
import { HttpView } from "../http-view"
import { useSim } from "../context"
import { ActionButton, Callout, Experiment } from "./shared"
import { TokensView } from "./tokens-view"

/** Scambio authorization code → token (con client_secret o con PKCE). */
export function TokenWidget() {
  const { flow, creds, data, patch, complete, record, done } = useSim()
  const [busy, setBusy] = useState(false)
  const [tamper, setTamper] = useState(false)
  const [last, setLast] = useState<Exchange>()
  const code = data.callback?.params.code

  if (!creds || !code) return <Callout tone="error" title="Manca il codice: rifai il login." />

  const body = form({
    grant_type: "authorization_code",
    code,
    redirect_uri: creds.redirect_uri,
    client_id: creds.client_id,
    ...(flow.pkce
      ? { code_verifier: tamper ? "verifier-indovinato-da-un-attaccante-0000000000" : data.verifier }
      : { client_secret: tamper ? "sec_sbagliato" : creds.client_secret }),
  })

  async function send() {
    setBusy(true)
    const ex = await recordedFetch("token", "Scambio del codice", "/api/oauth/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    })
    record(ex)
    setLast(ex)
    setBusy(false)
    const res = ex.response!.body as TokenResponse
    if (ex.response!.status === 200) {
      patch({ tokens: res })
      complete("token")
    }
  }

  const err = last && last.response!.status >= 400 ? (last.response!.body as TokenResponse) : null

  return (
    <div className="space-y-4">
      <Experiment on={tamper} onChange={setTamper}>
        {flow.pkce
          ? "un attaccante ha rubato il codice ma non conosce il code_verifier."
          : "un attaccante prova lo scambio con un client_secret sbagliato."}
      </Experiment>
      <div className="flex flex-wrap gap-3">
        <ActionButton onClick={send} busy={busy}>
          <Send /> {done.has("token") ? "Invia di nuovo lo stesso codice" : "Invia la richiesta a LabID"}
        </ActionButton>
      </div>
      {done.has("token") && !err && (
        <p className="text-xs text-muted-foreground">
          💡 Prova a reinviare lo stesso codice: un codice vale una volta sola!
        </p>
      )}
      {last && <HttpView exchange={last} />}
      {err && (
        <Callout tone="error" title={`LabID dice: ${err.error}`}>
          {err.error_description}
          {tamper && <Button size="sm" variant="outline" className="mt-2 flex" onClick={() => setTamper(false)}>Spegni l&apos;esperimento</Button>}
        </Callout>
      )}
      {data.tokens && !err && (
        <>
          <Callout title="Hai ottenuto i token! 🎉">
            Clicca su un token per vederne il contenuto decodificato.
          </Callout>
          <TokensView tokens={data.tokens} />
        </>
      )}
    </div>
  )
}
