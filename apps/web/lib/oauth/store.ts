/**
 * Stato in memoria del server simulato. Serve solo per ciò che non può essere
 * stateless: codici già usati, refresh token ruotati e richieste del Device Flow.
 */
export type DeviceRequest = {
  userCode: string
  clientId: string
  scope: string
  status: "pending" | "approved" | "denied"
  sub?: string
  expiresAt: number
  lastPoll?: number
}

type Store = {
  usedCodes: Map<string, number>
  revokedRefresh: Map<string, number>
  devices: Map<string, DeviceRequest>
}

const g = globalThis as unknown as { __oauthLabStore?: Store }

export const store: Store = (g.__oauthLabStore ??= {
  usedCodes: new Map(),
  revokedRefresh: new Map(),
  devices: new Map(),
})

export function gc() {
  const now = Date.now()
  for (const [k, exp] of store.usedCodes) if (exp < now) store.usedCodes.delete(k)
  for (const [k, exp] of store.revokedRefresh) if (exp < now) store.revokedRefresh.delete(k)
  for (const [k, d] of store.devices) if (d.expiresAt < now) store.devices.delete(k)
}
