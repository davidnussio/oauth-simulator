"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ThumbsDown, ThumbsUp } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { useSim } from "../context"
import { Callout, Experiment, Field } from "./shared"

export function StateCheckWidget() {
  const { data, complete, next, done } = useSim()
  const [attack, setAttack] = useState(false)
  const [answer, setAnswer] = useState<"yes" | "no">()

  const params = data.callback?.params
  if (!params?.code) return <Callout tone="error" title="Nessun codice ricevuto: torna al passo del login." />

  const received = attack ? "attacker-" + params.state?.slice(0, 8) : params.state!
  const matches = received === data.state
  const right = answer && (answer === "yes") === matches

  return (
    <div className="space-y-4">
      <Field label="URL di ritorno ricevuto" value={data.callback!.href} />
      <div className="grid gap-3 sm:grid-cols-2">
        <StateCard label="🗄️ State salvato dall'app" value={data.state!} />
        <StateCard label="📨 State arrivato nell'URL" value={received} bad={!matches} />
      </div>
      <Experiment
        on={attack}
        onChange={(v) => {
          setAttack(v)
          setAnswer(undefined)
        }}
      >
        un attaccante ti fa atterrare sull&apos;app con <b>il suo</b> codice (attacco CSRF).
      </Experiment>
      <div className="text-sm font-medium">Secondo te, i due valori corrispondono?</div>
      <div className="flex flex-wrap gap-3">
        <Button variant={answer === "yes" ? "default" : "outline"} onClick={() => setAnswer("yes")}>
          <ThumbsUp /> Sì, corrispondono
        </Button>
        <Button variant={answer === "no" ? "default" : "outline"} onClick={() => setAnswer("no")}>
          <ThumbsDown /> No, sono diversi
        </Button>
      </div>
      <AnimatePresence mode="wait">
        {answer && (
          <motion.div key={`${answer}-${attack}`}>
            {right && matches && (
              <Callout title="Esatto! La risposta è autentica.">
                L&apos;app può usare il codice in sicurezza.
                {!done.has("state") && (
                  <Button
                    size="sm"
                    className="mt-2 ml-0 flex"
                    onClick={() => {
                      complete("state")
                      next()
                    }}
                  >
                    Continua
                  </Button>
                )}
              </Callout>
            )}
            {right && !matches && (
              <Callout title="Bravo, attacco bloccato! 🛡️">
                L&apos;app scarta il codice e non effettua il login. Spegni l&apos;esperimento per continuare.
              </Callout>
            )}
            {!right && (
              <Callout tone="error" title="Guarda meglio!">
                {matches
                  ? "Sono identici carattere per carattere."
                  : "Sono diversi: usare questo codice significherebbe entrare nell'account dell'attaccante!"}
              </Callout>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function StateCard({ label, value, bad }: { label: string; value: string; bad?: boolean }) {
  return (
    <motion.div
      layout
      className={cn(
        "rounded-xl border p-3 transition-colors",
        bad ? "border-destructive/50 bg-destructive/10" : "border-success/40 bg-success/5"
      )}
    >
      <div className="mb-1 text-xs text-muted-foreground">{label}</div>
      <motion.div key={value} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="font-mono text-sm break-all">
        {value}
      </motion.div>
    </motion.div>
  )
}
