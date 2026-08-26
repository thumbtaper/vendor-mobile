import { Compass, Lightbulb, X } from "lucide-react-native"
import { useMemo } from "react"
import { Modal, Pressable, ScrollView, Text, View } from "react-native"

import { PrimaryButton } from "@/components/common/PrimaryButton/PrimaryButton"
import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./GuideModal.styles"
import { GUIDE_FOOTNOTE, GUIDE_ITEMS, GUIDE_TIP } from "./guideItems"

interface Props {
  visible: boolean
  onClose: () => void
  topInset: number
  bottomInset: number
}

export function GuideModal({ visible, onClose, topInset, bottomInset }: Props) {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
    >
      <View
        style={styles.surface}
        accessibilityViewIsModal
      >
        <View style={[styles.header, { paddingTop: topInset + 12 }]}>
          <View style={styles.headerText}>
            <View
              style={styles.headerChip}
              importantForAccessibility="no-hide-descendants"
              accessibilityElementsHidden
            >
              <Compass size={16} color={tokens.btnPrimaryFg} />
            </View>
            <View style={styles.headerCopy}>
              <Text style={styles.headerTitle}>Getting started</Text>
              <Text style={styles.headerSubtitle}>
                Your quick guide to the vendor app
              </Text>
            </View>
          </View>

          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close the getting-started guide"
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.closePressed,
            ]}
          >
            <X size={20} color={tokens.strong} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
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
              <Text style={[styles.tipTitle, { color: GUIDE_TIP.color }]}>
                {GUIDE_TIP.title}
              </Text>
              <Text style={styles.itemBody}>{GUIDE_TIP.body}</Text>
            </View>
          </View>

          <Text style={styles.footnote}>{GUIDE_FOOTNOTE}</Text>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: bottomInset }]}>
          <PrimaryButton label="Done" onPress={onClose} variant="secondary" />
        </View>
      </View>
    </Modal>
  )
}
