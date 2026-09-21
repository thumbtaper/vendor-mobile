import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Alert, type GestureResponderEvent, type LayoutChangeEvent } from "react-native"
import type Svg from "react-native-svg"
import { MAX_SIGNATURE_POINTS, normaliseSignaturePng, signaturePath, signaturePoint, SIGNATURE_WIDTH, SIGNATURE_HEIGHT, type SignaturePoint } from "@/lib/kioskSignature"
import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./KioskSignature.styles"

export function useKioskSignature(onConfirm: (png: string) => void) {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])
  const [svg, setSvg] = useState<Svg | null>(null)
  const size = useRef({ width: 0, height: 0 })
  const strokes = useRef<SignaturePoint[][]>([])
  const pointCount = useRef(0)
  const generation = useRef(0)
  const busy = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [paths, setPaths] = useState<string[]>([])
  const [drawing, setDrawing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => () => {
    generation.current++
    if (timer.current) clearTimeout(timer.current)
    strokes.current = []
  }, [])

  const clear = useCallback(() => {
    generation.current++
    if (timer.current) clearTimeout(timer.current)
    busy.current = false
    strokes.current = []
    pointCount.current = 0
    setPaths([])
    setDrawing(false)
    setSaving(false)
    setError(null)
  }, [])

  const append = useCallback((event: GestureResponderEvent, start: boolean) => {
    if (busy.current) return
    const p = signaturePoint(event.nativeEvent.locationX, event.nativeEvent.locationY, size.current.width, size.current.height)
    if (!p) return
    if (pointCount.current >= MAX_SIGNATURE_POINTS) {
      setError("The signature is too detailed. Clear it and sign again.")
      return
    }
    if (start) strokes.current.push([])
    const stroke = strokes.current.at(-1)
    if (!stroke) return
    const last = stroke.at(-1)
    if (last?.x === p.x && last?.y === p.y) return
    stroke.push(p)
    pointCount.current++
    setPaths(strokes.current.map(signaturePath))
  }, [])

  const handlers = useMemo(() => ({
    onStartShouldSetResponder: () => !saving,
    onStartShouldSetResponderCapture: () => !saving,
    onResponderGrant: (event: GestureResponderEvent) => { setDrawing(true); append(event, true) },
    onResponderMove: (event: GestureResponderEvent) => append(event, false),
    onResponderRelease: () => setDrawing(false),
    onResponderTerminate: clear,
    onResponderTerminationRequest: () => false,
  }), [append, clear, saving])

  const save = useCallback(() => {
    if (busy.current || drawing || error || !pointCount.current || !svg) return
    busy.current = true
    setSaving(true)
    const request = ++generation.current
    const fail = () => {
      if (request !== generation.current) return
      generation.current++
      busy.current = false
      setSaving(false)
      setError("The signature could not be captured. Clear it and try again.")
    }
    timer.current = setTimeout(fail, 5000)
    try {
      svg.toDataURL(value => {
        if (request !== generation.current) return
        if (timer.current) clearTimeout(timer.current)
        const png = normaliseSignaturePng(value)
        if (!png) { fail(); return }
        generation.current++
        busy.current = false
        setSaving(false)
        onConfirm(png)
      }, { width: SIGNATURE_WIDTH, height: SIGNATURE_HEIGHT })
    } catch { if (timer.current) clearTimeout(timer.current); fail() }
  }, [drawing, error, onConfirm, svg])

  return {
    styles, tokens, paths, saving, error, clear, save,
    disabled: paths.length === 0 || drawing || !!error,
    handlers,
    setSvg,
    layout: useCallback((event: LayoutChangeEvent) => { size.current = event.nativeEvent.layout }, []),
    help: useCallback(() => Alert.alert("Signature assistance", "Please ask a staff member for an assisted booking. A signature is still required; no booking or payment has been made."), []),
  }
}
