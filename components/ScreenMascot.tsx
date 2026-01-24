// components/ScreenMascot.tsx
import React from "react";
import { Image, StyleProp, StyleSheet, View, ViewStyle } from "react-native";

type Props = {
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function ScreenMascot({ size = 160, style }: Props) {
  return (
    <View style={[styles.wrap, style]}>
      <Image
        source={require("../assets/mascot/bear.png")}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",

    // DEBUG: uncomment for 10 seconds if you still can’t see anything
    // borderWidth: 2,
    // borderColor: "red",
  },
});


