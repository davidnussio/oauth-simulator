/// <reference lib="webworker" />
/**
 * Service Worker: ospita il server OAuth "LabID" direttamente nel browser,
 * così la demo funziona anche su hosting statico (GitHub Pages).
 */
import { handle, isServerRoute } from "@/lib/oauth/handlers"

declare const self: ServiceWorkerGlobalScope
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ""

self.addEventListener("install", () => void self.skipWaiting())
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()))

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url)
  if (url.origin !== self.location.origin || !isServerRoute(url, BASE_PATH)) return
  e.respondWith(handle(e.request, BASE_PATH))
})
