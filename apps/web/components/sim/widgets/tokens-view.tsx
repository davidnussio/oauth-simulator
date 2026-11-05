"use client"

import { motion } from "motion/react"
import { Clock } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import type { TokenResponse } from "@/lib/sim/types"
import { JwtView } from "../jwt-view"

export function TokensView({ tokens }: { tokens: TokenResponse }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.12 } } }}
      className="space-y-3"
    >
      <motion.div variants={item} className="flex flex-wrap gap-2">
        <Badge>
          <Clock /> scade tra {Math.round((tokens.expires_in ?? 0) / 60)} min
        </Badge>
        <Badge variant="outline">token_type: {tokens.token_type}</Badge>
        {tokens.scope !== undefined && (
          <Badge variant="outline">scope: {tokens.scope || "(nessuno)"}</Badge>
        )}
      </motion.div>
      {tokens.access_token && (
        <motion.div variants={item}>
          <JwtView title="🔑 access_token" token={tokens.access_token} />
        </motion.div>
      )}
      {tokens.id_token && (
        <motion.div variants={item}>
          <JwtView title="🪪 id_token" token={tokens.id_token} />
        </motion.div>
      )}
      {tokens.refresh_token && (
        <motion.div variants={item}>
          <JwtView title="🔄 refresh_token" token={tokens.refresh_token} />
        </motion.div>
      )}
    </motion.div>
  )
}

const item = {
  hidden: { opacity: 0, y: 14, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1 },
}
