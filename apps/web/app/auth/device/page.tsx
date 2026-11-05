"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"

import { DeviceForm } from "@/components/auth/device-form"

function Device() {
  return <DeviceForm initialCode={useSearchParams().get("user_code") ?? ""} />
}

export default function DevicePage() {
  return (
    <Suspense>
      <Device />
    </Suspense>
  )
}
