"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { CornerDownLeft, Mail, RotateCw, Repeat } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"
import type { ActorId, Arrow } from "@/lib/sim/types"
import { useSim } from "./context"

const color = (id: ActorId) => `var(--actor-${id})`

/** Il "palco": gli attori del flusso e i messaggi che viaggiano tra loro. */
export function Stage() {
  const { flow, actors, index, pulse, replay } = useSim()
  const step = flow.steps[index]
  const arrows = step?.arrows ?? []
  const xs = Object.fromEntries(flow.actors.map((a, i) => [a, ((i + 0.5) / flow.actors.length) * 100])) as Record<
    ActorId,
    number
  >
  const involved = new Set(arrows.flatMap((a) => [a.from, a.to]))
  const finished = index >= flow.steps.length

  return (
    <div id="sim-stage" className="glass relative scroll-mt-20 overflow-hidden rounded-2xl">
      <div className="bg-grid absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      <div className="relative h-52 sm:h-56">
        {/* linea del tempo tra il primo e l'ultimo attore */}
        <svg className="absolute inset-x-0 top-[58%] h-2 w-full" preserveAspectRatio="none">
          <line
            x1={`${xs[flow.actors[0]!]}%`}
            x2={`${xs[flow.actors.at(-1)!]}%`}
            y1="4"
            y2="4"
            stroke="currentColor"
            strokeOpacity={0.18}
            strokeWidth={2}
            strokeDasharray="6 6"
            className="text-foreground"
          />
        </svg>

        {flow.actors.map((id, i) => {
          const a = actors[id]
          const active = finished || involved.has(id)
          return (
            <motion.div
              key={id}
              className="absolute top-[58%] flex w-24 -translate-x-1/2 -translate-y-[38px] flex-col items-center text-center sm:w-32"
              style={{ left: `${xs[id]}%` }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: active ? 1 : 0.38, y: 0, scale: active ? 1 : 0.92 }}
              transition={{ delay: i * 0.06 }}
            >
              <div className="relative">
                {active && (
                  <motion.span
                    className="absolute inset-0 rounded-2xl"
                    style={{ background: color(id) }}
                    animate={{ scale: [1, 1.35], opacity: [0.45, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                  />
                )}
                <div
                  className="relative grid size-14 place-items-center rounded-2xl border-2 bg-background text-3xl shadow-lg sm:size-16"
                  style={{ borderColor: color(id), boxShadow: active ? `0 10px 40px -10px ${color(id)}` : undefined }}
                >
                  <span aria-hidden>{a.emoji}</span>
                </div>
              </div>
              <span className="mt-2 text-xs font-semibold sm:text-sm" style={{ color: color(id) }}>
                {a.name}
              </span>
              <span className="hidden text-[11px] text-muted-foreground sm:block">{a.role}</span>
            </motion.div>
          )
        })}

        {!finished && <PacketRunner key={`${index}-${pulse}`} arrows={arrows} xs={xs} />}

        <button
          onClick={replay}
          className="absolute top-3 right-3 flex items-center gap-1 rounded-full border bg-background/70 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Rivedi l'animazione"
        >
          <RotateCw className="size-3" /> Rivedi
        </button>
      </div>
    </div>
  )
}

function PacketRunner({ arrows, xs }: { arrows: Arrow[]; xs: Record<ActorId, number> }) {
  const [i, setI] = useState(0)
  const arrow = arrows[i]

  useEffect(() => {
    if (!arrow) return
    const t = setTimeout(() => setI((n) => n + 1), arrow.from === arrow.to ? 1700 : 1500)
    return () => clearTimeout(t)
  }, [arrow, i])

  // a fine sequenza resta visibile l'ultimo messaggio
  const shown = arrow ?? arrows.at(-1)
  if (!shown) return null
  const settled = !arrow
  const self = shown.from === shown.to
  const Icon = shown.kind === "response" ? CornerDownLeft : shown.kind === "redirect" ? Repeat : Mail

  return (
    <>
      {/* tratto evidenziato del percorso */}
      {!self && (
        <motion.div
          key={`trail-${i}`}
          className="absolute top-[58%] h-[3px] -translate-y-1/2 rounded-full"
          style={{
            left: `${Math.min(xs[shown.from], xs[shown.to])}%`,
            width: `${Math.abs(xs[shown.to] - xs[shown.from])}%`,
            background: `linear-gradient(90deg, ${color(shown.from)}, ${color(shown.to)})`,
            transformOrigin: xs[shown.to] > xs[shown.from] ? "left" : "right",
          }}
          initial={{ scaleX: 0, opacity: 0.9 }}
          animate={{ scaleX: 1, opacity: settled ? 0.35 : 0.9 }}
          transition={{ duration: 1.1, ease: [0.65, 0, 0.35, 1] }}
        />
      )}
      <AnimatePresence>
        <motion.div
          key={`packet-${i}`}
          className="pointer-events-none absolute top-[58%] z-10 -translate-1/2"
          initial={{ left: `${xs[shown.from]}%`, opacity: 0, scale: 0.6 }}
          animate={{ left: `${xs[shown.to]}%`, opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{
            left: { duration: self ? 0 : 1.1, ease: [0.65, 0, 0.35, 1] },
            opacity: { duration: 0.2 },
          }}
        >
          {!self && (
            <span className="block size-3 rounded-full ring-4 ring-background" style={{ background: color(shown.from) }} />
          )}
          <motion.div
            className={cn(
              "absolute bottom-full left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap text-white shadow-xl sm:text-xs",
              self ? "mb-14" : "mb-12"
            )}
            style={{ background: color(shown.from), borderColor: "color-mix(in oklch, white 30%, transparent)" }}
            animate={self ? { rotate: [0, -3, 3, 0] } : undefined}
            transition={{ duration: 0.9, repeat: Infinity }}
          >
            {self ? <span className="animate-spin">⚙️</span> : <Icon className="size-3.5" />}
            {shown.label}
          </motion.div>
        </motion.div>
      </AnimatePresence>
      {arrows.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {arrows.map((_, n) => (
            <span
              key={n}
              className={cn("h-1.5 rounded-full bg-foreground/20 transition-all", n === Math.min(i, arrows.length - 1) ? "w-5 bg-primary" : "w-1.5")}
            />
          ))}
        </div>
      )}
    </>
  )
}
