import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "../components/PrimaryButton";
import { GlassCard } from "../components/ui/GlassCard";
import { Screen } from "../components/Screen";
import { theme } from "../constants/theme";

export default function About() {
  return (
    <Screen style={{ justifyContent: "flex-start" }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: theme.space.l }}
      >
        <Text style={styles.title}>About Soft Reset</Text>

        <GlassCard style={styles.card}>
          <Text style={styles.body}>
            Soft Reset is a short nightly ritual for the moments when your mind
            won’t power down and rest feels far away.
          </Text>

          <Text style={styles.body}>
            It isn’t here to diagnose you, fix you, or push you to be better.
            It’s here to help you feel heard, grounded, and gently ready to rest.
          </Text>

          <Text style={styles.small}>
            Soft Reset is not a medical or mental health treatment.
            If you’re feeling overwhelmed, distressed, or struggling often,
            consider reaching out to someone you trust or a licensed professional.
            You deserve care and support.
          </Text>
        </GlassCard>

        <PrimaryButton label="Back" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: theme.type.titleSize,
    lineHeight: theme.type.titleLine,
    fontWeight: "600",
    marginBottom: theme.space.l,
    color: theme.colors.text,
  },
  card: {
    padding: theme.space.m,
    marginBottom: theme.space.l,
  },
  body: {
    fontSize: theme.type.bodySize,
    lineHeight: theme.type.bodyLine,
    color: theme.colors.text,
    opacity: 0.85,
    marginBottom: theme.space.m,
  },
  small: {
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.text,
    opacity: 0.6,
  },
});
