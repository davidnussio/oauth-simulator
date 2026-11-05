"use client"

import { motion } from "motion/react"
import { Check, Flag } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"
import { useSim } from "./context"

export function Stepper() {
  const { flow, index, done, goto } = useSim()
  // si può saltare solo ai passi già raggiunti
  const reachable = (i: number) => i === 0 || flow.steps.slice(0, i).every((s) => done.has(s.id))
  const progress = flow.steps.filter((s) => done.has(s.id)).length / flow.steps.length

  return (
    <nav aria-label="Passi del flusso" className="glass rounded-2xl p-3">
      <div className="mb-3 px-1">
        <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
          <span>Progresso</span>
          <span>{Math.round(progress * 100)}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-actor-auth via-actor-app to-actor-api"
            animate={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
      <ol className="flex gap-1 overflow-x-auto lg:flex-col">
        {[...flow.steps, null].map((s, i) => {
          const active = i === index
          const isDone = s ? done.has(s.id) : false
          const can = reachable(i)
          return (
            <li key={s?.id ?? "end"} className="shrink-0">
              <button
                onClick={() => can && goto(i)}
                disabled={!can}
                className={cn(
                  "relative flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm transition-colors",
                  can ? "cursor-pointer hover:bg-muted/50" : "cursor-not-allowed opacity-45"
                )}
              >
                {active && (
                  <motion.span layoutId="step-active" className="absolute inset-0 rounded-xl bg-primary/12 ring-1 ring-primary/30" />
                )}
                <span
                  className={cn(
                    "relative grid size-7 shrink-0 place-items-center rounded-full border text-xs font-semibold transition-colors",
                    isDone && "border-success bg-success text-background",
                    active && !isDone && "border-primary text-primary"
                  )}
                >
                  {s ? isDone ? <Check className="size-3.5" /> : i + 1 : <Flag className="size-3.5" />}
                </span>
                <span className={cn("relative whitespace-nowrap lg:whitespace-normal", active && "font-medium")}>
                  {s ? s.short : "Traguardo"}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
