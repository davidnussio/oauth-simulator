"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"

import { useCredentials } from "@/components/credentials"
import { actorsFor } from "@/lib/sim/flows"
import type { Actor, ActorId, Credentials, DeviceResponse, Exchange, Flow, Step, TokenResponse } from "@/lib/sim/types"

export type SimData = {
  verifier?: string
  challenge?: string
  state?: string
  nonce?: string
  authorizeUrl?: string
  callback?: { href: string; params: Record<string, string> }
  stateOk?: boolean
  tokens?: TokenResponse
  usedRefresh?: string
  device?: DeviceResponse
  apiResult?: unknown
}

type Ctx = {
  flow: Flow
  actors: Record<ActorId, Actor>
  creds: Credentials | null
  index: number
  /** passo corrente (resta l'ultimo anche a flusso concluso, utile durante le animazioni di uscita) */
  step: Step
  done: Set<string>
  data: SimData
  exchanges: Exchange[]
  /** incrementato per rilanciare l'animazione dei pacchetti */
  pulse: number
  patch: (d: Partial<SimData>) => void
  complete: (stepId: string) => void
  record: (e: Exchange) => void
  goto: (i: number) => void
  next: () => void
  prev: () => void
  reset: () => void
  replay: () => void
}

const SimContext = createContext<Ctx | null>(null)

export function SimProvider({ flow, children }: { flow: Flow; children: React.ReactNode }) {
  const { creds } = useCredentials()
  const [index, setIndex] = useState(0)
  const [done, setDone] = useState<Set<string>>(new Set())
  const [data, setData] = useState<SimData>({})
  const [exchanges, setExchanges] = useState<Exchange[]>([])
  const [pulse, setPulse] = useState(0)

  const goto = useCallback(
    (i: number) => {
      setIndex(Math.max(0, Math.min(flow.steps.length, i)))
      setPulse((p) => p + 1)
      // riporta in vista il "palco" così si vede l'animazione del nuovo passo
      document.getElementById("sim-stage")?.scrollIntoView({ behavior: "smooth", block: "start" })
    },
    [flow.steps.length]
  )

  const value = useMemo<Ctx>(
    () => ({
      flow,
      actors: actorsFor(flow),
      creds,
      index,
      step: flow.steps[Math.min(index, flow.steps.length - 1)]!,
      done,
      data,
      exchanges,
      pulse,
      patch: (d) => setData((prev) => ({ ...prev, ...d })),
      complete: (id) => setDone((prev) => (prev.has(id) ? prev : new Set(prev).add(id))),
      record: (e) => setExchanges((prev) => [...prev, e]),
      goto,
      next: () => goto(index + 1),
      prev: () => goto(index - 1),
      reset: () => {
        setData({})
        setDone(new Set())
        setExchanges([])
        goto(0)
      },
      replay: () => setPulse((p) => p + 1),
    }),
    [flow, creds, index, done, data, exchanges, pulse, goto]
  )

  return <SimContext value={value}>{children}</SimContext>
}

export function useSim() {
  const c = useContext(SimContext)
  if (!c) throw new Error("useSim fuori da SimProvider")
  return c
}
