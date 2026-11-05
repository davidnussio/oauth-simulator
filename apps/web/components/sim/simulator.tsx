"use client"

import { AnimatePresence, motion } from "motion/react"
import { Loader2, RotateCcw } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { getFlow } from "@/lib/sim/flows"
import { useCredentials } from "@/components/credentials"
import { SimProvider, useSim } from "./context"
import { Finish } from "./finish"
import { Stage } from "./stage"
import { StepPanel } from "./step-panel"
import { Stepper } from "./stepper"

export function Simulator({ flowId }: { flowId: string }) {
  const flow = getFlow(flowId)!
  return (
    <SimProvider key={flow.id} flow={flow}>
      <SimulatorInner />
    </SimProvider>
  )
}

function SimulatorInner() {
  const { flow, index, reset } = useSim()
  const { creds } = useCredentials()
  const finished = index >= flow.steps.length

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-4 pt-6 pb-16 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-end justify-between gap-3"
      >
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            {flow.recommended && <Badge variant="success">⭐ Consigliato</Badge>}
            {flow.deprecated && <Badge variant="destructive">Deprecato</Badge>}
            <Badge variant="outline">Livello {flow.level}</Badge>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            <span className="mr-2">{flow.emoji}</span>
            {flow.name}
          </h1>
          <p className="mt-1 text-muted-foreground">{flow.when}</p>
        </div>
        <Button variant="outline" size="sm" onClick={reset}>
          <RotateCcw /> Ricomincia
        </Button>
      </motion.div>

      <Stage />

      {!creds ? (
        <div className="glass flex items-center justify-center gap-2 rounded-2xl p-10 text-muted-foreground">
          <Loader2 className="animate-spin" /> Registro il tuo client e il tuo utente di prova…
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
          <div className="min-w-0 lg:sticky lg:top-20 lg:self-start">
            <Stepper />
          </div>
          <AnimatePresence mode="wait">
            {finished ? <Finish key="finish" /> : <StepPanel key="panel" />}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
