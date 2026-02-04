// components/Screen.tsx
import React from "react";
import { SafeAreaView, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, spacing } from "../constants/design";

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  noPadding?: boolean;
};

export function Screen({ children, style, noPadding = false }: Props) {
  return (
    <LinearGradient
      colors={[
        colors.bg2,
        colors.bg1,
        colors.bg0,
      ]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.root}
    >
      <View pointerEvents="none" style={styles.vignette} />
      <SafeAreaView style={{ flex: 1 }}>
        <View
          style={[
            {
              flex: 1,
              paddingHorizontal: noPadding ? 0 : spacing.xl,
              paddingTop: noPadding ? 0 : spacing.xxl,
              paddingBottom: noPadding ? 0 : spacing.xxl,
            },
            style,
          ]}
        >
          {children}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  vignette: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0, 0, 0, 0.08)",
    opacity: 0.08,
  },
});




