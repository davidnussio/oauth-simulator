import type { Actor, ActorId, Flow, Step } from "./types"

export const ACTORS: Record<ActorId, Actor> = {
  user: { name: "Tu", role: "Utente · Resource Owner", emoji: "🧑" },
  app: { name: "App Foto", role: "Client", emoji: "📱" },
  auth: { name: "LabID", role: "Authorization Server", emoji: "🏛️" },
  api: { name: "API Foto", role: "Resource Server", emoji: "🗄️" },
}

/* ------------------------------------------------------------------ */
/* Step riutilizzabili                                                 */
/* ------------------------------------------------------------------ */

const pkceStep: Step = {
  id: "pkce",
  kind: "pkce",
  short: "Segreto PKCE",
  title: "L'app inventa un segreto usa-e-getta",
  simple:
    "Prima di partire, l'app genera una parola segreta casuale (code_verifier) e ne calcola l'impronta (code_challenge). Manderà solo l'impronta adesso, e il segreto vero alla fine: così solo lei potrà ritirare il token.",
  analogy: {
    emoji: "🎟️",
    text: "Come strappare un biglietto della lotteria a metà: consegni una metà ora, l'altra metà alla fine. Solo chi ha entrambe le metà vince.",
  },
  tech: "code_verifier = 43-128 caratteri casuali; code_challenge = BASE64URL(SHA256(code_verifier)), metodo S256 (RFC 7636).",
  arrows: [{ from: "app", to: "app", label: "genera verifier + challenge" }],
}

const authorizeStep = (opts: { pkce?: boolean; oidc?: boolean; implicit?: boolean }): Step => ({
  id: "authorize",
  kind: "authorize-url",
  short: "Richiesta permesso",
  title: "L'app ti manda dal server di autorizzazione",
  simple: opts.implicit
    ? "L'app prepara un link verso LabID chiedendo direttamente un token (response_type=token). Il tuo browser viene mandato lì."
    : "L'app prepara un link speciale verso LabID con scritto: chi è (client_id), cosa vuole (scope) e dove tornare (redirect_uri). Il tuo browser viene mandato lì.",
  analogy: {
    emoji: "🏨",
    text: "L'app non ti chiede la password: ti accompagna alla reception dell'hotel (LabID) con un foglio che dice quale stanza vorrebbe aprire.",
  },
  tech: [
    "GET /auth/authorize con response_type, client_id, redirect_uri, scope, state",
    opts.pkce ? "+ code_challenge e code_challenge_method=S256" : "",
    opts.oidc ? "+ nonce (contro i replay dell'id_token)" : "",
    ". Lo state è un valore casuale salvato dall'app: lo ricontrollerà al ritorno (anti-CSRF).",
  ].join(" "),
  arrows: [
    { from: "app", to: "user", label: "302 → LabID", kind: "redirect" },
    { from: "user", to: "auth", label: "GET /authorize", kind: "request" },
  ],
})

const loginStep = (implicit = false): Step => ({
  id: "login",
  kind: "login",
  short: "Login e consenso",
  title: "Accedi su LabID e decidi cosa concedere",
  simple:
    "Ora sei sul sito di LabID (guarda la barra degli indirizzi!). Inserisci username e password e scegli quali permessi dare all'app. Puoi anche rifiutare.",
  analogy: {
    emoji: "🪪",
    text: "Mostri il documento alla reception (non all'app!) e decidi a quali stanze può accedere la chiave che ti daranno.",
  },
  tech: implicit
    ? "Dopo il consenso LabID risponde 303 verso redirect_uri#access_token=… (il token viaggia nel fragment dell'URL)."
    : "Dopo il consenso LabID risponde 303 verso redirect_uri?code=…&state=… Il code è monouso e scade in 10 minuti.",
  arrows: [
    { from: "user", to: "auth", label: "username + password", kind: "request" },
    { from: "auth", to: "user", label: implicit ? "303 #access_token" : "303 ?code=…", kind: "redirect" },
    { from: "user", to: "app", label: implicit ? "token nel fragment" : "code + state", kind: "redirect" },
  ],
})

const stateStep: Step = {
  id: "state",
  kind: "state-check",
  short: "Controllo state",
  title: "L'app controlla che la risposta sia davvero sua",
  simple:
    "Sei tornato all'app con un codice. Prima di usarlo, l'app confronta lo state ricevuto con quello che aveva salvato. Se sono diversi, qualcuno sta barando!",
  analogy: {
    emoji: "🧾",
    text: "Come lo scontrino del guardaroba: il numero sul tuo biglietto deve corrispondere a quello appeso al cappotto.",
  },
  tech: "Se lo state non corrisponde, l'app deve scartare il code: potrebbe essere un attacco CSRF in cui qualcuno ti fa accedere con il suo account.",
  arrows: [{ from: "app", to: "app", label: "state === salvato?" }],
}

const tokenStep = (opts: { pkce?: boolean; confidential?: boolean }): Step => ({
  id: "token",
  kind: "token",
  short: "Codice → token",
  title: "L'app scambia il codice con un token",
  simple: opts.pkce
    ? "L'app chiama LabID direttamente (senza passare dal browser) e consegna il codice insieme al segreto PKCE. LabID ricalcola l'impronta: se combacia, consegna l'access token."
    : "Il server dell'app chiama LabID direttamente (senza passare dal browser) e consegna il codice insieme alla propria password (client_secret). In cambio riceve l'access token.",
  analogy: {
    emoji: "🔑",
    text: "Torni alla reception con lo scontrino: te lo scambiano con la chiave magnetica vera, che apre solo le stanze concesse.",
  },
  tech: opts.pkce
    ? "POST /api/oauth/token grant_type=authorization_code + code + redirect_uri + client_id + code_verifier. Nessun client_secret: le app mobile/SPA non possono custodirlo."
    : "POST /api/oauth/token grant_type=authorization_code + code + redirect_uri + client_id + client_secret. Avviene server-to-server: il token non passa mai dal browser.",
  arrows: [
    { from: "app", to: "auth", label: "POST /token (code)", kind: "request" },
    { from: "auth", to: "app", label: "access_token", kind: "response" },
  ],
})

const apiStep = (scope = "photo"): Step => ({
  id: "api",
  kind: "api",
  short: "Usa il token",
  title: "L'app usa il token per leggere i tuoi dati",
  simple:
    "Finalmente! L'app chiama l'API e mostra il token nell'header Authorization. L'API controlla che sia valido e che contenga il permesso giusto, poi risponde.",
  analogy: {
    emoji: "🚪",
    text: "Avvicini la chiave magnetica alla porta: si apre solo se la chiave è valida e abilitata per quella stanza.",
  },
  tech: `GET con header "Authorization: Bearer <access_token>". Se manca lo scope "${scope}" l'API risponde 403 insufficient_scope; se il token è falso o scaduto 401 invalid_token.`,
  arrows: [
    { from: "app", to: "api", label: "Bearer token", kind: "request" },
    { from: "api", to: "app", label: "i tuoi dati", kind: "response" },
  ],
})

const refreshStep: Step = {
  id: "refresh",
  kind: "refresh",
  short: "Rinnovo token",
  title: "Il token scade? Si rinnova senza disturbarti",
  simple:
    "Gli access token durano poco (qui 1 ora). Se hai concesso offline_access, l'app ha anche un refresh token: lo usa per ottenere un token nuovo senza farti rifare il login.",
  analogy: {
    emoji: "🔄",
    text: "Come rinnovare la tessera della palestra al bancone, senza rifare l'iscrizione da capo.",
  },
  tech: "POST /api/oauth/token grant_type=refresh_token. Il server ruota il refresh token: quello vecchio diventa inutilizzabile (prova a riusarlo!).",
  arrows: [
    { from: "app", to: "auth", label: "POST /token (refresh)", kind: "request" },
    { from: "auth", to: "app", label: "nuovi token", kind: "response" },
  ],
}

/* ------------------------------------------------------------------ */
/* Flussi                                                              */
/* ------------------------------------------------------------------ */

export const FLOWS: Flow[] = [
  {
    id: "pkce",
    name: "Authorization Code + PKCE",
    emoji: "🛡️",
    tagline: "Il flusso consigliato per quasi tutte le app.",
    when: "App mobile, single-page app, app desktop… e ormai anche app web classiche.",
    level: "medio",
    recommended: true,
    actors: ["user", "app", "auth", "api"],
    scopes: ["photo", "offline_access"],
    responseType: "code",
    pkce: true,
    steps: [pkceStep, authorizeStep({ pkce: true }), loginStep(), stateStep, tokenStep({ pkce: true }), apiStep(), refreshStep],
  },
  {
    id: "authorization-code",
    name: "Authorization Code",
    emoji: "🏦",
    tagline: "Il classico: l'app ha un server che custodisce un segreto.",
    when: "App web con un backend (PHP, Java, Node…) che può tenere nascosto il client_secret.",
    level: "facile",
    actors: ["user", "app", "auth", "api"],
    actorOverrides: { app: { name: "Sito Foto", role: "Client confidenziale", emoji: "💻" } },
    scopes: ["photo", "offline_access"],
    responseType: "code",
    confidential: true,
    steps: [authorizeStep({}), loginStep(), stateStep, tokenStep({ confidential: true }), apiStep(), refreshStep],
  },
  {
    id: "oidc",
    name: "OpenID Connect",
    emoji: "🪪",
    tagline: "OAuth + “chi sei?”: il login con Google/Apple/Microsoft.",
    when: "Quando l'app vuole sapere chi sei (login), non solo accedere ai tuoi dati.",
    level: "avanzato",
    actors: ["user", "app", "auth", "api"],
    actorOverrides: { api: { name: "UserInfo", role: "Endpoint OIDC", emoji: "👤" } },
    scopes: ["openid", "profile", "email"],
    responseType: "code",
    pkce: true,
    oidc: true,
    steps: [
      pkceStep,
      authorizeStep({ pkce: true, oidc: true }),
      loginStep(),
      stateStep,
      tokenStep({ pkce: true }),
      {
        id: "id-token",
        kind: "id-token",
        short: "Leggi l'id_token",
        title: "L'id_token: la carta d'identità digitale",
        simple:
          "Oltre all'access token è arrivato un id_token: un JWT firmato che dice chi sei. L'app controlla firma, destinatario (aud), scadenza e che il nonce sia quello che aveva inventato lei.",
        analogy: {
          emoji: "🪪",
          text: "L'access token è la chiave della stanza; l'id_token è il documento d'identità timbrato dalla reception.",
        },
        tech: "Verifiche obbligatorie: iss = LabID, aud = il tuo client_id, exp nel futuro, nonce = quello inviato in /authorize.",
        arrows: [{ from: "app", to: "app", label: "verifica id_token" }],
      },
      {
        id: "userinfo",
        kind: "userinfo",
        short: "UserInfo",
        title: "Chiedi più dettagli all'endpoint UserInfo",
        simple: "Con l'access token l'app può chiedere a LabID il profilo completo: nome, email, foto…",
        analogy: { emoji: "📇", text: "Mostri la chiave alla reception e ti danno il biglietto da visita completo dell'ospite." },
        tech: "GET /api/oauth/userinfo con Authorization: Bearer. I campi restituiti dipendono dagli scope concessi.",
        arrows: [
          { from: "app", to: "api", label: "GET /userinfo", kind: "request" },
          { from: "api", to: "app", label: "profilo", kind: "response" },
        ],
      },
    ],
  },
  {
    id: "device",
    name: "Device Code",
    emoji: "📺",
    tagline: "Per la Smart TV: accedi dal telefono con un codice.",
    when: "Dispositivi senza tastiera comoda: TV, console, stampanti, CLI.",
    level: "medio",
    actors: ["user", "app", "auth", "api"],
    actorOverrides: { app: { name: "Smart TV", role: "Client (device)", emoji: "📺" }, user: { name: "Tu + telefono", emoji: "📱" } },
    scopes: ["photo", "offline_access"],
    steps: [
      {
        id: "device-start",
        kind: "device-start",
        short: "La TV chiede un codice",
        title: "La TV chiede a LabID un codice da mostrarti",
        simple:
          "Scrivere una password col telecomando è un incubo. Allora la TV chiede a LabID un codice breve (es. BCDF-GHJK) e un indirizzo da aprire sul telefono.",
        analogy: { emoji: "🎫", text: "Come il numerino della fila al bancone: lo mostri e ti riconoscono." },
        tech: "POST /api/oauth/device con client_id e scope → device_code (segreto, resta alla TV), user_code (per te), verification_uri, interval.",
        arrows: [
          { from: "app", to: "auth", label: "POST /device", kind: "request" },
          { from: "auth", to: "app", label: "user_code", kind: "response" },
        ],
      },
      {
        id: "device-user",
        kind: "device-user",
        short: "Approva dal telefono",
        title: "Dal telefono inserisci il codice e approvi",
        simple:
          "Apri l'indirizzo sul telefono, scrivi il codice che vedi sulla TV, accedi e approva. Nel frattempo la TV aspetta e chiede periodicamente a LabID: “ha già detto sì?”",
        analogy: { emoji: "📲", text: "Come confermare un pagamento sul telefono mentre il POS aspetta." },
        tech: "In parallelo la TV fa polling su /token ogni `interval` secondi e riceve authorization_pending finché non approvi.",
        arrows: [
          { from: "user", to: "auth", label: "codice + login", kind: "request" },
          { from: "app", to: "auth", label: "polling…", kind: "request" },
        ],
      },
      {
        id: "device-poll",
        kind: "device-poll",
        short: "La TV riceve il token",
        title: "La TV riceve finalmente il token",
        simple: "Appena approvi, il prossimo controllo della TV riceve l'access token. Fatto: nessuna password digitata sulla TV!",
        tech: "POST /api/oauth/token grant_type=urn:ietf:params:oauth:grant-type:device_code + device_code. Errori possibili: authorization_pending, slow_down, access_denied, expired_token.",
        arrows: [
          { from: "app", to: "auth", label: "POST /token (device_code)", kind: "request" },
          { from: "auth", to: "app", label: "access_token", kind: "response" },
        ],
      },
      apiStep(),
    ],
  },
  {
    id: "client-credentials",
    name: "Client Credentials",
    emoji: "🤖",
    tagline: "Macchina parla con macchina, nessun utente.",
    when: "Script, cron job, microservizi che chiamano altre API a nome proprio.",
    level: "facile",
    actors: ["app", "auth", "api"],
    actorOverrides: {
      app: { name: "Servizio", role: "Client backend", emoji: "⚙️" },
      api: { name: "API Report", role: "Resource Server", emoji: "📊" },
    },
    scopes: ["reports:read"],
    confidential: true,
    steps: [
      {
        id: "cc-token",
        kind: "cc-token",
        short: "Chiedi il token",
        title: "Il servizio chiede un token con le sue credenziali",
        simple:
          "Non c'è nessuna persona da coinvolgere: il servizio si presenta a LabID con il suo nome utente (client_id) e la sua password (client_secret) e riceve un token.",
        analogy: { emoji: "🏢", text: "Come il badge aziendale di un fornitore: entra a nome della sua ditta, non di una persona." },
        tech: "POST /api/oauth/token grant_type=client_credentials + scope. Niente refresh token: quando scade, se ne chiede un altro.",
        arrows: [
          { from: "app", to: "auth", label: "POST /token (secret)", kind: "request" },
          { from: "auth", to: "app", label: "access_token", kind: "response" },
        ],
      },
      { ...apiStep("reports:read"), title: "Il servizio chiama l'API dei report" },
    ],
  },
  {
    id: "implicit",
    name: "Implicit (deprecato)",
    emoji: "⚠️",
    tagline: "Il vecchio modo delle SPA. Scopri perché non si usa più.",
    when: "Mai, nelle app nuove. Utile da conoscere per capire i sistemi legacy.",
    level: "facile",
    deprecated: true,
    actors: ["user", "app", "auth", "api"],
    scopes: ["photo"],
    responseType: "token",
    steps: [
      authorizeStep({ implicit: true }),
      loginStep(true),
      {
        id: "implicit-callback",
        kind: "implicit-callback",
        short: "Token nell'URL",
        title: "Il token arriva… dentro l'indirizzo del browser 😬",
        simple:
          "Niente codice da scambiare: LabID mette l'access token direttamente nell'URL. Comodo, ma l'URL finisce nella cronologia, può essere letto da estensioni e script, e non c'è modo di sapere se il token era davvero per te.",
        warn: "Per questo OAuth 2.1 ha eliminato il flusso Implicit: usa Authorization Code + PKCE.",
        tech: "redirect_uri#access_token=…&token_type=Bearer&expires_in=3600&state=…  Nessun refresh token, nessuna autenticazione del client.",
        arrows: [{ from: "app", to: "app", label: "legge #access_token" }],
      },
      apiStep(),
    ],
  },
]

export function getFlow(id: string) {
  return FLOWS.find((f) => f.id === id)
}

export function actorsFor(flow: Flow): Record<ActorId, Actor> {
  const out = { ...ACTORS }
  for (const [k, v] of Object.entries(flow.actorOverrides ?? {})) {
    out[k as ActorId] = { ...out[k as ActorId], ...v }
  }
  return out
}
