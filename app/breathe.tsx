import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { theme } from "../constants/theme";

type Phase = "Inhale" | "Exhale";

function formatMMSS(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  const ss = s.toString().padStart(2, "0");
  return `${m}:${ss}`;
}

export default function Breathe() {
  // v1: 60 seconds total
  const TOTAL = 60;

  // Gentle cadence: inhale 4, exhale 6
  const INHALE = 4;
  const EXHALE = 6;
  const CYCLE = INHALE + EXHALE;

  const [secondsLeft, setSecondsLeft] = useState(TOTAL);

  // Animated values
  const cloudScale = useRef(new Animated.Value(1)).current;
  const cloudY = useRef(new Animated.Value(0)).current;
  const cloudX = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0.55)).current;

  // Timer tick
  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);

    return () => clearInterval(id);
  }, []);

  const done = secondsLeft === 0;

  // Determine current phase based on elapsed time
  const phase: Phase = useMemo(() => {
    const elapsed = TOTAL - secondsLeft;
    const t = elapsed % CYCLE;
    return t < INHALE ? "Inhale" : "Exhale";
  }, [secondsLeft]);

  const phaseHint = useMemo(() => {
    return phase === "Inhale" ? "Slowly, through your nose" : "Gently, like a sigh";
  }, [phase]);

  // Dreamy breathing animation loop
  useEffect(() => {
    if (done) {
      cloudScale.stopAnimation();
      cloudY.stopAnimation();
      cloudX.stopAnimation();
      glow.stopAnimation();

      cloudScale.setValue(1);
      cloudY.setValue(0);
      cloudX.setValue(0);
      glow.setValue(0.55);
      return;
    }

    // baseline
    cloudScale.setValue(1);
    cloudY.setValue(0);
    cloudX.setValue(0);
    glow.setValue(0.55);

    const loop = Animated.loop(
      Animated.sequence([
        // INHALE: expand + float up + slight drift + brighten
        Animated.parallel([
          Animated.timing(cloudScale, {
            toValue: 1.2,
            duration: INHALE * 1000,
            useNativeDriver: true,
          }),
          Animated.timing(cloudY, {
            toValue: -14,
            duration: INHALE * 1000,
            useNativeDriver: true,
          }),
          Animated.timing(cloudX, {
            toValue: 6,
            duration: INHALE * 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glow, {
            toValue: 0.82,
            duration: INHALE * 1000,
            useNativeDriver: true,
          }),
        ]),
        // EXHALE: contract + float down + drift back + soften
        Animated.parallel([
          Animated.timing(cloudScale, {
            toValue: 1.0,
            duration: EXHALE * 1000,
            useNativeDriver: true,
          }),
          Animated.timing(cloudY, {
            toValue: 0,
            duration: EXHALE * 1000,
            useNativeDriver: true,
          }),
          Animated.timing(cloudX, {
            toValue: 0,
            duration: EXHALE * 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glow, {
            toValue: 0.55,
            duration: EXHALE * 1000,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [cloudScale, cloudY, cloudX, glow, done, INHALE, EXHALE]);

  return (
    <Screen style={{ justifyContent: "center" }}>
      <Text style={styles.title}>Breathe with me.</Text>
      <Text style={styles.sub}>One minute. Nothing to perfect.</Text>

      {/* Dreamy cloud */}
      <View style={styles.cloudWrap}>
        {/* glow layer */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.glow,
            {
              opacity: glow,
              transform: [{ translateY: cloudY }],
            },
          ]}
        />

        {/* cloud body */}
        <Animated.View
          style={[
            styles.cloud,
            {
              transform: [
                { translateX: cloudX },
                { translateY: cloudY },
                { scale: cloudScale },
              ],
            },
          ]}
        >
          <View style={[styles.puff, styles.puff1]} />
          <View style={[styles.puff, styles.puff2]} />
          <View style={[styles.puff, styles.puff3]} />
          <View style={[styles.puff, styles.puff4]} />
        </Animated.View>
      </View>

      <View style={styles.card}>
        <Text style={styles.phase}>{phase}</Text>
        <Text style={styles.hint}>{phaseHint}</Text>

        <View style={styles.timerRow}>
          <Text style={styles.timerLabel}>Timer</Text>
          <Text style={styles.timer}>{formatMMSS(secondsLeft)}</Text>
        </View>
      </View>

      <PrimaryButton
        label={done ? "Continue" : "Skip"}
        onPress={() => router.push("/close")}
      />
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

  cloudWrap: {
    alignItems: "center",
    justifyContent: "center",
    height: 140,
    marginBottom: theme.space.l,
  },

  // soft “glow halo” behind the cloud
  glow: {
    position: "absolute",
    width: 220,
    height: 120,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.55)",
  },

  cloud: {
    width: 180,
    height: 95,
    borderRadius: 999,
    backgroundColor: "rgba(44,44,84,0.10)",
    borderWidth: 1,
    borderColor: "rgba(44,44,84,0.14)",
    justifyContent: "center",
    alignItems: "center",
  },

  puff: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.58)",
  },
  puff1: {
    width: 70,
    height: 70,
    borderRadius: 999,
    left: 18,
    top: -18,
  },
  puff2: {
    width: 90,
    height: 90,
    borderRadius: 999,
    left: 58,
    top: -36,
  },
  puff3: {
    width: 68,
    height: 68,
    borderRadius: 999,
    left: 115,
    top: -14,
  },
  puff4: {
    width: 55,
    height: 55,
    borderRadius: 999,
    left: 78,
    top: 10,
    opacity: 0.45,
  },

  card: {
    borderRadius: theme.radius.m,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.space.l,
    marginBottom: theme.space.l,
  },
  phase: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: theme.space.s,
  },
  hint: {
    fontSize: theme.type.bodySize,
    lineHeight: theme.type.bodyLine,
    opacity: 0.75,
    color: theme.colors.text,
    marginBottom: theme.space.l,
  },
  timerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timerLabel: {
    fontSize: 14,
    opacity: 0.65,
    color: theme.colors.text,
    fontWeight: "600",
  },
  timer: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: "700",
  },
});



