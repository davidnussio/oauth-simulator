import { CallbackRelay } from "@/components/auth/callback-relay"

export const metadata = { title: "Ritorno all'app" }

/** redirect_uri del client: riceve code/token e li passa al simulatore. */
export default function CallbackPage() {
  return <CallbackRelay />
}
