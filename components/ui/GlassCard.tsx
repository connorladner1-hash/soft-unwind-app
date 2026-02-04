import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { surfaces } from "../../constants/design";

type Variant = "default" | "tight" | "soft";

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: Variant;
};

const paddingByVariant: Record<Variant, number> = {
  default: 20,
  tight: 16,
  soft: 24,
};

const borderOpacityByVariant: Record<Variant, number> = {
  default: 1,
  tight: 0.9,
  soft: 0.75,
};

export function GlassCard({ children, style, variant = "default" }: Props) {
  return (
    <View style={[styles.container, { padding: paddingByVariant[variant] }, style]}>
      <View
        pointerEvents="none"
        style={[styles.border, { opacity: borderOpacityByVariant[variant] }]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
    ...(surfaces?.glass ?? {}),
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  border: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: surfaces?.glass?.borderRadius ?? 24,
    borderWidth: surfaces?.glass?.borderWidth ?? 1,
    borderColor: surfaces?.glass?.borderColor ?? "rgba(255, 255, 255, 0.12)",
  },
});
