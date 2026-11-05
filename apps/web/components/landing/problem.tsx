"use client"

import { motion } from "motion/react"
import { Check, X } from "lucide-react"

import { ACTORS } from "@/lib/sim/flows"
import { Reveal, SectionTitle } from "./reveal"

const BAD = ["L'app conosce la tua password", "Può fare TUTTO col tuo account", "Per toglierle l'accesso devi cambiare password", "Se l'app viene bucata, la tua password è fuori"]
const GOOD = ["L'app non vede mai la password", "Riceve solo i permessi che scegli tu (scope)", "Puoi revocare l'accesso con un clic", "Il token scade da solo dopo poco"]

export function Problem() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <SectionTitle
        eyebrow="Il problema"
        title="Perché non dare semplicemente la password all'app?"
        sub="Sarebbe come dare le chiavi di casa al ragazzo che porta la pizza. OAuth gli dà invece un codice del portone valido 10 minuti."
      />
      <div className="grid gap-5 md:grid-cols-2">
        {[
          { title: "🔓 Dare la password", items: BAD, bad: true },
          { title: "🛡️ Con OAuth", items: GOOD, bad: false },
        ].map((col, c) => (
          <Reveal key={col.title} delay={c * 0.1}>
            <div
              className={`glass h-full rounded-2xl p-6 ${col.bad ? "border-destructive/30" : "border-success/30"}`}
            >
              <h3 className="mb-4 text-lg font-semibold">{col.title}</h3>
              <ul className="space-y-3">
                {col.items.map((t, i) => (
                  <motion.li
                    key={t}
                    initial={{ opacity: 0, x: col.bad ? -12 : 12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 + i * 0.08 }}
                    className="flex items-start gap-3 text-sm"
                  >
                    <span
                      className={`grid size-5 shrink-0 place-items-center rounded-full ${col.bad ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success"}`}
                    >
                      {col.bad ? <X className="size-3" /> : <Check className="size-3" />}
                    </span>
                    {t}
                  </motion.li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="mt-20">
        <SectionTitle eyebrow="I personaggi" title="Quattro attori, sempre gli stessi" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.entries(ACTORS) as [keyof typeof ACTORS, (typeof ACTORS)[keyof typeof ACTORS]][]).map(([id, a], i) => (
            <Reveal key={id} delay={i * 0.08}>
              <motion.div
                whileHover={{ y: -6 }}
                className="glass h-full rounded-2xl p-5"
                style={{ borderColor: `color-mix(in oklch, var(--actor-${id}) 40%, transparent)` }}
              >
                <div
                  className="mb-3 grid size-12 place-items-center rounded-xl text-2xl"
                  style={{ background: `color-mix(in oklch, var(--actor-${id}) 18%, transparent)` }}
                >
                  {a.emoji}
                </div>
                <div className="font-semibold" style={{ color: `var(--actor-${id})` }}>
                  {a.name}
                </div>
                <div className="text-xs text-muted-foreground">{a.role}</div>
                <p className="mt-2 text-sm">{DESCR[id]}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

const DESCR = {
  user: "Il proprietario dei dati. Decide cosa concedere.",
  app: "Chi vuole accedere ai tuoi dati per offrirti un servizio.",
  auth: "Il guardiano: verifica chi sei e rilascia i token.",
  api: "La cassaforte dei dati: apre solo con un token valido.",
}
