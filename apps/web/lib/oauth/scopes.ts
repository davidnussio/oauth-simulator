/** Catalogo degli scope supportati dal server simulato (condiviso client/server). */
export const SCOPES = {
  openid: {
    label: "Sapere chi sei",
    description: "Conferma la tua identità all'app (OpenID Connect).",
    emoji: "🪪",
  },
  profile: {
    label: "Vedere il tuo profilo",
    description: "Nome, avatar e città.",
    emoji: "🙂",
  },
  email: {
    label: "Vedere la tua email",
    description: "L'indirizzo email del tuo account.",
    emoji: "✉️",
  },
  photo: {
    label: "Vedere le tue foto",
    description: "Sola lettura del tuo album fotografico.",
    emoji: "🖼️",
  },
  offline_access: {
    label: "Restare connessa anche quando non ci sei",
    description: "Permette all'app di ottenere un refresh token.",
    emoji: "🔁",
  },
  "reports:read": {
    label: "Leggere i report (macchina-macchina)",
    description: "Scope per servizi backend senza utente.",
    emoji: "📊",
  },
} as const

export type Scope = keyof typeof SCOPES

export function parseScopes(raw: string | null | undefined): Scope[] {
  if (!raw) return []
  return raw
    .split(/\s+/)
    .filter((s): s is Scope => s in SCOPES)
    .filter((s, i, arr) => arr.indexOf(s) === i)
}
