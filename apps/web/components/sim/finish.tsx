"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { ArrowRight, RotateCcw } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { FLOWS } from "@/lib/sim/flows"
import { useSim } from "./context"

const COLORS = ["var(--actor-user)", "var(--actor-app)", "var(--actor-auth)", "var(--actor-api)"]

function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 40 }, (_, i) => {
        const x = ((i * 37) % 100) - 50
        return (
          <motion.span
            key={i}
            className="absolute top-1/3 left-1/2 block h-3 w-1.5 rounded-sm"
            style={{ background: COLORS[i % COLORS.length] }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
            animate={{ x: x * 9, y: [0, -160 - (i % 7) * 25, 420], opacity: [1, 1, 0], rotate: (i % 2 ? 1 : -1) * 540 }}
            transition={{ duration: 2.4 + (i % 5) * 0.2, ease: "easeOut", delay: (i % 6) * 0.03 }}
          />
        )
      })}
    </div>
  )
}

export function Finish() {
  const { flow, exchanges, reset } = useSim()
  const others = FLOWS.filter((f) => f.id !== flow.id).slice(0, 3)
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass relative overflow-hidden rounded-2xl p-8 text-center"
    >
      <Confetti />
      <motion.div
        initial={{ scale: 0, rotate: -40 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 12 }}
        className="mx-auto mb-4 text-6xl"
      >
        🏆
      </motion.div>
      <h2 className="text-3xl font-semibold tracking-tight">Flusso completato!</h2>
      <p className="mx-auto mt-2 max-w-lg text-muted-foreground">
        Hai eseguito davvero <b className="text-foreground">{flow.name}</b>: {exchanges.length} richieste HTTP reali verso
        un server OAuth, firme JWT incluse. Ora sai più di OAuth di molti sviluppatori 😉
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button variant="outline" onClick={reset}>
          <RotateCcw /> Rifai da capo
        </Button>
      </div>
      <div className="mt-8 text-sm font-medium">Prova un altro flusso</div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {others.map((f, i) => (
          <motion.div key={f.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}>
            <Link
              href={`/flow/${f.id}`}
              className="group flex h-full flex-col rounded-xl border bg-background/50 p-4 text-left transition hover:-translate-y-1 hover:border-primary/50"
            >
              <span className="text-2xl">{f.emoji}</span>
              <span className="mt-1 font-medium">{f.name}</span>
              <span className="text-xs text-muted-foreground">{f.tagline}</span>
              <ArrowRight className="mt-2 size-4 text-primary transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
