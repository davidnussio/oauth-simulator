"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { ArrowUpRight } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { FLOWS } from "@/lib/sim/flows"
import { Reveal, SectionTitle } from "./reveal"

export function FlowGrid() {
  return (
    <section id="flussi" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
      <SectionTitle
        eyebrow="I flussi"
        title="Scegli un'avventura"
        sub="Ogni flusso è un modo diverso di ottenere un token, pensato per un tipo di app diverso. Tutti girano su un vero server."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FLOWS.map((f, i) => (
          <Reveal key={f.id} delay={i * 0.06}>
            <motion.div whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} className="h-full">
              <Link
                href={`/flow/${f.id}`}
                className="glass group relative flex h-full flex-col overflow-hidden rounded-2xl p-6 transition-colors hover:border-primary/50"
              >
                <div className="absolute -top-12 -right-12 size-32 rounded-full bg-primary/10 blur-2xl transition-opacity group-hover:opacity-100 sm:opacity-0" />
                <div className="mb-4 flex items-start justify-between">
                  <motion.span className="text-4xl" whileHover={{ scale: 1.2, rotate: -8 }}>
                    {f.emoji}
                  </motion.span>
                  <ArrowUpRight className="size-5 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
                </div>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {f.recommended && <Badge variant="success">⭐ Consigliato</Badge>}
                  {f.deprecated && <Badge variant="destructive">Deprecato</Badge>}
                  <Badge variant="outline">{f.level}</Badge>
                  <Badge variant="outline">{f.steps.length} passi</Badge>
                </div>
                <h3 className="text-lg font-semibold">{f.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.tagline}</p>
                <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">
                  <b className="text-foreground">Quando:</b> {f.when}
                </p>
              </Link>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
