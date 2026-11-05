"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"

const JWT_RE = /^[\w-]+\.[\w-]+\.[\w-]+$/

/** Stringa JWT colorata nei suoi tre pezzi. */
export function JwtString({ token, className }: { token: string; className?: string }) {
  const [h, p, s] = token.split(".")
  return (
    <span className={cn("break-all", className)}>
      <span className="text-rose-400">{h}</span>.<span className="text-violet-400">{p}</span>.
      <span className="text-sky-400">{s}</span>
    </span>
  )
}

function Value({ v }: { v: unknown }) {
  if (typeof v === "string") {
    if (JWT_RE.test(v) && v.length > 60)
      return (
        <span>
          &quot;
          <JwtString token={v} />
          &quot;
        </span>
      )
    return <span className="text-emerald-500 dark:text-emerald-300 break-all">&quot;{v}&quot;</span>
  }
  if (typeof v === "number") return <span className="text-amber-500 dark:text-amber-300">{v}</span>
  if (typeof v === "boolean" || v === null) return <span className="text-sky-500 dark:text-sky-300">{String(v)}</span>
  return null
}

/** Mini syntax-highlighter per JSON. */
export function Json({ value, indent = 0 }: { value: unknown; indent?: number }) {
  const pad = "  ".repeat(indent)
  if (Array.isArray(value)) {
    if (!value.length) return <>[]</>
    return (
      <>
        [{"\n"}
        {value.map((v, i) => (
          <span key={i}>
            {pad}
            {"  "}
            <Json value={v} indent={indent + 1} />
            {i < value.length - 1 ? "," : ""}
            {"\n"}
          </span>
        ))}
        {pad}]
      </>
    )
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value)
    if (!entries.length) return <>{"{}"}</>
    return (
      <>
        {"{\n"}
        {entries.map(([k, v], i) => (
          <span key={k}>
            {pad}
            {"  "}
            <span className="text-violet-500 dark:text-violet-300">&quot;{k}&quot;</span>: <Json value={v} indent={indent + 1} />
            {i < entries.length - 1 ? "," : ""}
            {"\n"}
          </span>
        ))}
        {pad}
        {"}"}
      </>
    )
  }
  return <Value v={value} />
}

export function CodeBlock({
  children,
  className,
  copy,
  label,
}: {
  children: React.ReactNode
  className?: string
  copy?: string
  label?: string
}) {
  return (
    <div className={cn("group relative overflow-hidden rounded-xl border bg-muted/40", className)}>
      {label && (
        <div className="border-b px-3 py-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </div>
      )}
      <pre className="max-h-80 overflow-auto p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap">{children}</pre>
      {copy && <CopyButton text={copy} className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100" />}
    </div>
  )
}

export function CopyButton({ text, className }: { text: string; className?: string }) {
  const [ok, setOk] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(text)
        setOk(true)
        setTimeout(() => setOk(false), 1200)
      }}
      className={cn(
        "grid size-7 place-items-center rounded-md border bg-background/80 text-muted-foreground transition hover:text-foreground",
        className
      )}
      aria-label="Copia"
    >
      {ok ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
    </button>
  )
}
