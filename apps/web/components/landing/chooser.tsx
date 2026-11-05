"use client"

import Link from "next/link"
import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ArrowRight, RotateCcw } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { getFlow } from "@/lib/sim/flows"
import { SectionTitle } from "./reveal"

type Node = { q: string; options: { label: string; emoji: string; next: string }[] } | { result: string; why: string }

const TREE: Record<string, Node> = {
  start: {
    q: "C'è una persona che usa l'app e deve dare il permesso?",
    options: [
      { label: "Sì, un utente", emoji: "🙋", next: "device" },
      { label: "No, è un programma/servizio", emoji: "🤖", next: "cc" },
    ],
  },
  device: {
    q: "Il dispositivo ha un browser e una tastiera comodi?",
    options: [
      { label: "Sì (telefono, PC, web)", emoji: "💻", next: "login" },
      { label: "No (TV, console, CLI)", emoji: "📺", next: "dev" },
    ],
  },
  login: {
    q: "All'app serve sapere CHI è l'utente (fare il login)?",
    options: [
      { label: "Sì, voglio il login", emoji: "🪪", next: "oidc" },
      { label: "No, solo accedere ai dati", emoji: "📂", next: "pkce" },
    ],
  },
  cc: { result: "client-credentials", why: "Nessun utente coinvolto: il servizio usa le proprie credenziali." },
  dev: { result: "device", why: "Accedi dal telefono con un codice, senza digitare la password sulla TV." },
  oidc: { result: "oidc", why: "OpenID Connect aggiunge l'id_token a OAuth: è il “Accedi con Google”." },
  pkce: { result: "pkce", why: "Lo standard moderno per qualsiasi app con un utente e un browser." },
}

export function Chooser() {
  const [path, setPath] = useState<string[]>(["start"])
  const node = TREE[path.at(-1)!]!

  return (
    <section id="quale-flusso" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-20 sm:px-6">
      <SectionTitle eyebrow="Mini-quiz" title="Quale flusso fa per me?" sub="Tre domande al massimo. Promesso." />
      <div className="glass relative min-h-72 overflow-hidden rounded-3xl p-6 sm:p-10">
        <div className="mb-6 flex gap-1.5">
          {[0, 1, 2].map((n) => (
            <motion.span
              key={n}
              className="h-1.5 flex-1 rounded-full bg-muted"
              animate={{ backgroundColor: n < path.length - ("result" in node ? 0 : 1) ? "var(--primary)" : "var(--muted)" }}
            />
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={path.join("/")}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
          >
            {"q" in node ? (
              <>
                <h3 className="mb-6 text-xl font-semibold text-balance sm:text-2xl">{node.q}</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {node.options.map((o) => (
                    <motion.button
                      key={o.label}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setPath((p) => [...p, o.next])}
                      className="flex items-center gap-3 rounded-2xl border bg-background/60 p-4 text-left font-medium transition-colors hover:border-primary/60 hover:bg-primary/5"
                    >
                      <span className="text-3xl">{o.emoji}</span> {o.label}
                    </motion.button>
                  ))}
                </div>
              </>
            ) : (
              <Result id={node.result} why={node.why} onReset={() => setPath(["start"])} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}

function Result({ id, why, onReset }: { id: string; why: string; onReset: () => void }) {
  const f = getFlow(id)!
  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 12 }}
        className="mb-3 text-6xl"
      >
        {f.emoji}
      </motion.div>
      <div className="text-sm text-muted-foreground">Il flusso giusto per te è</div>
      <h3 className="text-gradient text-3xl font-semibold">{f.name}</h3>
      <p className="mx-auto mt-2 max-w-md text-muted-foreground">{why}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <Link href={`/flow/${f.id}`}>
            Provalo ora <ArrowRight />
          </Link>
        </Button>
        <Button variant="ghost" size="lg" onClick={onReset}>
          <RotateCcw /> Rifai il quiz
        </Button>
      </div>
    </div>
  )
}
