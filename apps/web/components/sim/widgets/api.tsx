"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Database } from "lucide-react"

import { recordedFetch } from "@/lib/sim/http"
import type { Exchange } from "@/lib/sim/types"
import { HttpView } from "../http-view"
import { useSim } from "../context"
import { ActionButton, Callout, Experiment } from "./shared"

type Photos = { owner: string; photos: { id: string; emoji: string; title: string }[] }
type Reports = { reports: { name: string; value: string; trend: string }[] }
type Profile = { sub: string; name?: string; email?: string; preferred_username?: string; locale?: string }

/** Chiamata al resource server (foto, report o userinfo) con il Bearer token. */
export function ApiWidget({ kind = "photos" }: { kind?: "photos" | "reports" | "userinfo" }) {
  const { data, patch, complete, record, step } = useSim()
  const [busy, setBusy] = useState(false)
  const [fake, setFake] = useState(false)
  const [last, setLast] = useState<Exchange>()
  const stepId = step.id
  const token = data.tokens?.access_token

  if (!token) return <Callout tone="error" title="Non hai ancora un access token." />

  const url = { photos: "/api/resource/photos", reports: "/api/resource/reports", userinfo: "/api/oauth/userinfo" }[kind]

  async function call() {
    setBusy(true)
    const sent = fake ? token!.slice(0, -6) + "FALSO1" : token!
    const ex = await recordedFetch(stepId, "Chiamata API", url, { headers: { authorization: `Bearer ${sent}` } })
    record(ex)
    setLast(ex)
    setBusy(false)
    if (ex.response!.status === 200) {
      patch({ apiResult: ex.response!.body })
      complete(stepId)
    }
  }

  const ok = last?.response?.status === 200
  const body = last?.response?.body

  return (
    <div className="space-y-4">
      <Experiment on={fake} onChange={setFake}>
        modifico l&apos;ultima parte del token (la firma) per falsificarlo.
      </Experiment>
      <ActionButton onClick={call} busy={busy}>
        <Database /> Chiama {kind === "userinfo" ? "UserInfo" : "l'API"}
      </ActionButton>
      <AnimatePresence mode="wait">
        {last && !ok && (
          <motion.div key="err">
            <Callout tone="error" title={`${last.response!.status}: accesso negato`}>
              {(body as { error_description?: string })?.error_description}
            </Callout>
          </motion.div>
        )}
        {ok && kind === "photos" && <PhotoGrid key="photos" data={body as Photos} />}
        {ok && kind === "reports" && <ReportList key="reports" data={body as Reports} />}
        {ok && kind === "userinfo" && <ProfileCard key="profile" data={body as Profile} />}
      </AnimatePresence>
      {last && <HttpView exchange={last} />}
    </div>
  )
}

function PhotoGrid({ data }: { data: Photos }) {
  return (
    <motion.div className="space-y-2">
      <div className="text-sm text-muted-foreground">
        Le foto di <b className="text-foreground">{data.owner}</b>:
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {data.photos.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: i * 0.07, type: "spring", stiffness: 300, damping: 16 }}
            whileHover={{ y: -4, rotate: 2 }}
            className="flex aspect-square flex-col items-center justify-center rounded-xl border bg-gradient-to-br from-actor-api/20 to-actor-app/10 p-2 text-center"
          >
            <span className="text-3xl">{p.emoji}</span>
            <span className="mt-1 line-clamp-2 text-[10px] text-muted-foreground">{p.title}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

function ReportList({ data }: { data: Reports }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {data.reports.map((r, i) => (
        <motion.div
          key={r.name}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="rounded-xl border bg-actor-api/5 p-3"
        >
          <div className="text-xs text-muted-foreground">{r.name}</div>
          <div className="text-xl font-semibold">{r.value}</div>
          <div className={r.trend.startsWith("+") ? "text-xs text-success" : "text-xs text-destructive"}>{r.trend}</div>
        </motion.div>
      ))}
    </div>
  )
}

function ProfileCard({ data }: { data: Profile }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-4 rounded-2xl border bg-gradient-to-br from-actor-auth/15 to-actor-app/10 p-4"
    >
      <motion.div
        initial={{ rotate: -20, scale: 0 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.1 }}
        className="grid size-14 place-items-center rounded-full bg-actor-auth text-xl font-bold text-white"
      >
        {(data.name ?? data.sub).slice(0, 1).toUpperCase()}
      </motion.div>
      <div className="min-w-0 text-sm">
        <div className="text-base font-semibold">{data.name ?? data.sub}</div>
        {data.email && <div className="text-muted-foreground">{data.email}</div>}
        <div className="text-xs text-muted-foreground">
          sub: <code>{data.sub}</code>
          {data.locale && ` · ${data.locale}`}
        </div>
      </div>
    </motion.div>
  )
}
