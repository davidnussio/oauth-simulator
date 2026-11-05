"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ArrowLeft, ArrowRight, ChevronDown, Cpu, Lightbulb, TriangleAlert } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import type { StepKind } from "@/lib/sim/types"
import { useSim } from "./context"
import { HttpView } from "./http-view"
import { RichText } from "./rich-text"
import { ApiWidget } from "./widgets/api"
import { AuthorizeUrlWidget } from "./widgets/authorize-url"
import { ClientCredentialsWidget } from "./widgets/client-credentials"
import { DevicePollWidget, DeviceStartWidget, DeviceUserWidget } from "./widgets/device"
import { IdTokenWidget } from "./widgets/id-token"
import { ImplicitWidget } from "./widgets/implicit"
import { LoginWidget } from "./widgets/login"
import { PkceWidget } from "./widgets/pkce"
import { RefreshWidget } from "./widgets/refresh"
import { StateCheckWidget } from "./widgets/state-check"
import { TokenWidget } from "./widgets/token"

const WIDGETS: Record<StepKind, React.ComponentType> = {
  pkce: PkceWidget,
  "authorize-url": AuthorizeUrlWidget,
  login: LoginWidget,
  "state-check": StateCheckWidget,
  "implicit-callback": ImplicitWidget,
  token: TokenWidget,
  "id-token": IdTokenWidget,
  api: ApiOrReports,
  userinfo: () => <ApiWidget kind="userinfo" />,
  refresh: RefreshWidget,
  "device-start": DeviceStartWidget,
  "device-user": DeviceUserWidget,
  "device-poll": DevicePollWidget,
  "cc-token": ClientCredentialsWidget,
}

function ApiOrReports() {
  const { flow } = useSim()
  return <ApiWidget kind={flow.id === "client-credentials" ? "reports" : "photos"} />
}

export function StepPanel() {
  const { flow, index, step, done, next, prev } = useSim()
  const [prevIndex, setPrevIndex] = useState(index)
  const [dir, setDir] = useState(1)
  if (index !== prevIndex) {
    setDir(index > prevIndex ? 1 : -1)
    setPrevIndex(index)
  }
  const Widget = WIDGETS[step.kind]
  const isDone = done.has(step.id)

  return (
    <div className="glass relative overflow-clip rounded-2xl">
      <AnimatePresence mode="wait" initial={false} custom={dir}>
        <motion.section
          key={step.id}
          custom={dir}
          variants={{
            enter: (d: number) => ({ opacity: 0, x: 40 * d, filter: "blur(6px)" }),
            center: { opacity: 1, x: 0, filter: "blur(0px)" },
            exit: (d: number) => ({ opacity: 0, x: -40 * d, filter: "blur(6px)" }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-5 p-5 sm:p-7"
        >
          <header className="space-y-2">
            <Badge variant="outline">
              Passo {flow.steps.indexOf(step) + 1} di {flow.steps.length}
            </Badge>
            <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{step.title}</h2>
          </header>

          <p className="text-base leading-relaxed text-pretty sm:text-lg">
            <RichText text={step.simple} />
          </p>

          {step.analogy && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex items-start gap-3 rounded-xl bg-gradient-to-r from-primary/12 to-transparent p-4"
            >
              <motion.span
                className="text-3xl"
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                {step.analogy.emoji}
              </motion.span>
              <div className="text-sm">
                <div className="mb-0.5 flex items-center gap-1 font-medium text-primary">
                  <Lightbulb className="size-3.5" /> Come nella vita reale
                </div>
                {step.analogy.text}
              </div>
            </motion.div>
          )}

          {step.warn && (
            <div className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" /> {step.warn}
            </div>
          )}

          <div className="rounded-2xl border border-dashed p-4 sm:p-5">
            <div className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">👉 Tocca a te</div>
            <Widget />
          </div>

          <UnderTheHood />
        </motion.section>
      </AnimatePresence>

      <footer className="sticky bottom-0 flex items-center justify-between gap-3 border-t bg-background/70 px-5 py-3 backdrop-blur-md sm:px-7">
        <Button variant="ghost" onClick={prev} disabled={index === 0}>
          <ArrowLeft /> Indietro
        </Button>
        <AnimatePresence mode="wait">
          {!isDone && (
            <motion.span
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="hidden text-xs text-muted-foreground sm:block"
            >
              Completa il passo per continuare ☝️
            </motion.span>
          )}
        </AnimatePresence>
        <motion.div animate={isDone ? { scale: [1, 1.06, 1] } : {}} transition={{ repeat: isDone ? Infinity : 0, duration: 1.6 }}>
          <Button onClick={next} disabled={!isDone}>
            {index === flow.steps.length - 1 ? "Concludi" : "Avanti"} <ArrowRight />
          </Button>
        </motion.div>
      </footer>
    </div>
  )
}

function UnderTheHood() {
  const { step, exchanges } = useSim()
  const [open, setOpen] = useState(false)
  const mine = exchanges.filter((e) => e.stepId === step.id || (step.id === "device-user" && e.stepId === "device-poll"))

  return (
    <div className="rounded-xl border bg-muted/20">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 p-3 text-left text-sm font-medium">
        <Cpu className="size-4 text-primary" /> Sotto il cofano (per i curiosi)
        {mine.length > 0 && <Badge className="ml-1">{mine.length} richieste HTTP</Badge>}
        <motion.span className="ml-auto" animate={{ rotate: open ? 180 : 0 }}>
          <ChevronDown className="size-4" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 px-3 pb-3 text-sm">
              {step.tech && (
                <p className="text-muted-foreground">
                  <RichText text={step.tech} />
                </p>
              )}
              {mine.map((e) => (
                <div key={e.id} className="space-y-1">
                  <div className="text-xs font-medium">{e.title}</div>
                  <HttpView exchange={e} />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
