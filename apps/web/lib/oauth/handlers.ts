/**
 * Il server di autorizzazione "LabID" come semplice router Request → Response.
 * Gira dentro un Service Worker: ogni fetch verso /api/* o /.well-known/*
 * viene risposto qui, nel browser, ma resta una vera richiesta HTTP.
 */
import { deriveClientSecret, derivePassword, randomId, randomInt, sha256b64url } from "./crypto"
import { signJwt, verifyJwt } from "./jwt"
import { parseScopes, SCOPES, type Scope } from "./scopes"
import {
  checkClientSecret,
  checkPassword,
  CLIENT_PREFIX,
  clientCredentials,
  issueTokens,
  isKnownClient,
  json,
  oauthError,
  profileFor,
  signCode,
  type AccessPayload,
  type CodePayload,
  type RefreshPayload,
} from "./server"
import { gc, store } from "./store"

type Ctx = { req: Request; url: URL; issuer: string }
type Handler = (ctx: Ctx) => Promise<Response> | Response

const DEVICE_GRANT = "urn:ietf:params:oauth:grant-type:device_code"
const NAMES = ["ada", "alan", "grace", "linus", "margaret", "tim", "barbara", "dennis", "hedy", "katherine"]
const redirectUriOf = (issuer: string) => `${issuer}/callback`

/* ------------------------------------------------------------------ */

const register: Handler = async ({ issuer }) => {
  const client_id = CLIENT_PREFIX + randomId(9).replace(/[-_]/g, "x")
  const username = `${NAMES[randomInt(NAMES.length)]}${randomInt(900) + 100}`
  return json({
    client_id,
    client_secret: await deriveClientSecret(client_id),
    redirect_uri: redirectUriOf(issuer),
    username,
    password: await derivePassword(username),
  })
}

const login: Handler = async ({ req }) => {
  const { username = "", password = "" } = (await req.json().catch(() => ({}))) as Record<string, string>
  if (!(await checkPassword(username.trim(), password.trim()))) {
    return json({ ok: false, message: "Username o password sbagliati." }, 401)
  }
  return json({ ok: true })
}

/** Riceve il form di consenso e reindirizza il browser al redirect_uri (code o token). */
const authorize: Handler = async ({ req, issuer }) => {
  const form = await req.formData()
  const get = (k: string) => (form.get(k) as string | null)?.trim() || undefined
  const clientId = get("client_id")
  const redirectUri = get("redirect_uri")
  if (!isKnownClient(clientId) || redirectUri !== redirectUriOf(issuer)) {
    return json({ error: "invalid_request", error_description: "client_id o redirect_uri non validi: non reindirizzo." }, 400)
  }

  const state = get("state")
  const responseType = get("response_type")
  const back = (params: Record<string, string | undefined>) => {
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) if (v !== undefined) p.set(k, v)
    return Response.redirect(`${redirectUri}${responseType === "token" ? "#" : "?"}${p}`, 303)
  }

  if (get("decision") !== "allow") return back({ error: "access_denied", error_description: "L'utente ha rifiutato.", state })
  const username = get("username") ?? ""
  if (!(await checkPassword(username, get("password") ?? ""))) {
    return back({ error: "access_denied", error_description: "Login fallito.", state })
  }

  const requested = parseScopes(get("scope"))
  const granted = parseScopes((form.getAll("grant") as string[]).join(" ")).filter((s) => requested.includes(s))
  const scope = granted.join(" ")

  if (responseType === "code") {
    const challenge = get("code_challenge")
    const method = get("code_challenge_method") ?? (challenge ? "plain" : undefined)
    if (method && method !== "S256" && method !== "plain") {
      return back({ error: "invalid_request", error_description: "code_challenge_method non supportato.", state })
    }
    const code = await signCode(
      {
        client_id: clientId,
        redirect_uri: redirectUri,
        scope,
        sub: username,
        code_challenge: challenge,
        code_challenge_method: method,
        nonce: get("nonce"),
      },
      issuer
    )
    return back({ code, state, iss: issuer })
  }
  if (responseType === "token") {
    const t = await issueTokens({ issuer, clientId, scopes: granted, sub: username, withRefresh: false })
    return back({ access_token: String(t.access_token), token_type: "Bearer", expires_in: String(t.expires_in), scope, state })
  }
  return back({ error: "unsupported_response_type", error_description: "Usa code o token.", state })
}

const token: Handler = async ({ req, issuer }) => {
  gc()
  if (!(req.headers.get("content-type") ?? "").includes("application/x-www-form-urlencoded")) {
    return oauthError("invalid_request", "Il token endpoint accetta solo application/x-www-form-urlencoded.")
  }
  const body = new URLSearchParams(await req.text())
  const { clientId, clientSecret } = clientCredentials(req, body)
  if (!isKnownClient(clientId)) return oauthError("invalid_client", "client_id sconosciuto.", 401)
  if (clientSecret && !(await checkClientSecret(clientId, clientSecret))) {
    return oauthError("invalid_client", "client_secret sbagliato.", 401)
  }
  const grant = body.get("grant_type")

  switch (grant) {
    case "authorization_code": {
      const code = body.get("code")
      if (!code) return oauthError("invalid_request", "Manca il parametro code.")
      let p: CodePayload
      try {
        p = await verifyJwt<CodePayload>(code, "lab-code", issuer)
      } catch (e) {
        return oauthError("invalid_grant", `Codice non valido o scaduto: ${(e as Error).message}`)
      }
      if (store.usedCodes.has(p.jti)) {
        return oauthError("invalid_grant", "Questo codice è già stato usato! Un codice vale una volta sola.")
      }
      if (p.client_id !== clientId) return oauthError("invalid_grant", "Il codice è stato emesso per un altro client.")
      if (body.get("redirect_uri") !== p.redirect_uri) {
        return oauthError("invalid_grant", "redirect_uri diverso da quello usato in /authorize.")
      }
      if (p.code_challenge) {
        const verifier = body.get("code_verifier")
        if (!verifier) return oauthError("invalid_request", "Manca code_verifier (il codice era protetto da PKCE).")
        const computed = p.code_challenge_method === "S256" ? await sha256b64url(verifier) : verifier
        if (computed !== p.code_challenge) {
          return oauthError("invalid_grant", "PKCE fallito: SHA256(code_verifier) non corrisponde al code_challenge iniziale.")
        }
      } else if (!clientSecret) {
        return oauthError("invalid_client", "Senza PKCE serve il client_secret.", 401)
      }
      store.usedCodes.set(p.jti, p.exp * 1000)
      return json(await issueTokens({ issuer, clientId, scopes: parseScopes(p.scope), sub: p.sub, nonce: p.nonce }))
    }

    case "refresh_token": {
      const rt = body.get("refresh_token")
      if (!rt) return oauthError("invalid_request", "Manca refresh_token.")
      let p: RefreshPayload
      try {
        p = await verifyJwt<RefreshPayload>(rt, "lab-refresh", issuer)
      } catch (e) {
        return oauthError("invalid_grant", `Refresh token non valido: ${(e as Error).message}`)
      }
      if (store.revokedRefresh.has(p.jti)) {
        return oauthError("invalid_grant", "Refresh token già usato: con la rotazione ogni refresh token vale una volta.")
      }
      if (p.client_id !== clientId) return oauthError("invalid_grant", "Refresh token di un altro client.")
      store.revokedRefresh.set(p.jti, p.exp * 1000)
      return json(await issueTokens({ issuer, clientId, scopes: parseScopes(p.scope), sub: p.sub, withRefresh: true }))
    }

    case "client_credentials": {
      if (!clientSecret) return oauthError("invalid_client", "client_credentials richiede il client_secret.", 401)
      const requested = parseScopes(body.get("scope") ?? "reports:read")
      if (requested.some((s) => s !== "reports:read")) {
        return oauthError("invalid_scope", "Senza utente puoi chiedere solo scope di servizio (reports:read).")
      }
      return json(await issueTokens({ issuer, clientId, scopes: requested }))
    }

    case DEVICE_GRANT: {
      const dc = body.get("device_code")
      if (!dc) return oauthError("invalid_request", "Manca device_code.")
      let userCode: string
      try {
        userCode = (await verifyJwt<{ user_code: string }>(dc, "lab-device", issuer)).user_code
      } catch {
        return oauthError("expired_token", "Il device_code è scaduto: ricomincia.")
      }
      const d = store.devices.get(userCode)
      if (!d) return oauthError("expired_token", "Richiesta scaduta o già completata.")
      if (d.clientId !== clientId) return oauthError("invalid_grant", "device_code di un altro client.")
      const now = Date.now()
      const tooFast = d.lastPoll && now - d.lastPoll < 1500
      d.lastPoll = now
      if (d.status === "pending") {
        return tooFast
          ? oauthError("slow_down", "Stai interrogando troppo spesso: rallenta!")
          : oauthError("authorization_pending", "L'utente non ha ancora approvato. Riprova tra poco.")
      }
      store.devices.delete(userCode)
      if (d.status === "denied") return oauthError("access_denied", "L'utente ha rifiutato la richiesta.")
      return json(await issueTokens({ issuer, clientId, scopes: parseScopes(d.scope), sub: d.sub }))
    }

    default:
      return oauthError("unsupported_grant_type", `grant_type "${grant}" non supportato.`)
  }
}

/* ---------- Device Authorization (RFC 8628) ---------- */

// Alfabeto senza vocali e caratteri ambigui, come suggerito dalla RFC
const ALPHABET = "BCDFGHJKLMNPQRSTVWXZ"
const DEVICE_TTL = 600

const device: Handler = async ({ req, issuer }) => {
  gc()
  const body = new URLSearchParams(await req.text())
  const clientId = body.get("client_id")
  if (!isKnownClient(clientId)) return oauthError("invalid_client", "client_id sconosciuto.", 401)
  let s = ""
  for (let i = 0; i < 8; i++) s += ALPHABET[randomInt(ALPHABET.length)]
  const user_code = `${s.slice(0, 4)}-${s.slice(4)}`
  store.devices.set(user_code, {
    userCode: user_code,
    clientId,
    scope: parseScopes(body.get("scope")).join(" "),
    status: "pending",
    expiresAt: Date.now() + DEVICE_TTL * 1000,
  })
  const verification_uri = `${issuer}/auth/device`
  return json({
    device_code: await signJwt({ user_code }, "lab-device", DEVICE_TTL, issuer),
    user_code,
    verification_uri,
    verification_uri_complete: `${verification_uri}?user_code=${user_code}`,
    expires_in: DEVICE_TTL,
    interval: 2,
  })
}

const deviceVerify: Handler = async ({ req }) => {
  const b = (await req.json().catch(() => ({}))) as {
    action?: "lookup" | "approve" | "deny"
    user_code?: string
    username?: string
    password?: string
  }
  const code = (b.user_code ?? "").toUpperCase().replace(/[^A-Z]/g, "")
  const d = store.devices.get(`${code.slice(0, 4)}-${code.slice(4, 8)}`)
  if (!d || d.expiresAt < Date.now()) return json({ ok: false, message: "Codice non trovato o scaduto." }, 404)
  if (d.status !== "pending") return json({ ok: false, message: "Questo codice è già stato usato." }, 409)
  if (b.action === "lookup") return json({ ok: true, client_id: d.clientId, scope: d.scope, user_code: d.userCode })
  if (!(await checkPassword(b.username?.trim() ?? "", b.password?.trim() ?? ""))) {
    return json({ ok: false, message: "Username o password sbagliati." }, 401)
  }
  d.status = b.action === "approve" ? "approved" : "denied"
  d.sub = b.username!.trim()
  return json({ ok: true, status: d.status })
}

/* ---------- Resource server ---------- */

async function bearer(ctx: Ctx, needed: Scope): Promise<{ token: AccessPayload } | { error: Response }> {
  const auth = ctx.req.headers.get("authorization")
  const challenge = (extra: string) => ({ "WWW-Authenticate": `Bearer realm="oauth-lab"${extra}` })
  if (!auth?.startsWith("Bearer ")) {
    return { error: oauthError("invalid_token", "Manca l'header Authorization: Bearer <token>.", 401, challenge("")) }
  }
  try {
    const p = await verifyJwt<AccessPayload>(auth.slice(7), "at+jwt", ctx.issuer)
    if (!parseScopes(p.scope).includes(needed)) {
      return {
        error: oauthError(
          "insufficient_scope",
          `Il token è valido ma non ha lo scope "${needed}".`,
          403,
          challenge(`, error="insufficient_scope", scope="${needed}"`)
        ),
      }
    }
    return { token: p }
  } catch (e) {
    return {
      error: oauthError("invalid_token", `Token non valido: ${(e as Error).message}`, 401, challenge(`, error="invalid_token"`)),
    }
  }
}

const PHOTOS = [
  { emoji: "🏔️", title: "Gita al Monte Generoso" },
  { emoji: "🍝", title: "Pranzo della domenica" },
  { emoji: "🐈", title: "Il gatto sul divano" },
  { emoji: "🌅", title: "Tramonto sul lago" },
  { emoji: "🎂", title: "Compleanno" },
  { emoji: "🚲", title: "Giro in bici" },
]

const photos: Handler = async (ctx) => {
  const r = await bearer(ctx, "photo")
  if ("error" in r) return r.error
  return json({ owner: r.token.sub, photos: PHOTOS.map((p, i) => ({ id: `ph_${i + 1}`, ...p })) })
}

const reports: Handler = async (ctx) => {
  const r = await bearer(ctx, "reports:read")
  if ("error" in r) return r.error
  return json({
    requested_by: r.token.client_id,
    generated_at: new Date().toISOString(),
    reports: [
      { name: "Vendite settimanali", value: "CHF 48'210", trend: "+12%" },
      { name: "Nuovi utenti", value: "1'284", trend: "+4%" },
      { name: "Ticket aperti", value: "37", trend: "-9%" },
    ],
  })
}

const userinfo: Handler = async (ctx) => {
  const r = await bearer(ctx, "openid")
  if ("error" in r) return r.error
  const scopes = parseScopes(r.token.scope)
  const p = profileFor(r.token.sub)
  return json({
    sub: p.sub,
    ...(scopes.includes("profile") && { name: p.name, preferred_username: p.preferred_username, picture: p.picture, locale: p.locale }),
    ...(scopes.includes("email") && { email: p.email, email_verified: p.email_verified }),
  })
}

const discovery: Handler = ({ issuer }) =>
  json({
    issuer,
    authorization_endpoint: `${issuer}/auth/authorize`,
    token_endpoint: `${issuer}/api/oauth/token`,
    device_authorization_endpoint: `${issuer}/api/oauth/device`,
    userinfo_endpoint: `${issuer}/api/oauth/userinfo`,
    scopes_supported: Object.keys(SCOPES),
    response_types_supported: ["code", "token"],
    grant_types_supported: ["authorization_code", "refresh_token", "client_credentials", DEVICE_GRANT],
    code_challenge_methods_supported: ["S256", "plain"],
    token_endpoint_auth_methods_supported: ["client_secret_post", "client_secret_basic", "none"],
    id_token_signing_alg_values_supported: ["HS256"],
  })

/* ---------- Router ---------- */

const ROUTES: Record<string, Handler> = {
  "POST /api/oauth/register": register,
  "POST /api/oauth/authorize/login": login,
  "POST /api/oauth/authorize": authorize,
  "POST /api/oauth/token": token,
  "POST /api/oauth/device": device,
  "POST /api/oauth/device/verify": deviceVerify,
  "GET /api/oauth/userinfo": userinfo,
  "GET /api/resource/photos": photos,
  "GET /api/resource/reports": reports,
  "GET /.well-known/openid-configuration": discovery,
}

/** true se la richiesta va gestita dal server simulato. */
export function isServerRoute(url: URL, basePath: string) {
  const path = url.pathname.slice(basePath.length)
  return url.pathname.startsWith(basePath) && (path.startsWith("/api/") || path.startsWith("/.well-known/"))
}

export async function handle(req: Request, basePath: string): Promise<Response> {
  const url = new URL(req.url)
  const path = url.pathname.slice(basePath.length).replace(/\/$/, "")
  const h = ROUTES[`${req.method} ${path}`]
  if (!h) return oauthError("invalid_request", `Endpoint sconosciuto: ${req.method} ${path}`, 404)
  try {
    return await h({ req, url, issuer: url.origin + basePath })
  } catch (e) {
    return json({ error: "server_error", error_description: (e as Error).message }, 500)
  }
}
