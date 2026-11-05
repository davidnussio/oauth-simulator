# OAuth Lab 🔑

Un simulatore **interattivo e animato** per capire OAuth 2.0 e OpenID Connect "for dummies".
Ogni flusso gira contro un **vero server di autorizzazione** (LabID) che vive in un **Service Worker**: le richieste
HTTP, i redirect, i JWT firmati e gli errori sono reali (li vedi in DevTools → Network), ma tutto funziona su
hosting statico.

👉 **Demo:** https://davidnussio.github.io/oauth-simulator/

Ispirato all'[OAuth 2.0 Playground](https://www.oauth.com/playground/).

## Flussi

| Flusso | Per chi | Cosa puoi "rompere" |
| --- | --- | --- |
| 🛡️ Authorization Code + PKCE | app mobile, SPA, web (consigliato) | redirect_uri malevolo, CSRF sullo `state`, `code_verifier` sbagliato, riuso del codice |
| 🏦 Authorization Code | app web con backend | `client_secret` sbagliato, riuso del codice |
| 🪪 OpenID Connect | login ("Accedi con…") | verifica `iss`/`aud`/`exp`/`nonce` dell'id_token |
| 📺 Device Code | TV, console, CLI | polling, `authorization_pending`, rifiuto |
| 🤖 Client Credentials | servizi macchina-macchina | scope non consentiti |
| ⚠️ Implicit (deprecato) | sistemi legacy | perché il token nell'URL è pericoloso |

Più: refresh token con rotazione, token falsificati (firma non valida), scope insufficienti.

## Stack

- **Next.js 16** (App Router, Turbopack, `output: "export"` statico) + **React 19.3**
- **Service Worker** (compilato con esbuild) che ospita il server OAuth, solo **WebCrypto** (HMAC-SHA256, SHA-256)
- **Tailwind CSS 4** (configurazione CSS-first, tema in `packages/ui/src/styles/globals.css`)
- **Motion** (`motion/react`) per tutte le animazioni, con rispetto di `prefers-reduced-motion`
- **Radix UI** (tooltip, popover) + componenti in stile shadcn in `packages/ui`
- Monorepo **pnpm 10 + Turborepo**, TypeScript 5.9 strict, ESLint 9 (flat config `eslint-config-next`)

## Avvio

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

Altri comandi: `pnpm build`, `pnpm lint`, `pnpm typecheck`.

`NEXT_PUBLIC_BASE_PATH` imposta il percorso di pubblicazione (es. `/oauth-simulator` per GitHub Pages).
Il deploy su GitHub Pages avviene automaticamente a ogni push su `main` (`.github/workflows/deploy.yml`).

## Come è fatto

```
apps/web
├─ app/
│  ├─ (site)/                 landing + /flow/[id] (simulatore)
│  ├─ auth/authorize|device   pagine "ospitate" dal server LabID (login, consenso, codice TV)
│  └─ callback/               redirect_uri del client: passa code/token al simulatore via postMessage
├─ sw/sw.ts                   Service Worker: intercetta /api/* e /.well-known/* → server LabID
├─ lib/oauth/handlers.ts      endpoint: register, authorize, token, device, userinfo, resource, discovery
├─ lib/oauth/                 crypto, JWT HS256, store in memoria (solo WebCrypto, isomorfo)
├─ lib/sim/                   definizione dei flussi e dei passi (testi "for dummies")
└─ components/sim/            palco animato, stepper, widget interattivi per ogni passo
```

- Alla prima visita viene registrato un **client + un utente di prova** (come nel playground); li trovi in
  "Il tuo laboratorio" e in un post-it accanto al login, con il pulsante **Compila per me**.
- Il login avviene in un **vero iframe** verso `/auth/authorize`: il form fa POST a `/api/oauth/authorize`, il
  Service Worker risponde `303` verso `/callback`, che avvisa il simulatore.
- Client e password sono derivati via HMAC dal segreto del server (nessun DB); in memoria restano solo
  codici già usati, refresh token ruotati e richieste Device Flow (nel Service Worker).

> ⚠️ È uno strumento didattico: il server LabID non va usato in produzione.
