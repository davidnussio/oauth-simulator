"use client"

import { useEffect, useMemo } from "react"
import { motion } from "motion/react"
import { ExternalLink } from "lucide-react"

import { withBase } from "@/lib/base-path"
import { SCOPES, type Scope } from "@/lib/oauth/scopes"
import { randomString } from "@/lib/sim/pkce"
import { useSim } from "../context"
import { CopyButton } from "../code"
import { ActionButton, Experiment } from "./shared"

const EXPLAIN: Record<string, string> = {
  response_type: "cosa vuole l'app in cambio: un code (o un token, nel vecchio Implicit)",
  client_id: "chi è l'app",
  redirect_uri: "dove tornare dopo il consenso",
  scope: "quali permessi chiede",
  state: "valore casuale anti-CSRF, da ricontrollare al ritorno",
  code_challenge: "l'impronta del segreto PKCE",
  code_challenge_method: "come è stata calcolata l'impronta",
  nonce: "valore casuale che tornerà dentro l'id_token",
}

export function AuthorizeUrlWidget() {
  const { flow, creds, data, patch, complete, next } = useSim()

  // genera state/nonce una sola volta
  useEffect(() => {
    if (!data.state) patch({ state: randomString(16), ...(flow.oidc && { nonce: randomString(16) }) })
  }, [data.state, flow.oidc, patch])

  const evil = data.authorizeUrl?.includes("evil")

  const params = useMemo(() => {
    if (!creds || !data.state) return null
    const p: Record<string, string> = {
      response_type: flow.responseType ?? "code",
      client_id: creds.client_id,
      redirect_uri: creds.redirect_uri,
      scope: flow.scopes.join(" "),
      state: data.state,
    }
    if (flow.pkce && data.challenge) {
      p.code_challenge = data.challenge
      p.code_challenge_method = "S256"
    }
    if (data.nonce) p.nonce = data.nonce
    return p
  }, [creds, data.state, data.challenge, data.nonce, flow])

  const build = (p: Record<string, string>) =>
    `${window.location.origin}${withBase("/auth/authorize")}?${new URLSearchParams(p)}`

  useEffect(() => {
    if (params && !data.authorizeUrl) patch({ authorizeUrl: build(params) })
  }, [params, data.authorizeUrl, patch])

  if (!params) return <div className="h-40 animate-pulse rounded-xl bg-muted/40" />

  const shown = evil ? { ...params, redirect_uri: "https://evil.example/rubacodici" } : params

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border bg-background/50">
        <div className="flex items-center gap-2 border-b bg-muted/40 px-3 py-2 font-mono text-xs">
          <span className="font-semibold text-primary">GET</span>
          <span className="flex-1 truncate">
            {window.location.origin}
            {withBase("/auth/authorize")}?…
          </span>
          <CopyButton text={data.authorizeUrl ?? ""} />
        </div>
        <ul className="divide-y">
          {Object.entries(shown).map(([k, v], i) => (
            <motion.li
              key={k}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i }}
              className="grid gap-1 px-3 py-2 sm:grid-cols-[170px_1fr]"
            >
              <code className="text-xs font-semibold text-violet-500 dark:text-violet-300">{k}</code>
              <div className="min-w-0">
                <div className={`font-mono text-xs break-all ${k === "redirect_uri" && evil ? "text-destructive" : ""}`}>{v}</div>
                <div className="text-xs text-muted-foreground">
                  {EXPLAIN[k]}
                  {k === "scope" &&
                    `: ${v
                      .split(" ")
                      .map((s) => SCOPES[s as Scope]?.emoji + " " + s)
                      .join(", ")}`}
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
      <Experiment
        on={!!evil}
        onChange={(on) =>
          patch({ authorizeUrl: build(on ? { ...params, redirect_uri: "https://evil.example/rubacodici" } : params) })
        }
      >
        un malintenzionato cambia il <code>redirect_uri</code> per farsi mandare il codice. LabID se ne accorgerà?
      </Experiment>
      <ActionButton
        onClick={() => {
          complete("authorize")
          next()
        }}
      >
        Vai su LabID <ExternalLink />
      </ActionButton>
    </div>
  )
}
