"use client"

import { motion } from "motion/react"
import { Eye, History, ShieldOff, Unplug } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { useSim } from "../context"
import { Callout } from "./shared"

const RISKS = [
  { icon: History, text: "Il token resta nella cronologia del browser." },
  { icon: Eye, text: "Estensioni e script di terze parti possono leggerlo dall'URL." },
  { icon: ShieldOff, text: "Nessun client_secret né PKCE: chiunque lo intercetti lo può usare." },
  { icon: Unplug, text: "Niente refresh token: quando scade si rifà tutto il giro." },
]

export function ImplicitWidget() {
  const { data, patch, complete, next, done } = useSim()
  const href = data.callback?.href
  const p = data.callback?.params
  if (!href || !p?.access_token) return <Callout tone="error" title="Nessun token ricevuto: rifai il login." />

  const [base, hash] = href.split("#")

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-background/50 p-3 font-mono text-xs break-all">
        <span className="text-muted-foreground">{base}#</span>
        <motion.span
          className="rounded bg-warning/25 text-warning"
          animate={{ boxShadow: ["0 0 0 0 transparent", "0 0 0 4px color-mix(in oklch, var(--warning) 40%, transparent)", "0 0 0 0 transparent"] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          {hash}
        </motion.span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {RISKS.map((r, i) => (
          <motion.div
            key={r.text}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 * i }}
            className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm"
          >
            <r.icon className="mt-0.5 size-4 shrink-0 text-destructive" /> {r.text}
          </motion.div>
        ))}
      </div>
      {!done.has("implicit-callback") && (
        <Button
          onClick={() => {
            patch({
              tokens: {
                access_token: p.access_token,
                token_type: p.token_type,
                expires_in: Number(p.expires_in),
                scope: p.scope,
              },
            })
            complete("implicit-callback")
            next()
          }}
        >
          Ok, ho capito: usiamo comunque il token
        </Button>
      )}
    </div>
  )
}
