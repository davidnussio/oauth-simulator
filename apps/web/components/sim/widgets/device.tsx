"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Loader2, Power } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"
import { form, recordedFetch } from "@/lib/sim/http"
import type { DeviceResponse, Exchange, TokenResponse } from "@/lib/sim/types"
import { BrowserWindow } from "../browser-window"
import { HttpView } from "../http-view"
import { useSim } from "../context"
import { ActionButton, Callout } from "./shared"
import { TokensView } from "./tokens-view"

function TvScreen({ device, status }: { device?: DeviceResponse; status: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-2xl border-[10px] border-neutral-800 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 text-center text-white shadow-2xl">
        <AnimatePresence mode="wait">
          {device ? (
            <motion.div key="code" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3">
              <div className="text-xs text-white/60">Sul telefono vai su</div>
              <div className="font-mono text-sm text-sky-300">{device.verification_uri.replace(/^https?:\/\//, "")}</div>
              <div className="text-xs text-white/60">e inserisci il codice</div>
              <div className="flex justify-center gap-1 font-mono text-3xl font-bold tracking-widest">
                {device.user_code.split("").map((c, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: -16, rotateX: 90 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    transition={{ delay: 0.05 * i }}
                    className={c === "-" ? "text-white/40" : "rounded bg-white/10 px-1"}
                  >
                    {c}
                  </motion.span>
                ))}
              </div>
              <div className="pt-2 text-xs text-white/70">{status}</div>
            </motion.div>
          ) : (
            <motion.div key="off" className="py-10 text-white/40">
              📺 TV spenta
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="mx-auto h-4 w-24 rounded-b-lg bg-neutral-800" />
    </div>
  )
}

export function DeviceStartWidget() {
  const { creds, data, patch, complete, record, flow } = useSim()
  const [busy, setBusy] = useState(false)
  const [last, setLast] = useState<Exchange>()
  if (!creds) return null

  async function start() {
    setBusy(true)
    const ex = await recordedFetch("device-start", "Device authorization", "/api/oauth/device", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: form({ client_id: creds!.client_id, scope: flow.scopes.join(" ") }),
    })
    record(ex)
    setLast(ex)
    setBusy(false)
    if (ex.response!.status === 200) {
      patch({ device: ex.response!.body as DeviceResponse, tokens: undefined })
      complete("device-start")
    }
  }

  return (
    <div className="space-y-4">
      <TvScreen device={data.device} status="Il codice scade tra 10 minuti" />
      <ActionButton busy={busy} onClick={start}>
        <Power /> {data.device ? "Chiedi un nuovo codice" : "Accendi la TV"}
      </ActionButton>
      {last && <HttpView exchange={last} />}
    </div>
  )
}

export function DeviceUserWidget() {
  const { creds, data, patch, complete, record, next } = useSim()
  const [polls, setPolls] = useState<{ at: number; result: string }[]>([])
  const [finalEx, setFinalEx] = useState<Exchange>()
  const stopped = useRef(false)
  const device = data.device

  useEffect(() => {
    if (!device || !creds || data.tokens) return
    stopped.current = false
    let timer: ReturnType<typeof setTimeout>
    const poll = async () => {
      const ex = await recordedFetch("device-poll", "Polling della TV", "/api/oauth/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: form({
          grant_type: "urn:ietf:params:oauth:grant-type:device_code",
          device_code: device.device_code,
          client_id: creds.client_id,
        }),
      })
      if (stopped.current) return
      const body = ex.response!.body as TokenResponse
      setPolls((p) => [...p.slice(-5), { at: Date.now(), result: body.error ?? "access_token ✓" }])
      if (ex.response!.status === 200) {
        record(ex)
        setFinalEx(ex)
        patch({ tokens: body })
        complete("device-user")
        complete("device-poll")
        setTimeout(next, 1200)
        return
      }
      if (body.error === "authorization_pending" || body.error === "slow_down") {
        timer = setTimeout(poll, device.interval * 1000)
      } else {
        record(ex)
        setFinalEx(ex)
      }
    }
    timer = setTimeout(poll, 800)
    return () => {
      stopped.current = true
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- il polling dipende solo da device/creds
  }, [device, creds, data.tokens])

  if (!device) return <Callout tone="error" title="Prima accendi la TV nel passo precedente." />

  const lastPoll = polls.at(-1)
  const status = data.tokens ? (
    "✅ Collegata!"
  ) : (
    <span className="inline-flex items-center gap-1.5">
      <Loader2 className="size-3 animate-spin" /> In attesa… ({polls.length} controlli)
    </span>
  )

  return (
    <div className="space-y-4">
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="space-y-3">
          <TvScreen device={device} status={status} />
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">Polling della TV → /token</div>
            <AnimatePresence initial={false}>
              {polls.map((p) => (
                <motion.div
                  key={p.at}
                  initial={{ opacity: 0, x: -10, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: "auto" }}
                  className={cn(
                    "rounded-md px-2 py-1 font-mono text-[11px]",
                    p.result.includes("✓") ? "bg-success/15 text-success" : "bg-muted/60 text-muted-foreground"
                  )}
                >
                  {new Date(p.at).toLocaleTimeString("it-CH")} · {p.result}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
        <div>
          <div className="mb-2 text-xs font-medium text-muted-foreground">📱 Il tuo telefono</div>
          <BrowserWindow src={device.verification_uri_complete} creds={creds} height={500} className="lg:grid-cols-1" />
        </div>
      </div>
      {lastPoll?.result === "access_denied" && <Callout tone="error" title="Hai rifiutato: la TV riceve access_denied." />}
      {finalEx && finalEx.response!.status !== 200 && <HttpView exchange={finalEx} />}
    </div>
  )
}

export function DevicePollWidget() {
  const { data, exchanges } = useSim()
  const ex = exchanges.findLast((e) => e.stepId === "device-poll" && e.response?.status === 200)
  if (!data.tokens) return <Callout tone="error" title="La TV non ha ancora ricevuto il token." />
  return (
    <div className="space-y-4">
      <Callout title="La TV è collegata al tuo account! 📺✨">Senza aver mai digitato una password col telecomando.</Callout>
      <TokensView tokens={data.tokens} />
      {ex && <HttpView exchange={ex} />}
    </div>
  )
}
