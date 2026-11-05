import { withBase } from "@/lib/base-path"
import type { Exchange } from "./types"

/** fetch che registra richiesta e risposta per mostrarle "sotto il cofano". */
export async function recordedFetch(
  stepId: string,
  title: string,
  url: string,
  init: { method?: string; headers?: Record<string, string>; body?: string } = {}
): Promise<Exchange> {
  const method = init.method ?? "GET"
  url = withBase(url)
  const res = await fetch(url, { method, headers: init.headers, body: init.body, cache: "no-store" })
  const text = await res.text()
  let body: unknown = text
  try {
    body = JSON.parse(text)
  } catch {}
  const headers: Record<string, string> = {}
  for (const k of ["content-type", "cache-control", "www-authenticate"]) {
    const v = res.headers.get(k)
    if (v) headers[k] = v
  }
  return {
    id: crypto.randomUUID(),
    stepId,
    title,
    request: { method, url: new URL(url, window.location.origin).toString(), headers: init.headers, body: init.body },
    response: { status: res.status, statusText: res.statusText, headers, body },
  }
}

export function form(data: Record<string, string | undefined>) {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(data)) if (v !== undefined && v !== "") p.set(k, v)
  return p.toString()
}
