import { Compass, Lightbulb, X } from "lucide-react-native"
import { useMemo } from "react"
import { Pressable, Text, View } from "react-native"

import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./GuideCard.styles"
import { GUIDE_FOOTNOTE, GUIDE_ITEMS, GUIDE_TIP } from "./guideItems"

/**
 * The getting-started guide, mirroring the vendor web portal's `GuidePanel`.
 *
 * Hide / Show rather than an in-place collapse (D3): a vendor who uses both
 * clients meets the same affordance twice, and the web already established it.
 *
 * Four-state handling does not apply here and its absence is deliberate — this
 * is static local content with no fetch, no query and no failure mode. The one
 * asynchronous thing about it is the stored preference, which `useGuideCard`
 * handles by rendering nothing until the read lands.
 *
 * Pure render layer, and now a CONTROLLED one: `useGuideCard`'s state moved up to
 * the dashboard route, because the guide's entry point is a header button that
 * this component is not an ancestor of. The per-item accent colours are the only
 * inline styles, and they qualify — they are genuinely dynamic one-off values,
 * exactly as they are in the web component.
 *
 * ⚠️ The old "Show guide" row is GONE. It was the second way in, and the request
 * that moved the trigger to the header was explicit about not leaving two. Hidden
 * now renders nothing at all — the header button is the single entry point.
 */
export function GuideCard({
  hidden,
  onHide,
}: {
  /** `null` = preference not read yet. Renders nothing, same as hidden. */
  hidden: boolean | null
  onHide: () => void
}) {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  // `null` is "preference not read yet", not "visible". Rendering the card here
  // would flash it on every cold start at a vendor who hid it.
  if (hidden === null || hidden) return null

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          {/* Decorative. The heading beside it carries the meaning, so the icon
              is hidden from assistive tech rather than announced as a stray
              graphic (ux-design §5: never colour or icon alone). */}
          <View
            style={styles.headerChip}
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden
          >
            <Compass size={16} color={tokens.btnPrimaryFg} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Getting started</Text>
            <Text style={styles.headerSubtitle}>
              Your quick guide to the vendor app
            </Text>
          </View>
        </View>

        {/* Kept alongside the header button: this is in-context dismissal, not a
            second entry point — one way in, two ways out, which is the normal
            shape for a dismissible panel. */}
        <Pressable
          onPress={onHide}
          accessibilityRole="button"
          // Not a bare "Hide" — out of context that announces as an orphan.
          accessibilityLabel="Hide the getting-started guide"
          accessibilityState={{ expanded: true }}
          style={styles.toggle}
        >
          <X size={11} color={tokens.text} />
          <Text style={styles.toggleLabel}>Hide</Text>
        </Pressable>
      </View>

      <View style={styles.body}>
        {GUIDE_ITEMS.map(({ Icon, title, body, color, actions }) => (
          <View key={title} style={[styles.item, { borderLeftColor: color }]}>
            <View
              style={[
                styles.itemChip,
                { backgroundColor: `${color}1a`, borderColor: `${color}33` },
              ]}
              importantForAccessibility="no-hide-descendants"
              accessibilityElementsHidden
            >
              <Icon size={13} color={color} />
            </View>
            <View style={styles.itemText}>
              <Text style={styles.itemTitle}>{title}</Text>
              <Text style={styles.itemBody}>{body}</Text>
              {actions && actions.length > 0 ? (
                <View style={styles.actions}>
                  {actions.map(({ label, meaning }) => (
                    <View key={label}>
                      <Text style={styles.actionLabel}>{label}</Text>
                      <Text style={styles.actionMeaning}>{meaning}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          </View>
        ))}

        <View style={[styles.item, { borderLeftColor: GUIDE_TIP.color }]}>
          <View
            style={[
              styles.itemChip,
              {
                backgroundColor: `${GUIDE_TIP.color}1a`,
                borderColor: `${GUIDE_TIP.color}33`,
              },
            ]}
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden
          >
            <Lightbulb size={13} color={GUIDE_TIP.color} />
          </View>
          <View style={styles.itemText}>
            <Text style={[styles.itemTitle, { color: GUIDE_TIP.color }]}>
              {GUIDE_TIP.title}
            </Text>
            <Text style={styles.itemBody}>{GUIDE_TIP.body}</Text>
          </View>
        </View>

        <Text style={styles.footnote}>{GUIDE_FOOTNOTE}</Text>
      </View>
    </View>
  )
}
