"use client"

import { motion } from "motion/react"

import { cn } from "@workspace/ui/lib/utils"
import type { Exchange } from "@/lib/sim/types"
import { CodeBlock, Json } from "./code"

function RequestText({ req }: { req: Exchange["request"] }) {
  const url = new URL(req.url)
  const body =
    req.body && req.headers?.["content-type"]?.includes("x-www-form-urlencoded")
      ? req.body.split("&").map((kv, i) => {
          const [k, v = ""] = kv.split("=")
          return (
            <span key={i}>
              {i > 0 && "\n&"}
              <span className="text-violet-500 dark:text-violet-300">{k}</span>=
              <span className="break-all text-emerald-600 dark:text-emerald-300">{decodeURIComponent(v)}</span>
            </span>
          )
        })
      : req.body
  return (
    <>
      <span className="font-semibold text-primary">{req.method}</span> {url.pathname}
      {url.search} HTTP/1.1{"\n"}
      <span className="text-muted-foreground">Host:</span> {url.host}
      {Object.entries(req.headers ?? {}).map(([k, v]) => (
        <span key={k}>
          {"\n"}
          <span className="text-muted-foreground">{k}:</span> <span className="break-all">{v}</span>
        </span>
      ))}
      {body && (
        <>
          {"\n\n"}
          {body}
        </>
      )}
    </>
  )
}

export function HttpView({ exchange, compact }: { exchange: Exchange; compact?: boolean }) {
  const res = exchange.response
  const ok = res && res.status < 400
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("grid gap-3", !compact && "lg:grid-cols-2")}
    >
      <CodeBlock label="➡️ Richiesta" copy={exchange.request.url}>
        <RequestText req={exchange.request} />
      </CodeBlock>
      {res && (
        <CodeBlock label="⬅️ Risposta">
          <span className={cn("font-semibold", ok ? "text-success" : "text-destructive")}>
            HTTP/1.1 {res.status} {res.statusText}
          </span>
          {Object.entries(res.headers ?? {}).map(([k, v]) => (
            <span key={k}>
              {"\n"}
              <span className="text-muted-foreground">{k}:</span> {v}
            </span>
          ))}
          {"\n\n"}
          <Json value={res.body} />
        </CodeBlock>
      )}
    </motion.div>
  )
}
