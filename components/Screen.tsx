// components/Screen.tsx
import React from "react";
import { SafeAreaView, StyleProp, View, ViewStyle } from "react-native";
import { theme } from "../constants/theme";

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  noPadding?: boolean; // ✅ optional
};

export function Screen({ children, style, noPadding = false }: Props) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View
        style={[
          {
            flex: 1,
            backgroundColor: theme.colors.bg,
            padding: noPadding ? 0 : theme.space.l,
          },
          style,
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}






