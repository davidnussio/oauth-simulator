import type { NextConfig } from "next"

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined

/**
 * Export completamente statico (GitHub Pages): il server OAuth gira in un
 * Service Worker (vedi sw/sw.ts), quindi non servono route handler.
 */
const nextConfig: NextConfig = {
  output: "export",
  basePath,
  images: { unoptimized: true },
  transpilePackages: ["@workspace/ui"],
  reactStrictMode: true,
}

export default nextConfig
