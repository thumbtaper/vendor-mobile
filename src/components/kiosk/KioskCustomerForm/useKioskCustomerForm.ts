import { useCallback, useMemo, useState } from "react"
import { LEGAL_LINKS } from "@/lib/constants"
import { allKioskDocumentsAgreed, normaliseKioskPhone, stripKioskPhone, validKioskCustomer, type KioskCustomer } from "@/lib/kioskCustomer"
import { requirementsFor } from "@/lib/kioskSteps"
import type { OfferingAttachment } from "@/lib/types"
import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./KioskCustomerForm.styles"

export function useKioskCustomerForm(documents: OfferingAttachment[], review: (url: string) => Promise<void>) {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])
  const [customer, setCustomer] = useState<KioskCustomer>({ fullName: "", email: "", phone: "" })
  const [step, setStep] = useState<"customer" | "agreements" | "ready">("customer")
  const [phoneTouched, setPhoneTouched] = useState(false)
  const [phoneRejected, setPhoneRejected] = useState(false)
  const [agreed, setAgreed] = useState<Set<string>>(new Set())
  const [linkError, setLinkError] = useState(false)
  const requirements = requirementsFor(documents)
  const valid = validKioskCustomer(customer)
  const allAgreed = allKioskDocumentsAgreed(documents, agreed)
  return {
    tokens, styles, customer, step, valid, allAgreed, linkError, requirements,
    name: useCallback((value: string) => setCustomer(c => ({ ...c, fullName: value })), []),
    email: useCallback((value: string) => setCustomer(c => ({ ...c, email: value })), []),
    phone: useCallback((value: string) => {
      const cleaned = stripKioskPhone(value)
      setPhoneRejected(value !== cleaned)
      setCustomer(c => ({ ...c, phone: cleaned }))
    }, []),
    phoneBlur: useCallback(() => setPhoneTouched(true), []),
    phoneError: phoneRejected ? "Numbers only, please." : phoneTouched && customer.phone.trim() && !normaliseKioskPhone(customer.phone)
      ? "Enter a Philippine mobile number, like 0917 123 4567." : null,
    next: useCallback(() => {
      if (step === "customer" && valid) setStep(requirements.needsAgreement ? "agreements" : "ready")
      if (step === "agreements" && allAgreed) setStep("ready")
    }, [step, valid, allAgreed, requirements.needsAgreement]),
    back: useCallback(() => setStep(step === "ready" && requirements.needsAgreement ? "agreements" : "customer"), [step, requirements.needsAgreement]),
    agreed,
    toggle: useCallback((key: string) => setAgreed(previous => {
      const next = new Set(previous)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    }), []),
    legal: LEGAL_LINKS.filter(link => link.key === "terms" || link.key === "privacy").map(link => ({
      ...link, onPress: async () => {
        setLinkError(false)
        try { await review(link.href) } catch { setLinkError(true) }
      },
    })),
  }
}
