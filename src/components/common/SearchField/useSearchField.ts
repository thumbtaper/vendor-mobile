import { useEffect, useState } from "react"

// Debounces the raw input so filtering a long loaded list doesn't run on every
// keystroke. 200ms is short enough to feel immediate and long enough to skip
// most intermediate renders.
const DEBOUNCE_MS = 200

export function useSearchField(onChange: (value: string) => void) {
  const [raw, setRaw] = useState("")

  useEffect(() => {
    const id = setTimeout(() => onChange(raw.trim()), DEBOUNCE_MS)
    return () => clearTimeout(id)
  }, [raw, onChange])

  return { raw, setRaw, clear: () => setRaw("") }
}
