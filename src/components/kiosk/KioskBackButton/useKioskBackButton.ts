import { useMemo } from "react"
import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./KioskBackButton.styles"

export function useKioskBackButton() {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])
  return { styles, tokens }
}
