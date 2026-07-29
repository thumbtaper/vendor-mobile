import { Search, X } from "lucide-react-native"
import { useMemo } from "react"
import { Pressable, TextInput, View } from "react-native"

import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./SearchField.styles"
import { useSearchField } from "./useSearchField"

export function SearchField({
  placeholder,
  onChange,
}: {
  placeholder: string
  onChange: (value: string) => void
}) {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])
  const s = useSearchField(onChange)

  return (
    <View style={styles.wrapper}>
      <Search size={16} color={tokens.text} />
      <TextInput
        value={s.raw}
        onChangeText={s.setRaw}
        placeholder={placeholder}
        placeholderTextColor={tokens.text}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel={placeholder}
        style={styles.input}
      />
      {s.raw.length > 0 ? (
        <Pressable
          onPress={s.clear}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          style={styles.clear}
        >
          <X size={16} color={tokens.text} />
        </Pressable>
      ) : null}
    </View>
  )
}
