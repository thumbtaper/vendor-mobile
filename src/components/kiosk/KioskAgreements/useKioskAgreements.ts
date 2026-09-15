import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { OfferingAttachment } from "@/lib/types"
import { signKioskDocument } from "@/services/kioskDocuments.service"
import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./KioskAgreements.styles"

export function useKioskAgreements(vendorId: string, offeringId: string, documents: OfferingAttachment[],
  agreed: Set<string>, toggle: (id: string) => void, review: (url: string) => Promise<void>) {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])
  const [links, setLinks] = useState<Map<string, { url: string; expiresAt: number }>>(new Map())
  const [failed, setFailed] = useState<Set<string>>(new Set())
  const [attempt, setAttempt] = useState(0)
  const [opening, setOpening] = useState(false)
  const busy = useRef(false)
  const mounted = useRef(true)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  const retry = useCallback(() => { setFailed(new Set()); setAttempt(value => value + 1) }, [])
  useEffect(() => {
    let cancelled = false
    let running = false
    const sign = async () => {
      if (running) return
      running = true
      const results = await Promise.all(documents.filter(d => d.storagePath).map(async document => ({
        id: document.id,
        link: await signKioskDocument(vendorId, offeringId, document).catch(() => null),
      })))
      running = false
      if (cancelled) return
      setLinks(previous => {
        const next = new Map(previous)
        for (const result of results) if (result.link) next.set(result.id, result.link)
        return next
      })
      setFailed(new Set(results.filter(r => !r.link).map(r => r.id)))
    }
    void sign()
    const timer = setInterval(() => { void sign() }, 240_000)
    return () => { cancelled = true; clearInterval(timer) }
  }, [vendorId, offeringId, documents, attempt])
  return { tokens, styles, opening, retry,
    documents: documents.map(document => ({
      ...document,
      checked: agreed.has(`${document.id}:${document.version}`),
      toggle: () => toggle(`${document.id}:${document.version}`),
      linkReady: Boolean(links.get(document.id)),
      failed: failed.has(document.id),
      open: async () => {
        if (busy.current) return
        busy.current = true; setOpening(true)
        try {
          const previous = links.get(document.id)
          const link = previous && previous.expiresAt > Date.now() + 5000 ? previous
            : await signKioskDocument(vendorId, offeringId, document)
          if (!mounted.current) return
          await review(link.url)
        } catch {
          if (mounted.current) setFailed(previous => new Set(previous).add(document.id))
        } finally {
          busy.current = false
          if (mounted.current) setOpening(false)
        }
      },
    })),
  }
}
