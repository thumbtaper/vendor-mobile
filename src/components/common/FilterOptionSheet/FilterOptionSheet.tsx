import { X } from "lucide-react-native"
import { useMemo } from "react"
import { Modal, Pressable, ScrollView, Text, View } from "react-native"

import { useBottomInset } from "@/hooks/useBottomInset"
import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./FilterOptionSheet.styles"

export interface FilterOption {
  key: string
  label: string
  meta?: string
  badge?: number
  selected: boolean
  onSelect: () => void
}

interface Props {
  visible: boolean
  title: string
  subtitle?: string
  options: readonly FilterOption[]
  onClose: () => void
}

// Controlled bottom sheet for compact filter pickers. It owns presentation only;
// callers own the selected value and the domain-specific option list.
export function FilterOptionSheet({
  visible,
  title,
  subtitle,
  options,
  onClose,
}: Props) {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])
  const bottomInset = useBottomInset({ tabBar: false })

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close filter options"
      >
        <Pressable
          style={styles.sheetWrap}
          onPress={() => {}}
          accessible={false}
        >
          <View style={[styles.sheet, { paddingBottom: bottomInset }]}>
            <View style={styles.grabber} />
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.title}>{title}</Text>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
              </View>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close filter options"
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
              contentContainerStyle={styles.optionList}
            >
              {options.map((option, index) => (
                <Pressable
                  key={option.key}
                  onPress={option.onSelect}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: option.selected }}
                  style={({ pressed }) => [
                    styles.option,
                    index > 0 && styles.optionDivider,
                    pressed && styles.optionPressed,
                  ]}
                >
                  <View
                    style={[
                      styles.radio,
                      option.selected && styles.radioSelected,
                    ]}
                  >
                    {option.selected ? <View style={styles.radioDot} /> : null}
                  </View>
                  <View style={styles.optionText}>
                    <Text style={styles.optionLabel}>{option.label}</Text>
                    {option.meta ? (
                      <Text style={styles.optionMeta}>{option.meta}</Text>
                    ) : null}
                  </View>
                  {option.badge && option.badge > 0 ? (
                    <Text
                      style={styles.badge}
                      accessibilityLabel={`${option.badge} ${option.label}`}
                    >
                      {option.badge > 99 ? "99+" : option.badge}
                    </Text>
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
