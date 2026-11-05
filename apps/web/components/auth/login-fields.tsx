"use client"

import { KeyRound, UserRound } from "lucide-react"

export function LoginFields({
  username,
  password,
  setUsername,
  setPassword,
}: {
  username: string
  password: string
  setUsername: (v: string) => void
  setPassword: (v: string) => void
}) {
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted-foreground">Username</span>
        <div className="flex items-center gap-2 rounded-lg border border-input bg-background/60 px-3 focus-within:ring-[3px] focus-within:ring-ring">
          <UserRound className="size-4 text-muted-foreground" />
          <input
            name="username"
            autoComplete="off"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="h-10 w-full bg-transparent text-sm outline-none"
            placeholder="es. ada123"
            required
          />
        </div>
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted-foreground">Password</span>
        <div className="flex items-center gap-2 rounded-lg border border-input bg-background/60 px-3 focus-within:ring-[3px] focus-within:ring-ring">
          <KeyRound className="size-4 text-muted-foreground" />
          <input
            name="password"
            type="password"
            autoComplete="off"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-10 w-full bg-transparent text-sm outline-none"
            placeholder="la password del tuo utente"
            required
          />
        </div>
      </label>
    </div>
  )
}
