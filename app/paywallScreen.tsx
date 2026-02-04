import React, { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { PrimaryButton } from "../components/PrimaryButton";
import { GlassCard } from "../components/ui/GlassCard";
import { Screen } from "../components/Screen";
import { ScreenMascot } from "../components/ScreenMascot";
import { theme } from "../constants/theme";

export default function PaywallScreen() {
  const [plan, setPlan] = useState<"annual" | "student">("annual");

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <ScreenMascot size={160} style={{ marginBottom: 12 }} />

        <Text style={styles.title}>Let go of today — gently.</Text>

        <Text style={styles.quote}>
          “I used to replay my day over and over. This is the first thing that
          helped me actually let it go.”
        </Text>
        <Text style={styles.author}>— Sarah, 21</Text>

        {/* Toggle */}
        <View style={styles.toggle}>
          <TouchableOpacity
            activeOpacity={0.92}
            style={[styles.toggleBtn, plan === "annual" && styles.toggleBtnActive]}
            onPress={() => setPlan("annual")}
          >
            <Text style={[styles.toggleText, plan === "annual" && styles.toggleTextActive]}>
              Annual
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.92}
            style={[styles.toggleBtn, plan === "student" && styles.toggleBtnActive]}
            onPress={() => setPlan("student")}
          >
            <Text style={[styles.toggleText, plan === "student" && styles.toggleTextActive]}>
              Student
            </Text>
          </TouchableOpacity>
        </View>

        {/* Plan card */}
        <GlassCard variant="soft" style={styles.card}>
          {plan === "annual" ? (
            <>
              <Text style={styles.cardTitle}>🌙 Yearly Calm</Text>
              <Text style={styles.price}>$4.17 / month</Text>
              <Text style={styles.cardSub}>
                Billed annually at $49.99 — save 45%
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.cardTitle}>🎓 Student Calm</Text>
              <Text style={styles.price}>$3.33 / month</Text>
              <Text style={styles.cardSub}>
                Verify with your .edu email
              </Text>
            </>
          )}
        </GlassCard>

        {/* Bullets */}
        <View style={styles.section}>
          <Text style={styles.bullet}>• Full nightly reflection ritual</Text>
          <Text style={styles.bullet}>• Thought-settling responses</Text>
          <Text style={styles.bullet}>
            • Gentle guidance when your mind feels stuck
          </Text>
        </View>

        {/* Trial timeline */}
        <View style={styles.section}>
          <Text style={styles.bullet}>• Today: Unlock the full unwind</Text>
          <Text style={styles.bullet}>• Day 5: Gentle reminder</Text>
          <Text style={styles.bullet}>• Day 7: Trial ends</Text>
        </View>

        <PrimaryButton label="Start my free week" onPress={() => {}} />

        <Text style={styles.footer}>
          Cancel anytime. No payment due now.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: theme.space.l,
    paddingVertical: theme.space.m,
    alignItems: "center",
    gap: theme.space.m,
  },

  title: {
    fontSize: theme.type.titleSize,
    lineHeight: theme.type.titleLine,
    fontWeight: "600",
    textAlign: "center",
    color: theme.colors.text,
  },
  quote: {
    textAlign: "center",
    color: theme.colors.text,
    opacity: 0.72,
    paddingHorizontal: theme.space.s,
  },
  author: {
    color: theme.colors.text,
    opacity: 0.6,
  },

  /* 🔹 Darker gray toggle background */
  toggle: {
    flexDirection: "row",
    borderRadius: 999,
    padding: 4,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  toggleBtn: {
    paddingVertical: theme.space.s,
    paddingHorizontal: theme.space.l,
    borderRadius: 999,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  toggleBtnActive: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderColor: "rgba(255,255,255,0.18)",
  },
  toggleText: {
    color: "rgba(245,247,250,0.70)",
    fontWeight: "600",
  },
  toggleTextActive: {
    color: "rgba(245,247,250,0.95)",
    fontWeight: "700",
  },

  /* 🔹 Darker gray plan card */
  card: {
    width: "100%",
    alignItems: "center",
  },
  cardTitle: {
    color: theme.colors.text,
    fontWeight: "700",
    marginBottom: 6,
  },
  price: {
    color: theme.colors.text,
    fontSize: theme.type.titleSize,
    lineHeight: theme.type.titleLine,
    fontWeight: "800",
  },
  cardSub: {
    color: theme.colors.text,
    opacity: 0.6,
    marginTop: 6,
    textAlign: "center",
  },

  section: {
    width: "100%",
    gap: 6,
  },
  bullet: {
    color: theme.colors.text,
    opacity: 0.72,
  },

  footer: {
    color: theme.colors.text,
    opacity: 0.55,
    textAlign: "center",
  },
});

