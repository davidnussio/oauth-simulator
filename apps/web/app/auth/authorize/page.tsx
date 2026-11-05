import { Suspense } from "react"

import { AuthorizeGate } from "@/components/auth/authorize-gate"

export const metadata = { title: "Accedi · LabID" }

/** Authorization endpoint (GET): mostra login + consenso all'utente. */
export default function AuthorizePage() {
  return (
    <Suspense>
      <AuthorizeGate />
    </Suspense>
  )
}
