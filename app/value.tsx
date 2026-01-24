import { ScreenMascot } from "@/components/ScreenMascot";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text } from "react-native";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { theme } from "../constants/theme";

export default function Value() {
  return (
    <Screen>
     <ScreenMascot style={{ marginBottom: 16 }} /> 
      <Text style={styles.title}>A short nightly ritual.</Text>
      <Text style={styles.sub}>Just enough to help your mind slow down.</Text>

      <PrimaryButton label="Continue" onPress={() => router.push("/check-in")} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: theme.type.titleSize,
    lineHeight: theme.type.titleLine,
    fontWeight: "600",
    marginBottom: theme.space.s,
    color: theme.colors.text,
  },
  sub: {
    fontSize: theme.type.subSize,
    lineHeight: theme.type.subLine,
    opacity: 0.75,
    marginBottom: theme.space.l,
    color: theme.colors.text,
  },
});





