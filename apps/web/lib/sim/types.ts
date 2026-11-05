import type { Scope } from "@/lib/oauth/scopes"

export type ActorId = "user" | "app" | "auth" | "api"

export type Actor = { name: string; role: string; emoji: string }

export type Arrow = {
  from: ActorId
  to: ActorId
  label: string
  kind?: "request" | "response" | "redirect"
}

export type StepKind =
  | "pkce"
  | "authorize-url"
  | "login"
  | "state-check"
  | "implicit-callback"
  | "token"
  | "id-token"
  | "api"
  | "userinfo"
  | "refresh"
  | "device-start"
  | "device-user"
  | "device-poll"
  | "cc-token"

export type Step = {
  id: string
  kind: StepKind
  /** Etichetta corta nello stepper */
  short: string
  title: string
  /** Spiegazione "for dummies" */
  simple: string
  analogy?: { emoji: string; text: string }
  /** Nota tecnica sotto "Sotto il cofano" */
  tech?: string
  warn?: string
  arrows: Arrow[]
}

export type Flow = {
  id: string
  name: string
  emoji: string
  tagline: string
  when: string
  level: "facile" | "medio" | "avanzato"
  deprecated?: boolean
  recommended?: boolean
  actors: ActorId[]
  actorOverrides?: Partial<Record<ActorId, Partial<Actor>>>
  scopes: Scope[]
  responseType?: "code" | "token"
  pkce?: boolean
  oidc?: boolean
  confidential?: boolean
  steps: Step[]
}

export type Credentials = {
  client_id: string
  client_secret: string
  redirect_uri: string
  username: string
  password: string
}

export type Exchange = {
  id: string
  stepId: string
  title: string
  request: { method: string; url: string; headers?: Record<string, string>; body?: string }
  response?: { status: number; statusText?: string; headers?: Record<string, string>; body: unknown }
  note?: string
}

export type TokenResponse = {
  access_token?: string
  token_type?: string
  expires_in?: number
  refresh_token?: string
  id_token?: string
  scope?: string
  error?: string
  error_description?: string
}

export type DeviceResponse = {
  device_code: string
  user_code: string
  verification_uri: string
  verification_uri_complete: string
  expires_in: number
  interval: number
}
