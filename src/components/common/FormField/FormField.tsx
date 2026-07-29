import { useMemo } from "react"
import { Text, TextInput, View, type TextInputProps } from "react-native"

import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./FormField.styles"

interface Props extends TextInputProps {
  label: string
  error?: string | null
  /** Rendered inside the field on the trailing edge — e.g. a password toggle. */
  adornment?: React.ReactNode
}

// Pure display: fully controlled, no state, no effects, no handlers of its own.
// Per `component-separation` §4 that means no companion hook.
export function FormField({ label, error, adornment, style, ...inputProps }: Props) {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.field}>
        <TextInput
          {...inputProps}
          accessibilityLabel={inputProps.accessibilityLabel ?? label}
          placeholderTextColor={tokens.text}
          style={[
            styles.input,
            adornment ? styles.inputWithAdornment : null,
            error ? styles.inputError : null,
            style,
          ]}
        />
        {adornment ? <View style={styles.adornment}>{adornment}</View> : null}
      </View>
      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  )
}
