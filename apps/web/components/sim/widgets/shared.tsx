"use client"

import { motion } from "motion/react"
import { CheckCircle2, FlaskConical, Loader2, OctagonAlert } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export function ActionButton({
  busy,
  children,
  className,
  ...props
}: React.ComponentProps<typeof Button> & { busy?: boolean }) {
  return (
    <Button size="lg" disabled={busy || props.disabled} className={cn("group", className)} {...props}>
      {busy && <Loader2 className="animate-spin" />}
      {children}
    </Button>
  )
}

/** Interruttore per gli "esperimenti" (provare ad attaccare il flusso). */
export function Experiment({
  on,
  onChange,
  children,
}: {
  on: boolean
  onChange: (v: boolean) => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border border-dashed p-3 text-left text-sm transition-colors",
        on ? "border-warning/70 bg-warning/10" : "hover:bg-muted/40"
      )}
    >
      <FlaskConical className={cn("size-4 shrink-0", on ? "text-warning" : "text-muted-foreground")} />
      <span className="flex-1">
        <span className="font-medium">Esperimento:</span> {children}
      </span>
      <span className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors", on ? "bg-warning" : "bg-muted")}>
        <motion.span
          className="absolute top-0.5 size-4 rounded-full bg-white shadow"
          animate={{ left: on ? 18 : 2 }}
        />
      </span>
    </button>
  )
}

export function Callout({
  tone = "success",
  title,
  children,
}: {
  tone?: "success" | "error" | "info"
  title: React.ReactNode
  children?: React.ReactNode
}) {
  const Icon = tone === "error" ? OctagonAlert : CheckCircle2
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1, x: tone === "error" ? [0, -6, 6, -3, 3, 0] : 0 }}
      className={cn(
        "flex gap-3 rounded-xl border p-3 text-sm",
        tone === "success" && "border-success/40 bg-success/10",
        tone === "error" && "border-destructive/40 bg-destructive/10",
        tone === "info" && "border-primary/40 bg-primary/10"
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          tone === "success" && "text-success",
          tone === "error" && "text-destructive",
          tone === "info" && "text-primary"
        )}
      />
      <div className="space-y-1">
        <div className="font-medium">{title}</div>
        {children && <div className="text-muted-foreground">{children}</div>}
      </div>
    </motion.div>
  )
}

/** Mostra un valore lungo con etichetta, troncabile. */
export function Field({ label, value, mono = true, accent }: { label: string; value: string; mono?: boolean; accent?: string }) {
  return (
    <div className="min-w-0 rounded-xl border bg-background/50 p-3">
      <div className="mb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{label}</div>
      <div className={cn("text-sm break-all", mono && "font-mono text-xs")} style={accent ? { color: accent } : undefined}>
        {value}
      </div>
    </div>
  )
}

/** Effetto "decodifica": i caratteri si assestano uno dopo l'altro. */
export function Scramble({ text, className }: { text: string; className?: string }) {
  return (
    <span className={cn("font-mono break-all", className)}>
      {text.split("").map((c, i) => (
        <motion.span
          key={`${text}-${i}`}
          initial={{ opacity: 0, filter: "blur(4px)", y: -4 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{ delay: i * 0.008, duration: 0.25 }}
        >
          {c}
        </motion.span>
      ))}
    </span>
  )
}
