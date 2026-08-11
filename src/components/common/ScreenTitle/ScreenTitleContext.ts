import { createContext } from "react"

export interface ScreenTitleValue {
  title: string
  subtitle?: string | null
}

/**
 * Carries a screen's title from `ScreenShell` down to wherever `<ScreenTitle />`
 * is rendered.
 *
 * Context rather than a prop because B1 moved the title *inside* each screen's
 * scroll container — several components deep, and in two different kinds of
 * container (a `FlashList` header on the list screens, a `ScrollView` child on
 * Dashboard and Settings). Threading it as a prop would mean five view components
 * accepting and forwarding a title they do not otherwise care about.
 *
 * `null` is a legitimate value, not an error: a `<ScreenTitle />` rendered outside
 * a `ScreenShell` renders nothing rather than throwing. There is no error boundary
 * in this app, so a throw here would take the whole screen down in a release
 * build — see the "never throw at module scope" trap in AGENTS.md, same reasoning.
 */
export const ScreenTitleContext = createContext<ScreenTitleValue | null>(null)
