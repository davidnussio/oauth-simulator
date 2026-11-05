/** Utility crittografiche lato browser (WebCrypto), come farebbe una vera app. */

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~"

export function randomString(len = 64) {
  const bytes = crypto.getRandomValues(new Uint8Array(len))
  return Array.from(bytes, (b) => CHARSET[b % CHARSET.length]).join("")
}

export function base64url(bytes: ArrayBuffer | Uint8Array) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let s = ""
  for (const b of arr) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

export async function sha256base64url(input: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input))
  return base64url(digest)
}

export function decodeJwt(token: string) {
  const [h, p, s] = token.split(".")
  const dec = (part?: string) => {
    if (!part) return null
    try {
      const b64 = part.replace(/-/g, "+").replace(/_/g, "/")
      const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4))
      return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))))
    } catch {
      return null
    }
  }
  return { header: dec(h), payload: dec(p), parts: [h ?? "", p ?? "", s ?? ""] as const }
}
