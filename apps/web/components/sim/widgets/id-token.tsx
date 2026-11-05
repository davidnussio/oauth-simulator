"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "motion/react"
import { Check, X } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"
import { BASE_PATH } from "@/lib/base-path"
import { decodeJwt } from "@/lib/sim/pkce"
import { JwtView } from "../jwt-view"
import { useSim } from "../context"
import { Callout } from "./shared"

export function IdTokenWidget() {
  const { data, creds, complete } = useSim()
  const [shown, setShown] = useState(0)
  const idt = data.tokens?.id_token

  const [now] = useState(() => Date.now())
  const checks = useMemo(() => {
    const p = idt ? (decodeJwt(idt).payload as Record<string, unknown>) : null
    if (!p) return []
    return [
        { label: "iss: l'ha emesso LabID", ok: p.iss === window.location.origin + BASE_PATH, detail: String(p.iss) },
        { label: "aud: è destinato alla mia app", ok: p.aud === creds?.client_id, detail: String(p.aud) },
        { label: "exp: non è scaduto", ok: Number(p.exp) * 1000 > now, detail: new Date(Number(p.exp) * 1000).toLocaleTimeString("it-CH") },
        { label: "nonce: è quello che ho inventato io", ok: p.nonce === data.nonce, detail: String(p.nonce) },
    ]
  }, [idt, creds?.client_id, data.nonce, now])
  const allOk = checks.every((c) => c.ok)

  useEffect(() => {
    if (shown >= checks.length) {
      if (checks.length && allOk) complete("id-token")
      return
    }
    const t = setTimeout(() => setShown((s) => s + 1), 550)
    return () => clearTimeout(t)
  }, [shown, checks.length, allOk, complete])

  if (!idt) return <Callout tone="error" title="Nessun id_token: lo scope openid è stato concesso?" />

  return (
    <div className="space-y-4">
      <JwtView title="🪪 id_token" token={idt} defaultOpen />
      <div className="space-y-2">
        {checks.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, x: -10 }}
            animate={i < shown ? { opacity: 1, x: 0 } : { opacity: 0.25, x: 0 }}
            className="flex items-center gap-3 rounded-xl border bg-background/50 px-3 py-2 text-sm"
          >
            <motion.span
              initial={false}
              animate={i < shown ? { scale: [0, 1.3, 1] } : { scale: 0 }}
              className={cn("grid size-6 place-items-center rounded-full text-white", c.ok ? "bg-success" : "bg-destructive")}
            >
              {c.ok ? <Check className="size-3.5" /> : <X className="size-3.5" />}
            </motion.span>
            <span className="flex-1">{c.label}</span>
            <code className="max-w-[45%] truncate text-xs text-muted-foreground">{c.detail}</code>
          </motion.div>
        ))}
      </div>
      {shown >= checks.length && allOk && (
        <Callout title="id_token valido: l'app ora sa con certezza chi sei!" />
      )}
    </div>
  )
}
