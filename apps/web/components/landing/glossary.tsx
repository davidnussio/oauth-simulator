"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Search } from "lucide-react"

import { GLOSSARY } from "@/lib/glossary"
import { SectionTitle } from "./reveal"

export function Glossary() {
  const [q, setQ] = useState("")
  const items = GLOSSARY.filter((g) => (g.term + g.def).toLowerCase().includes(q.toLowerCase()))
  return (
    <section id="glossario" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
      <SectionTitle eyebrow="Glossario" title="Le parole difficili, in parole facili" />
      <div className="mx-auto mb-8 flex max-w-md items-center gap-2 rounded-xl border bg-background/60 px-3 focus-within:ring-[3px] focus-within:ring-ring">
        <Search className="size-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cerca un termine… (es. token)"
          className="h-11 w-full bg-transparent text-sm outline-none"
        />
      </div>
      <motion.div layout className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {items.map((g) => (
            <motion.div
              key={g.term}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass rounded-2xl p-4"
            >
              <div className="mb-1 flex items-center gap-2 font-semibold">
                <span className="text-xl">{g.emoji}</span> {g.term}
              </div>
              <p className="text-sm text-muted-foreground">{g.def}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
      {!items.length && <p className="text-center text-sm text-muted-foreground">Nessun termine trovato 🤷</p>}
    </section>
  )
}
