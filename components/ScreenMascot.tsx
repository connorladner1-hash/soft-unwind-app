import React from "react";
import { StyleSheet, View } from "react-native";
import { theme } from "../constants/theme";
import { BearMood, MascotBear } from "./MascotBear";

type Props = {
  mood?: BearMood;
  size?: number;
  corner?: "topRight" | "topLeft";
};

export function ScreenMascot({ mood = "calm", size = 92, corner = "topRight" }: Props) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.wrap,
        corner === "topRight" ? styles.topRight : styles.topLeft,
      ]}
    >
      <View style={styles.glow} />
      <MascotBear size={size} mood={mood} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: theme.space.m,
    zIndex: 10,
  },
  topRight: { right: theme.space.m },
  topLeft: { left: theme.space.m },

  glow: {
    position: "absolute",
    width: 86,
    height: 86,
    borderRadius: 999,
    backgroundColor: theme.colors.selectionBg,
    opacity: 0.55,
    top: 6,
    left: 6,
  },
});
