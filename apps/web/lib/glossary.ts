/** Glossario "for dummies": usato per i tooltip automatici e la sezione della home. */
export const GLOSSARY: { term: string; aliases?: string[]; emoji: string; def: string }[] = [
  { term: "OAuth", emoji: "🔐", def: "Un protocollo per dare a un'app un accesso limitato ai tuoi dati, senza darle la tua password." },
  { term: "access token", aliases: ["access_token"], emoji: "🔑", def: "La chiave temporanea che l'app mostra all'API. Dura poco e apre solo ciò che hai concesso." },
  { term: "refresh token", aliases: ["refresh_token"], emoji: "🔄", def: "Un buono per ottenere nuovi access token senza rifare il login. Va custodito con cura." },
  { term: "id_token", aliases: ["id token"], emoji: "🪪", def: "Un JWT di OpenID Connect che dice CHI sei. Serve per il login, non per chiamare le API." },
  { term: "scope", emoji: "🎚️", def: "Un permesso specifico (es. photo = leggere le foto). L'app li chiede, tu li concedi." },
  { term: "client_id", emoji: "🏷️", def: "Il nome pubblico dell'app presso il server di autorizzazione." },
  { term: "client_secret", emoji: "🤫", def: "La password dell'app. Solo le app con un server possono tenerla davvero segreta." },
  { term: "redirect_uri", emoji: "↩️", def: "L'indirizzo dove il server rimanda il browser dopo il consenso. Deve essere registrato in anticipo." },
  { term: "state", emoji: "🧾", def: "Un valore casuale che l'app manda e poi ricontrolla al ritorno, per difendersi dagli attacchi CSRF." },
  { term: "PKCE", emoji: "🛡️", def: "Proof Key for Code Exchange: un segreto usa-e-getta che impedisce a chi ruba il code di usarlo." },
  { term: "code_verifier", emoji: "🎟️", def: "Il segreto casuale di PKCE. Resta nell'app fino allo scambio del code." },
  { term: "code_challenge", emoji: "🧬", def: "L'impronta SHA-256 del code_verifier, inviata all'inizio del flusso." },
  { term: "nonce", emoji: "🎲", def: "Un numero usato una volta: lega l'id_token alla tua specifica richiesta di login." },
  { term: "JWT", emoji: "📜", def: "JSON Web Token: tre pezzi base64 separati da punti (header.payload.firma). Leggibile da tutti, ma non falsificabile." },
  { term: "Bearer", emoji: "🎫", def: "\"Al portatore\": chi possiede il token può usarlo. Per questo va protetto come denaro contante." },
  { term: "authorization code", aliases: ["code"], emoji: "📨", def: "Un codice monouso e di breve durata che l'app scambia con i token." },
  { term: "Authorization Server", emoji: "🏛️", def: "Chi verifica la tua identità e rilascia i token (qui: LabID; nel mondo reale Google, Entra ID, Keycloak…)." },
  { term: "Resource Server", emoji: "🗄️", def: "L'API che custodisce i dati e accetta solo token validi." },
]

const entries = GLOSSARY.flatMap((g) => [g.term, ...(g.aliases ?? [])].map((k) => [k.toLowerCase(), g] as const))
export const GLOSSARY_INDEX = new Map(entries)

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
// solo termini "tecnici" per l'auto-link (evita di linkare "code" ovunque)
const AUTOLINK = entries
  .map(([k]) => k)
  .filter((k) => !["code", "oauth", "state", "scope"].includes(k))
  .sort((a, b) => b.length - a.length)
export const GLOSSARY_RE = new RegExp(`(${AUTOLINK.map(escape).join("|")})`, "gi")
