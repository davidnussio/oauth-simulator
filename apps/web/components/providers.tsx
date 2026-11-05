"use client"

import * as React from "react"
import { MotionConfig } from "motion/react"

import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { CredentialsProvider } from "./credentials"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
          <MotionConfig reducedMotion="user">
        <TooltipProvider>
          <CredentialsProvider>{children}</CredentialsProvider>
        </TooltipProvider>
      </MotionConfig>
  )
}
