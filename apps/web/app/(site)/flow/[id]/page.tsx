import { notFound } from "next/navigation"

import { Simulator } from "@/components/sim/simulator"
import { FLOWS, getFlow } from "@/lib/sim/flows"

export function generateStaticParams() {
  return FLOWS.map((f) => ({ id: f.id }))
}

export async function generateMetadata({ params }: PageProps<"/flow/[id]">) {
  const flow = getFlow((await params).id)
  return { title: flow?.name, description: flow?.tagline }
}

export default async function FlowPage({ params }: PageProps<"/flow/[id]">) {
  const { id } = await params
  if (!getFlow(id)) notFound()
  return <Simulator flowId={id} />
}
