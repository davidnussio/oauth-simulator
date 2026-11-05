"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ChevronDown } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"
import { decodeJwt } from "@/lib/sim/pkce"
import { CodeBlock, CopyButton, Json, JwtString } from "./code"

const CLAIMS: Record<string, string> = {
  iss: "Chi ha emesso il token (issuer)",
  sub: "Di chi parla il token (subject)",
  aud: "A chi è destinato (audience)",
  exp: "Quando scade",
  iat: "Quando è stato emesso",
  jti: "ID univoco del token",
  scope: "I permessi concessi",
  client_id: "L'app che lo ha ottenuto",
  nonce: "Il valore casuale scelto dall'app",
  auth_time: "Quando hai fatto login",
  email: "La tua email",
  name: "Il tuo nome",
}

const when = (s: number) => new Date(s * 1000).toLocaleString("it-CH", { dateStyle: "short", timeStyle: "medium" })

/** Decodifica un JWT e spiega ogni claim. */
export function JwtView({ token, title, defaultOpen = false }: { token: string; title: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const { header, payload } = decodeJwt(token)

  return (
    <div className="overflow-hidden rounded-xl border bg-background/50">
      <div className="flex items-center gap-2 p-3">
        <button onClick={() => setOpen((o) => !o)} className="flex flex-1 items-center gap-2 text-left text-sm font-medium">
          <motion.span animate={{ rotate: open ? 180 : 0 }}>
            <ChevronDown className="size-4" />
          </motion.span>
          {title}
          <span className="ml-auto text-xs font-normal text-muted-foreground">{open ? "nascondi" : "apri e decodifica"}</span>
        </button>
        <CopyButton text={token} />
      </div>
      <div className="px-3 pb-3 font-mono text-[11px] leading-relaxed">
        <JwtString token={open ? token : token.slice(0, 90) + "…"} />
      </div>
      <AnimatePresence initial={false}>
        {open && payload && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid gap-3 border-t p-3 md:grid-cols-2">
              <div className="space-y-3">
                <CodeBlock label="Header (rosso)">
                  <Json value={header} />
                </CodeBlock>
                <p className="text-xs text-muted-foreground">
                  Il JWT è solo codificato in base64, <b>non cifrato</b>: chiunque può leggerlo. La{" "}
                  <span className="text-sky-400">firma (blu)</span> però garantisce che nessuno l&apos;abbia modificato.
                </p>
              </div>
              <div className="space-y-1.5">
                <div className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  Payload (viola) · cosa dice il token
                </div>
                {Object.entries(payload as Record<string, unknown>).map(([k, v], i) => (
                  <motion.div
                    key={k}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-baseline gap-2 rounded-lg bg-muted/40 px-2.5 py-1.5 text-xs"
                  >
                    <code className="font-semibold text-violet-500 dark:text-violet-300">{k}</code>
                    <span className="min-w-0 flex-1 truncate font-mono" title={String(v)}>
                      {["exp", "iat", "auth_time"].includes(k) && typeof v === "number" ? when(v) : String(v)}
                    </span>
                    {CLAIMS[k] && <span className={cn("hidden text-muted-foreground sm:inline")}>{CLAIMS[k]}</span>}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
