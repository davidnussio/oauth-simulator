import { deriveClientSecret, derivePassword, safeEqual } from "./crypto"
import { signJwt, type JwtClaims } from "./jwt"
import type { Scope } from "./scopes"

export const CLIENT_PREFIX = "lab_"

/* ---------- Errori in formato RFC 6749 ---------- */

export type OAuthErrorCode =
  | "invalid_request"
  | "invalid_client"
  | "invalid_grant"
  | "unsupported_grant_type"
  | "invalid_scope"
  | "access_denied"
  | "authorization_pending"
  | "slow_down"
  | "expired_token"
  | "invalid_token"
  | "insufficient_scope"

export function oauthError(error: OAuthErrorCode, description: string, status = 400, headers: HeadersInit = {}) {
  return Response.json(
    { error, error_description: description },
    { status, headers: { "Cache-Control": "no-store", ...headers } }
  )
}

export const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } })

/* ---------- Client e utenti ---------- */

export function isKnownClient(clientId: string | null | undefined): clientId is string {
  return !!clientId && clientId.startsWith(CLIENT_PREFIX) && clientId.length > 8
}

export async function checkClientSecret(clientId: string, secret: string | null) {
  return !!secret && safeEqual(secret, await deriveClientSecret(clientId))
}

export async function checkPassword(username: string, password: string) {
  return /^[a-z0-9._-]{3,32}$/i.test(username) && safeEqual(password, await derivePassword(username))
}

/** Estrae le credenziali del client da header Basic o dal body (client_secret_post). */
export function clientCredentials(req: Request, body: URLSearchParams) {
  const auth = req.headers.get("authorization")
  if (auth?.startsWith("Basic ")) {
    const [id, secret] = atob(auth.slice(6)).split(":")
    return { clientId: decodeURIComponent(id ?? ""), clientSecret: decodeURIComponent(secret ?? "") }
  }
  return { clientId: body.get("client_id"), clientSecret: body.get("client_secret") }
}

/* ---------- Profilo fittizio dell'utente ---------- */

export function profileFor(sub: string) {
  const name = sub.charAt(0).toUpperCase() + sub.slice(1)
  return {
    sub,
    name,
    preferred_username: sub,
    email: `${sub}@oauthlab.example`,
    email_verified: true,
    picture: `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(sub)}`,
    locale: "it-IT",
  }
}

/* ---------- Token (JWT firmati HS256) ---------- */

export const ACCESS_TTL = 60 * 60
export const CODE_TTL = 10 * 60
export const REFRESH_TTL = 60 * 60 * 24 * 30

export type CodeClaims = {
  client_id: string
  redirect_uri: string
  scope: string
  sub: string
  code_challenge?: string
  code_challenge_method?: string
  nonce?: string
}
export type CodePayload = JwtClaims & CodeClaims
export type RefreshPayload = JwtClaims & { client_id: string; scope: string; sub: string }
export type AccessPayload = JwtClaims & { client_id: string; scope: string; sub: string }

export const signCode = (p: CodeClaims, issuer: string) => signJwt(p, "lab-code", CODE_TTL, issuer)

export async function issueTokens(opts: {
  issuer: string
  clientId: string
  scopes: Scope[]
  sub?: string
  nonce?: string
  withRefresh?: boolean
}) {
  const { issuer, clientId, scopes, sub, nonce } = opts
  const scope = scopes.join(" ")
  const res: Record<string, string | number> = {
    token_type: "Bearer",
    expires_in: ACCESS_TTL,
    access_token: await signJwt(
      { sub: sub ?? clientId, client_id: clientId, scope, aud: "oauth-lab-api" },
      "at+jwt",
      ACCESS_TTL,
      issuer
    ),
    scope,
  }
  if (sub && (opts.withRefresh ?? scopes.includes("offline_access"))) {
    res.refresh_token = await signJwt({ sub, client_id: clientId, scope }, "lab-refresh", REFRESH_TTL, issuer)
  }
  if (sub && scopes.includes("openid")) {
    const p = profileFor(sub)
    const claims: Record<string, unknown> = { sub, aud: clientId, auth_time: Math.floor(Date.now() / 1000), nonce }
    if (scopes.includes("profile"))
      Object.assign(claims, { name: p.name, picture: p.picture, preferred_username: p.preferred_username })
    if (scopes.includes("email")) Object.assign(claims, { email: p.email, email_verified: p.email_verified })
    res.id_token = await signJwt(claims, "JWT", ACCESS_TTL, issuer)
  }
  return res
}
