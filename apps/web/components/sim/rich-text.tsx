"use client"

import { Fragment } from "react"

import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip"
import { GLOSSARY_INDEX, GLOSSARY_RE } from "@/lib/glossary"

/** Testo con i termini del glossario sottolineati e spiegati al passaggio del mouse. */
export function RichText({ text }: { text: string }) {
  const parts = text.split(GLOSSARY_RE)
  return (
    <>
      {parts.map((part, i) => {
        const g = i % 2 === 1 ? GLOSSARY_INDEX.get(part.toLowerCase()) : undefined
        if (!g) return <Fragment key={i}>{part}</Fragment>
        return (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <span
                tabIndex={0}
                className="cursor-help rounded-sm underline decoration-primary/50 decoration-dotted underline-offset-4 hover:bg-primary/10"
              >
                {part}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <span className="mb-1 block font-semibold">
                {g.emoji} {g.term}
              </span>
              {g.def}
            </TooltipContent>
          </Tooltip>
        )
      })}
    </>
  )
}
