"use client"

import { Check } from "lucide-react"
import { motion } from "motion/react"

import { SCOPES, type Scope } from "@/lib/oauth/scopes"
import { cn } from "@workspace/ui/lib/utils"

export function ScopeList({
  scopes,
  granted,
  toggle,
}: {
  scopes: Scope[]
  granted: Set<Scope>
  toggle: (s: Scope) => void
}) {
  return (
    <ul className="space-y-2">
      {scopes.map((s, i) => {
        const on = granted.has(s)
        return (
          <motion.li
            key={s}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * i }}
          >
            <button
              type="button"
              onClick={() => toggle(s)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                on ? "border-actor-auth/50 bg-actor-auth/10" : "opacity-60"
              )}
            >
              <span className="text-xl">{SCOPES[s].emoji}</span>
              <span className="flex-1">
                <span className="block text-sm font-medium">{SCOPES[s].label}</span>
                <span className="block text-xs text-muted-foreground">
                  <code className="font-mono">{s}</code> · {SCOPES[s].description}
                </span>
              </span>
              <span
                className={cn(
                  "grid size-5 place-items-center rounded-md border transition-colors",
                  on && "border-actor-auth bg-actor-auth text-white"
                )}
              >
                {on && <Check className="size-3.5" />}
              </span>
              {on && <input type="hidden" name="grant" value={s} />}
            </button>
          </motion.li>
        )
      })}
    </ul>
  )
}
