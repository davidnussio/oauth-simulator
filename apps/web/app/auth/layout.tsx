import { Landmark, ShieldCheck } from "lucide-react"

/** Layout delle pagine "ospitate" dal server di autorizzazione (LabID). */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-svh flex-col bg-[radial-gradient(ellipse_at_top,color-mix(in_oklch,var(--actor-auth)_22%,transparent),transparent_60%)]">
      <header className="flex items-center justify-between border-b border-actor-auth/20 px-5 py-3">
        <div className="flex items-center gap-2 font-semibold">
          <span className="grid size-7 place-items-center rounded-lg bg-actor-auth text-white">
            <Landmark className="size-4" />
          </span>
          LabID
          <span className="text-xs font-normal text-muted-foreground">· server di autorizzazione</span>
        </div>
        <span className="flex items-center gap-1 text-xs text-success">
          <ShieldCheck className="size-3.5" /> Connessione sicura
        </span>
      </header>
      <main className="flex flex-1 items-start justify-center p-5 sm:items-center">{children}</main>
    </div>
  )
}
