// Compila il Service Worker (server OAuth simulato) in public/sw.js
import { build, context } from "esbuild"

const options = {
  entryPoints: ["sw/sw.ts"],
  bundle: true,
  format: "iife",
  target: "es2022",
  outfile: "public/sw.js",
  tsconfig: "tsconfig.json",
  define: {
    "process.env.NEXT_PUBLIC_BASE_PATH": JSON.stringify(process.env.NEXT_PUBLIC_BASE_PATH ?? ""),
  },
  logLevel: "info",
}

if (process.argv.includes("--watch")) {
  const ctx = await context(options)
  await ctx.watch()
} else {
  await build(options)
}
