import { withBase } from "./base-path"

let ready: Promise<void> | undefined

/**
 * Registra il Service Worker che ospita il server OAuth simulato e aspetta
 * che controlli la pagina (altrimenti le chiamate /api/* andrebbero in 404).
 */
export function ensureServiceWorker() {
  return (ready ??= (async () => {
    if (!("serviceWorker" in navigator)) throw new Error("Il tuo browser non supporta i Service Worker.")
    const sw = navigator.serviceWorker
    await sw.register(withBase("/sw.js"), { scope: withBase("/") })
    await sw.ready
    if (!sw.controller) {
      await new Promise<void>((resolve) => {
        sw.addEventListener("controllerchange", () => resolve(), { once: true })
        setTimeout(resolve, 2000)
      })
    }
    // dopo un "hard reload" la pagina non è controllata: ricarichiamo una volta
    if (!sw.controller && !sessionStorage.getItem("oauth-lab:sw-reload")) {
      sessionStorage.setItem("oauth-lab:sw-reload", "1")
      location.reload()
      await new Promise(() => {})
    }
    sessionStorage.removeItem("oauth-lab:sw-reload")
  })())
}
