"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { ArrowDown, Dices, RefreshCw } from "lucide-react"

import { randomString, sha256base64url } from "@/lib/sim/pkce"
import { useSim } from "../context"
import { ActionButton, Callout, Scramble } from "./shared"

export function PkceWidget() {
  const { data, patch, complete, flow } = useSim()
  const [busy, setBusy] = useState(false)

  async function generate() {
    setBusy(true)
    const verifier = randomString(64)
    const challenge = await sha256base64url(verifier)
    patch({ verifier, challenge })
    setBusy(false)
    complete("pkce")
  }

  if (!data.verifier) {
    return (
      <ActionButton onClick={generate} busy={busy}>
        <Dices className="transition-transform group-hover:rotate-45" /> Genera il segreto
      </ActionButton>
    )
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-actor-app/40 bg-actor-app/5 p-4">
        <div className="mb-1 flex items-center justify-between text-xs font-medium text-actor-app">
          🤫 code_verifier — resta segreto nell&apos;app ({data.verifier.length} caratteri)
          <button onClick={generate} className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
            <RefreshCw className="size-3" /> rigenera
          </button>
        </div>
        <Scramble text={data.verifier} className="text-sm" />
      </div>
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <motion.span animate={{ y: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.4 }}>
          <ArrowDown className="size-4" />
        </motion.span>
        SHA-256 + base64url (funzione a senso unico: dall&apos;impronta non si torna indietro)
      </div>
      <div className="rounded-xl border border-actor-auth/40 bg-actor-auth/5 p-4">
        <div className="mb-1 text-xs font-medium text-actor-auth">🧬 code_challenge — verrà inviato a LabID</div>
        <Scramble text={data.challenge!} className="text-sm" />
      </div>
      <Callout title="Segreto pronto!">
        {flow.oidc ? "Nel prossimo passo partirà la richiesta con l'impronta e un nonce." : "Nel prossimo passo l'app manderà solo l'impronta."}
      </Callout>
    </div>
  )
}
