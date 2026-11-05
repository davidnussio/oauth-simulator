"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ArrowRight, Sparkles } from "lucide-react"

import { Button } from "@workspace/ui/components/button"

const STORY = [
  { emoji: "📸", actor: "app", text: "Un'app vuole vedere le tue foto." },
  { emoji: "🙅", actor: "user", text: "Non le dai la tua password. Mai." },
  { emoji: "🏛️", actor: "auth", text: "Il tuo provider le dà una chiave limitata." },
  { emoji: "🔑", actor: "api", text: "La chiave apre solo le foto, e scade presto." },
]

export function Hero() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % STORY.length), 2600)
    return () => clearInterval(t)
  }, [])

  return (
    <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 pt-16 pb-20 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:pt-24">
      <div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs text-muted-foreground"
        >
          <Sparkles className="size-3.5 text-primary" /> Con un vero server OAuth 2.0 + OpenID Connect
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-5xl font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl"
        >
          OAuth, finalmente <span className="text-gradient">spiegato semplice.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="mt-5 max-w-xl text-lg text-pretty text-muted-foreground"
        >
          Guarda i messaggi viaggiare tra te, l&apos;app e il server. Clicca, accedi, rompi le cose di proposito. Niente
          gergo senza spiegazione: passa il mouse sui termini sottolineati.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 flex flex-wrap gap-3"
        >
          <Button asChild size="lg">
            <Link href="/flow/pkce">
              Inizia il primo flusso <ArrowRight />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#quale-flusso">Quale flusso fa per me?</a>
          </Button>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15 }}
        className="relative mx-auto aspect-square w-full max-w-md"
      >
        {/* orbita */}
        <motion.div
          className="absolute inset-6 rounded-full border border-dashed border-foreground/15"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        />
        {STORY.map((s, n) => {
          const angle = (n / STORY.length) * Math.PI * 2 - Math.PI / 2
          const active = n === i
          return (
            <motion.div
              key={s.actor}
              className="absolute grid size-20 -translate-1/2 place-items-center rounded-3xl border-2 bg-background text-4xl shadow-xl"
              style={{
                left: `${50 + Math.cos(angle) * 40}%`,
                top: `${50 + Math.sin(angle) * 40}%`,
                borderColor: `var(--actor-${s.actor})`,
              }}
              animate={{
                scale: active ? 1.15 : 0.9,
                opacity: active ? 1 : 0.55,
                boxShadow: active ? `0 20px 60px -15px var(--actor-${s.actor})` : "0 0 0 0 transparent",
              }}
            >
              {s.emoji}
            </motion.div>
          )
        })}
        {/* chiave che salta da un attore all'altro */}
        <motion.div
          className="absolute z-10 text-3xl"
          animate={{
            left: `${50 + Math.cos((i / STORY.length) * Math.PI * 2 - Math.PI / 2) * 22}%`,
            top: `${50 + Math.sin((i / STORY.length) * Math.PI * 2 - Math.PI / 2) * 22}%`,
            rotate: i * 90,
          }}
          transition={{ type: "spring", stiffness: 120, damping: 14 }}
          style={{ x: "-50%", y: "-50%" }}
        >
          🗝️
        </motion.div>
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-16 text-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
              className="text-sm font-medium text-balance"
            >
              <span className="block text-xs text-muted-foreground">{i + 1}/4</span>
              {STORY[i]!.text}
            </motion.p>
          </AnimatePresence>
        </div>
      </motion.div>
    </section>
  )
}
