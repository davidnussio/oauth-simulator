import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

const config = [
  ...nextVitals,
  ...nextTs,
  { ignores: [".next/**", "out/**", "public/sw.js", "next-env.d.ts"] },
]

export default config
