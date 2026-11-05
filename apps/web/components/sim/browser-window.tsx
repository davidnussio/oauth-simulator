"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "motion/react"
import { Lock, RotateCw, Sparkles } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import type { Credentials } from "@/lib/sim/types"
import { CopyButton } from "./code"

/**
 * Una finestra del browser finta che contiene un vero iframe verso le pagine
 * del server di autorizzazione. Quando il server reindirizza a /callback,
 * la pagina di callback ci avvisa via postMessage.
 */
export function BrowserWindow({
  src,
  creds,
  onCallback,
  tone = "auth",
  className,
  height = 520,
}: {
  src: string
  creds: Credentials | null
  onCallback?: (href: string) => void
  tone?: "auth" | "app"
  className?: string
  height?: number
}) {
  const ref = useRef<HTMLIFrameElement>(null)
  const [url, setUrl] = useState(src)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== ref.current?.contentWindow) return
      const d = e.data as { type?: string; href?: string }
      if (d?.type === "oauth-lab:callback" && d.href) {
        setUrl(d.href)
        onCallback?.(d.href)
      }
    }
    window.addEventListener("message", onMsg)
    return () => window.removeEventListener("message", onMsg)
  }, [onCallback])

  const autofill = () =>
    creds &&
    ref.current?.contentWindow?.postMessage(
      { type: "oauth-lab:autofill", username: creds.username, password: creds.password },
      window.location.origin
    )

  const u = (() => {
    try {
      return new URL(url)
    } catch {
      return null
    }
  })()

  return (
    <div className={cn("grid gap-3 lg:grid-cols-[1fr_220px]", className)}>
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="overflow-hidden rounded-2xl border bg-background shadow-2xl"
      >
        <div className="flex items-center gap-2 border-b bg-muted/50 px-3 py-2">
          <div className="flex gap-1.5">
            <span className="size-3 rounded-full bg-[#ff5f57]" />
            <span className="size-3 rounded-full bg-[#febc2e]" />
            <span className="size-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg bg-background px-2.5 py-1 font-mono text-[11px]">
            <Lock className="size-3 shrink-0 text-success" />
            <span className="truncate">
              <span className="text-muted-foreground">{u?.origin}</span>
              <span className={tone === "auth" ? "text-actor-auth" : "text-actor-app"}>{u?.pathname}</span>
              <span className="text-muted-foreground">
                {u?.search}
                {u?.hash}
              </span>
            </span>
          </div>
          <button
            onClick={() => {
              setUrl(src)
              setNonce((n) => n + 1)
            }}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Ricarica"
          >
            <RotateCw className="size-3.5" />
          </button>
        </div>
        <iframe
          key={nonce}
          ref={ref}
          src={src}
          title="Browser simulato"
          className="w-full bg-background"
          style={{ height }}
          onLoad={() => {
            try {
              const href = ref.current?.contentWindow?.location.href
              if (href && href !== "about:blank") setUrl(href)
            } catch {}
          }}
        />
      </motion.div>

      {creds && (
        <motion.aside
          initial={{ opacity: 0, rotate: 4, x: 20 }}
          animate={{ opacity: 1, rotate: -1.5, x: 0 }}
          transition={{ delay: 0.25 }}
          className="h-fit rounded-xl border border-amber-400/40 bg-amber-200/90 p-4 text-amber-950 shadow-xl dark:bg-amber-200/90"
        >
          <div className="mb-2 text-xs font-semibold tracking-wide uppercase">📝 Post-it: il tuo utente</div>
          {[
            ["Username", creds.username],
            ["Password", creds.password],
          ].map(([k, v]) => (
            <div key={k} className="mb-2">
              <div className="text-[11px] opacity-70">{k}</div>
              <div className="flex items-center justify-between gap-2 font-mono text-sm font-semibold">
                {v}
                <CopyButton text={v!} className="border-amber-900/20 bg-amber-100/60 text-amber-900" />
              </div>
            </div>
          ))}
          <Button size="sm" onClick={autofill} className="mt-1 w-full bg-amber-900 text-amber-50 shadow-none">
            <Sparkles /> Compila per me
          </Button>
        </motion.aside>
      )}
    </div>
  )
}
