"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Popover } from "radix-ui"
import { motion } from "motion/react"
import { FlaskConical, KeyRound, Moon, RefreshCw, Sun } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { FLOWS } from "@/lib/sim/flows"
import { CopyButton } from "@/components/sim/code"
import { useCredentials } from "./credentials"

const SHORT: Record<string, string> = {
  pkce: "PKCE",
  "authorization-code": "Auth Code",
  oidc: "OpenID",
  device: "Device",
  "client-credentials": "Machine",
  implicit: "Implicit",
}

export function SiteHeader() {
  const pathname = usePathname()
  return (
    <header className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold whitespace-nowrap">
          <motion.span
            whileHover={{ rotate: -20, scale: 1.1 }}
            className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-actor-auth to-actor-app text-white shadow-lg shadow-actor-auth/30"
          >
            <KeyRound className="size-4" />
          </motion.span>
          <span>
            OAuth <span className="text-gradient">Lab</span>
          </span>
        </Link>
        <nav className="ml-2 hidden items-center gap-0.5 lg:flex">
          {FLOWS.map((f) => {
            const active = pathname === `/flow/${f.id}`
            return (
              <Link
                key={f.id}
                href={`/flow/${f.id}`}
                className={cn(
                  "relative rounded-lg px-2.5 py-1.5 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground",
                  active && "text-foreground"
                )}
              >
                {active && <motion.span layoutId="nav-active" className="absolute inset-0 rounded-lg bg-muted" />}
                <span className="relative">
                  {f.emoji} {SHORT[f.id] ?? f.name}
                </span>
              </Link>
            )
          })}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <LabButton />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

function LabButton() {
  const { creds, regenerate, loading } = useCredentials()
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5">
          <FlaskConical /> <span className="hidden sm:inline">Il tuo laboratorio</span>
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 w-80 rounded-2xl border bg-popover p-4 text-sm shadow-2xl animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
        >
          <div className="mb-1 font-semibold">🧪 Il tuo laboratorio</div>
          <p className="mb-3 text-xs text-muted-foreground">
            Abbiamo registrato per te un&apos;app (client) e un utente di prova sul server LabID, come faresti su Google
            Cloud o Entra ID.
          </p>
          {creds ? (
            <div className="space-y-2">
              {(
                [
                  ["client_id", creds.client_id],
                  ["client_secret", creds.client_secret],
                  ["redirect_uri", creds.redirect_uri],
                  ["username", creds.username],
                  ["password", creds.password],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2 rounded-lg bg-muted/50 px-2.5 py-1.5">
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] tracking-wide text-muted-foreground uppercase">{k}</div>
                    <div className="truncate font-mono text-xs">{v}</div>
                  </div>
                  <CopyButton text={v} />
                </div>
              ))}
            </div>
          ) : (
            <div className="h-40 animate-pulse rounded-lg bg-muted/50" />
          )}
          <Button variant="outline" size="sm" className="mt-3 w-full" onClick={regenerate} disabled={loading}>
            <RefreshCw className={loading ? "animate-spin" : ""} /> Registra un nuovo client
          </Button>
          <Popover.Arrow className="fill-border" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

function ThemeToggle() {
  const toggle = () => {
    const d = document.documentElement
    const next = d.classList.contains("light") ? "dark" : "light"
    const apply = () => {
      d.classList.remove("light", "dark")
      d.classList.add(next)
      d.style.colorScheme = next
      localStorage.setItem("theme", next)
    }
    // transizione animata del tema dove supportata
    if (document.startViewTransition) document.startViewTransition(apply)
    else apply()
  }
  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Cambia tema">
      <Sun className="hidden size-4 [html.light_&]:block" />
      <Moon className="size-4 [html.light_&]:hidden" />
    </Button>
  )
}
