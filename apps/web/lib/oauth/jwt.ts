import { b64url, b64urlDecode, b64urlDecodeText, hmac, hmacKey, randomId } from "./crypto"

export type JwtClaims = {
  iss: string
  iat: number
  exp: number
  jti: string
  sub?: string
  aud?: string
  [k: string]: unknown
}

/** Firma un JWT HS256 (header.payload.firma). */
export async function signJwt(payload: Record<string, unknown>, typ: string, ttl: number, issuer: string) {
  const now = Math.floor(Date.now() / 1000)
  const clean = Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== undefined))
  const body = { ...clean, iss: issuer, iat: now, exp: now + ttl, jti: randomId(9) }
  const data = `${b64url(JSON.stringify({ alg: "HS256", typ }))}.${b64url(JSON.stringify(body))}`
  return `${data}.${b64url(await hmac(data))}`
}

/** Verifica firma, tipo, issuer e scadenza. Lancia un errore leggibile se qualcosa non va. */
export async function verifyJwt<T extends object>(token: string, typ: string, issuer: string) {
  const parts = token.split(".")
  if (parts.length !== 3) throw new Error("formato JWT non valido")
  const [h, p, s] = parts as [string, string, string]
  let ok = false
  try {
    ok = await crypto.subtle.verify("HMAC", await hmacKey(), b64urlDecode(s), new TextEncoder().encode(`${h}.${p}`))
  } catch {
    ok = false
  }
  if (!ok) throw new Error("firma non valida")
  const header = JSON.parse(b64urlDecodeText(h)) as { typ?: string }
  if (header.typ !== typ) throw new Error(`token di tipo sbagliato (atteso ${typ})`)
  const payload = JSON.parse(b64urlDecodeText(p)) as T & JwtClaims
  if (payload.iss !== issuer) throw new Error("issuer non valido")
  if (payload.exp * 1000 < Date.now()) throw new Error("token scaduto")
  return payload
}
