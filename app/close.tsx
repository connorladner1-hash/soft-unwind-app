import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "../components/PrimaryButton";
import { GlassCard } from "../components/ui/GlassCard";
import { Screen } from "../components/Screen";
import { theme } from "../constants/theme";

const LAST_SESSION_KEY = "softreset:last_session";

export default function Close() {
  const [cleared, setCleared] = useState(false);

  const clearTonight = async () => {
    try {
      await AsyncStorage.removeItem(LAST_SESSION_KEY);
      setCleared(true);
    } catch (e) {
      console.log("Failed to clear last session", e);
    }
  };

  return (
    <Screen style={{ justifyContent: "flex-start" }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: theme.space.l }}
      >
        <Text style={styles.title}>You did enough.</Text>
        <Text style={styles.sub}>
          You’re allowed to stop thinking now.
        </Text>

        <GlassCard style={styles.card}>
          <Text style={styles.line}>
            If your mind starts up again, you can come back to one breath.
          </Text>
          <Text style={styles.line}>
            Nothing needs a decision tonight.
          </Text>
          <Text style={[styles.line, { marginBottom: 0 }]}>
            Rest is still progress.
          </Text>
        </GlassCard>

        <PrimaryButton
          label="You are now Reset. See you tomorrow."
          onPress={() => router.replace("/")}
        />

        <View style={{ height: theme.space.m }} />

        <Pressable onPress={clearTonight} style={styles.linkRow}>
          <Text style={styles.linkText}>
            {cleared ? "Cleared." : "Clear tonight’s entry"}
          </Text>
        </Pressable>

        <View style={{ height: theme.space.s }} />

        <Pressable onPress={() => router.push("/about")} style={styles.linkRow}>
          <Text style={styles.linkText}>About / Safety</Text>
        </Pressable>

        <Text style={styles.footer}>
          No streaks. No pressure. Just a softer night.
        </Text>
      </ScrollView>
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
  card: {
    padding: theme.space.m,
    marginBottom: theme.space.l,
  },
  line: {
    fontSize: theme.type.bodySize,
    lineHeight: theme.type.bodyLine,
    color: theme.colors.text,
    opacity: 0.85,
    marginBottom: theme.space.s,
  },
  linkRow: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  linkText: {
    fontSize: 14,
    color: theme.colors.text,
    opacity: 0.6,
    textDecorationLine: "underline",
  },
  footer: {
    marginTop: theme.space.l,
    fontSize: 13,
    opacity: 0.55,
    color: theme.colors.text,
  },
});
