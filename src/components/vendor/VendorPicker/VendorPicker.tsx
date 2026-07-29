import { ChevronRight } from "lucide-react-native"
import { useMemo } from "react"
import { ActivityIndicator, Pressable, Text, View } from "react-native"

import { vendorInitials, type DbVendor } from "@/services/vendor.service"
import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./VendorPicker.styles"
import { useVendorPicker } from "./useVendorPicker"

interface Props {
  vendors: DbVendor[]
  onSelect: (id: string) => Promise<void>
}

export function VendorPicker({ vendors, onSelect }: Props) {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])
  const { pendingId, select } = useVendorPicker(onSelect)

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.heading}>Choose a vendor</Text>
        <Text style={styles.subheading}>
          You manage more than one. Pick which to open — you can switch any time
          from Settings.
        </Text>
      </View>

      <View style={styles.list}>
        {vendors.map((vendor) => (
          <Pressable
            key={vendor.id}
            onPress={() => select(vendor)}
            disabled={pendingId !== null}
            accessibilityRole="button"
            accessibilityLabel={`Open ${vendor.name}`}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          >
            <View style={styles.avatar}>
              <Text style={styles.initials}>{vendorInitials(vendor.name)}</Text>
            </View>
            <View style={styles.body}>
              <Text style={styles.name}>{vendor.name}</Text>
              {vendor.address ? (
                <Text style={styles.address} numberOfLines={1}>
                  {vendor.address}
                </Text>
              ) : null}
            </View>
            {pendingId === vendor.id ? (
              <ActivityIndicator color={tokens.text} />
            ) : (
              <ChevronRight size={18} color={tokens.text} />
            )}
          </Pressable>
        ))}
      </View>
    </View>
  )
}
