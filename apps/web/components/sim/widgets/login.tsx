"use client"

import { useCallback } from "react"

import { BrowserWindow } from "../browser-window"
import { useSim } from "../context"
import { Callout } from "./shared"

function parseCallback(href: string) {
  const u = new URL(href)
  const raw = u.hash.length > 1 ? u.hash.slice(1) : u.search.slice(1)
  return Object.fromEntries(new URLSearchParams(raw))
}

export function LoginWidget() {
  const { data, creds, patch, complete, next, step } = useSim()
  const stepId = step.id

  const onCallback = useCallback(
    (href: string) => {
      const params = parseCallback(href)
      patch({ callback: { href, params } })
      if (!params.error) {
        complete(stepId)
        setTimeout(next, 900)
      }
    },
    [patch, complete, next, stepId]
  )

  if (!data.authorizeUrl) return <Callout tone="error" title="Torna al passo precedente per preparare la richiesta." />

  const err = data.callback?.params.error
  return (
    <div className="space-y-3">
      <BrowserWindow src={data.authorizeUrl} creds={creds} onCallback={onCallback} />
      {err && (
        <Callout tone="error" title={`L'app ha ricevuto un errore: ${err}`}>
          {data.callback?.params.error_description} Ricarica la finestra (↻) per riprovare.
        </Callout>
      )}
      {data.callback && !err && <Callout title="Sei tornato all'app con la risposta di LabID!" />}
    </div>
  )
}
