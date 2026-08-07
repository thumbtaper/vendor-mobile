import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

import {
  Snackbar,
  type SnackbarMessage,
} from "@/components/common/Snackbar/Snackbar"
import { TAB_BAR_HEIGHT } from "@/theme/tokens"

export interface ShowSnackbarInput {
  message: string
  actionLabel?: string
  onAction?: () => void
  tone?: "default" | "error"
  durationMs?: number
}

interface SnackbarApi {
  show: (input: ShowSnackbarInput) => number
  dismiss: (id: number) => void
}

const SnackbarContext = createContext<SnackbarApi | null>(null)

const DEFAULT_DURATION_MS = 4000

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [snack, setSnack] = useState<SnackbarMessage | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const nextId = useRef(1)

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null
  }, [])

  const dismiss = useCallback(
    (id: number) => {
      setSnack((current) => (current?.id === id ? null : current))
      clearTimer()
    },
    [clearTimer],
  )

  const show = useCallback(
    (input: ShowSnackbarInput) => {
      const id = nextId.current++
      clearTimer()
      setSnack({
        id,
        message: input.message,
        actionLabel: input.actionLabel,
        tone: input.tone,
        onAction: input.onAction
          ? () => {
              input.onAction?.()
              setSnack((current) => (current?.id === id ? null : current))
              clearTimer()
            }
          : undefined,
      })
      timerRef.current = setTimeout(
        () => setSnack((current) => (current?.id === id ? null : current)),
        input.durationMs ?? DEFAULT_DURATION_MS,
      )
      return id
    },
    [clearTimer],
  )

  useEffect(() => clearTimer, [clearTimer])

  const api = useMemo(() => ({ show, dismiss }), [show, dismiss])

  return (
    <SnackbarContext.Provider value={api}>
      {children}
      {snack ? (
        <Snackbar snack={snack} tabBarInset={TAB_BAR_HEIGHT} /> // was a bare 49
      ) : null}
    </SnackbarContext.Provider>
  )
}

export function useSnackbar(): SnackbarApi {
  const ctx = useContext(SnackbarContext)
  if (!ctx) throw new Error("useSnackbar must be used inside SnackbarProvider")
  return ctx
}
