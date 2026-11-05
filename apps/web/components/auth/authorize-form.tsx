"use client"

import { useCallback, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ArrowRight, Loader2, LogIn, ShieldQuestion } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { withBase } from "@/lib/base-path"
import type { Scope } from "@/lib/oauth/scopes"
import { LoginFields } from "./login-fields"
import { ScopeList } from "./scope-list"
import { useAutofill } from "./use-autofill"

const PASS_THROUGH = [
  "response_type",
  "client_id",
  "redirect_uri",
  "scope",
  "state",
  "code_challenge",
  "code_challenge_method",
  "nonce",
] as const

export function AuthorizeForm({
  params,
  scopes,
}: {
  params: Record<string, string | undefined>
  scopes: Scope[]
}) {
  const [stage, setStage] = useState<"login" | "consent">("login")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [granted, setGranted] = useState(() => new Set(scopes))

  useAutofill(
    useCallback((u: string, p: string) => {
      setUsername(u)
      setPassword(p)
    }, [])
  )

  async function login(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(undefined)
    const r = await fetch(withBase("/api/oauth/authorize/login"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
    setBusy(false)
    if (r.ok) setStage("consent")
    else setError((await r.json()).message)
  }

  return (
    <div className="w-full max-w-md">
      <AnimatePresence mode="wait" initial={false}>
        {stage === "login" ? (
          <motion.form
            key="login"
            onSubmit={login}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="glass space-y-5 rounded-2xl p-6 shadow-2xl"
          >
            <div>
              <h1 className="flex items-center gap-2 text-lg font-semibold">
                <LogIn className="size-5 text-actor-auth" /> Accedi a LabID
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Stai digitando la password <b>sul sito di LabID</b>, non nell&apos;app. L&apos;app non la vedrà mai.
              </p>
            </div>
            <LoginFields {...{ username, password, setUsername, setPassword }} />
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto", x: [0, -6, 6, -4, 4, 0] }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm text-destructive"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
            <Button type="submit" className="w-full bg-actor-auth shadow-actor-auth/50" disabled={busy}>
              {busy ? <Loader2 className="animate-spin" /> : <ArrowRight />} Accedi
            </Button>
          </motion.form>
        ) : (
          <motion.form
            key="consent"
            method="post"
            action={withBase("/api/oauth/authorize")}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass space-y-5 rounded-2xl p-6 shadow-2xl"
          >
            {PASS_THROUGH.map((k) =>
              params[k] ? <input key={k} type="hidden" name={k} value={params[k]} /> : null
            )}
            <input type="hidden" name="username" value={username} />
            <input type="hidden" name="password" value={password} />
            <div>
              <h1 className="flex items-center gap-2 text-lg font-semibold">
                <ShieldQuestion className="size-5 text-actor-auth" /> Ciao {username}!
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                L&apos;app <b className="text-actor-app">App Foto</b>{" "}
                <code className="rounded bg-muted px-1 text-xs">{params.client_id}</code> vuole il permesso di:
              </p>
            </div>
            {scopes.length ? (
              <ScopeList
                scopes={scopes}
                granted={granted}
                toggle={(s) =>
                  setGranted((g) => {
                    const n = new Set(g)
                    if (n.has(s)) n.delete(s)
                    else n.add(s)
                    return n
                  })
                }
              />
            ) : (
              <p className="text-sm text-muted-foreground">Nessun permesso particolare richiesto.</p>
            )}
            <p className="text-xs text-muted-foreground">
              Puoi togliere la spunta: l&apos;app riceverà solo i permessi che lasci attivi.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button type="submit" name="decision" value="deny" variant="outline">
                Rifiuta
              </Button>
              <Button type="submit" name="decision" value="allow" variant="success">
                Consenti
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}
