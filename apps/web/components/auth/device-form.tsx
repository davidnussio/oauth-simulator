"use client"

import { useCallback, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { CheckCircle2, Loader2, Tv, XCircle } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { withBase } from "@/lib/base-path"
import { parseScopes } from "@/lib/oauth/scopes"
import { LoginFields } from "./login-fields"
import { ScopeList } from "./scope-list"
import { useAutofill } from "./use-autofill"

type Stage = "code" | "login" | "done"

export function DeviceForm({ initialCode }: { initialCode: string }) {
  const [stage, setStage] = useState<Stage>("code")
  const [code, setCode] = useState(initialCode)
  const [info, setInfo] = useState<{ client_id: string; scope: string; user_code: string }>()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<"approved" | "denied">()

  useAutofill(
    useCallback((u: string, p: string) => {
      setUsername(u)
      setPassword(p)
    }, [])
  )

  async function call(body: object) {
    setBusy(true)
    setError(undefined)
    const r = await fetch(withBase("/api/oauth/device/verify"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
    setBusy(false)
    const j = await r.json()
    if (!r.ok) setError(j.message)
    return r.ok ? j : null
  }

  return (
    <div className="w-full max-w-md">
      <AnimatePresence mode="wait" initial={false}>
        {stage === "code" && (
          <motion.form
            key="code"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -30 }}
            onSubmit={async (e) => {
              e.preventDefault()
              const j = await call({ action: "lookup", user_code: code })
              if (j) {
                setInfo(j)
                setStage("login")
              }
            }}
            className="glass space-y-5 rounded-2xl p-6 shadow-2xl"
          >
            <h1 className="flex items-center gap-2 text-lg font-semibold">
              <Tv className="size-5 text-actor-auth" /> Collega un dispositivo
            </h1>
            <p className="text-sm text-muted-foreground">Inserisci il codice che vedi sullo schermo della TV.</p>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABCD-EFGH"
              maxLength={9}
              className="h-14 w-full rounded-xl border border-input bg-background/60 text-center font-mono text-2xl tracking-[0.3em] outline-none focus:ring-[3px] focus:ring-ring"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full bg-actor-auth" disabled={busy || code.length < 8}>
              {busy && <Loader2 className="animate-spin" />} Continua
            </Button>
          </motion.form>
        )}
        {stage === "login" && info && (
          <motion.form
            key="login"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            onSubmit={(e) => e.preventDefault()}
            className="glass space-y-5 rounded-2xl p-6 shadow-2xl"
          >
            <div>
              <h1 className="text-lg font-semibold">Accedi e autorizza la TV</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Codice <code className="font-mono text-foreground">{info.user_code}</code> · client{" "}
                <code className="text-xs">{info.client_id}</code>
              </p>
            </div>
            <LoginFields {...{ username, password, setUsername, setPassword }} />
            <ScopeList scopes={parseScopes(info.scope)} granted={new Set(parseScopes(info.scope))} toggle={() => {}} />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                disabled={busy}
                onClick={async () => {
                  if (await call({ action: "deny", user_code: info.user_code, username, password })) {
                    setResult("denied")
                    setStage("done")
                  }
                }}
              >
                Rifiuta
              </Button>
              <Button
                variant="success"
                disabled={busy || !username || !password}
                onClick={async () => {
                  if (await call({ action: "approve", user_code: info.user_code, username, password })) {
                    setResult("approved")
                    setStage("done")
                  }
                }}
              >
                {busy && <Loader2 className="animate-spin" />} Consenti
              </Button>
            </div>
          </motion.form>
        )}
        {stage === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass space-y-3 rounded-2xl p-8 text-center shadow-2xl"
          >
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 14 }}
              className="mx-auto w-fit"
            >
              {result === "approved" ? (
                <CheckCircle2 className="size-14 text-success" />
              ) : (
                <XCircle className="size-14 text-destructive" />
              )}
            </motion.div>
            <h1 className="text-lg font-semibold">
              {result === "approved" ? "Fatto! Torna alla TV 📺" : "Richiesta rifiutata"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {result === "approved"
                ? "La TV se ne accorgerà da sola al prossimo controllo (polling)."
                : "La TV riceverà l'errore access_denied."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
