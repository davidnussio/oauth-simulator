import { Chooser } from "@/components/landing/chooser"
import { FlowGrid } from "@/components/landing/flow-grid"
import { Glossary } from "@/components/landing/glossary"
import { Hero } from "@/components/landing/hero"
import { Problem } from "@/components/landing/problem"

export default function Home() {
  return (
    <main>
      <Hero />
      <Problem />
      <FlowGrid />
      <Chooser />
      <Glossary />
      <footer className="border-t py-10 text-center text-sm text-muted-foreground">
        OAuth Lab · simulatore didattico. Il server LabID parla OAuth 2.0 vero (RFC 6749, 7636, 8628) e OpenID Connect,
        e gira in un Service Worker nel tuo browser: apri DevTools → Network per vedere ogni richiesta.{" "}
        <br className="hidden sm:block" />
        Ispirato all&apos;
        <a className="underline hover:text-foreground" href="https://www.oauth.com/playground/" target="_blank" rel="noreferrer">
          OAuth 2.0 Playground
        </a>
        .
      </footer>
    </main>
  )
}
