import { SiteHeader } from "@/components/site-header"

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-svh">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/4 size-[600px] rounded-full bg-actor-auth/15 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 size-[500px] rounded-full bg-actor-app/12 blur-[120px]" />
        <div className="absolute bottom-0 left-0 size-[400px] rounded-full bg-actor-api/10 blur-[120px]" />
      </div>
      <SiteHeader />
      {children}
    </div>
  )
}
