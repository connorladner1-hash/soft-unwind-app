// components/PrimaryButton.tsx
import React, { useRef } from "react";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";

import { colors, shadow } from "../constants/design";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
};

export function PrimaryButton({ label, onPress, disabled, style }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const animateTo = (nextScale: number, nextOpacity: number) => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: nextScale,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: nextOpacity,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressIn = () => {
    if (disabled) return;
    animateTo(0.98, 0.92);
  };

  const handlePressOut = () => {
    if (disabled) return;
    animateTo(1, 1);
  };

  const handlePress = () => {
    if (disabled) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        styles.base,
        disabled ? styles.disabled : null,
        { transform: [{ scale }], opacity },
        style,
      ]}
    >
      <BlurView intensity={32} tint="dark" style={styles.blur} />
      <LinearGradient
        colors={[
          "rgba(255, 255, 255, 0.12)",
          "rgba(255, 255, 255, 0.02)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />
      <Text style={styles.text}>{label}</Text>
    </AnimatedPressable>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: 30,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.14)",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    ...shadow.glow,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  disabled: {
    opacity: 0.6,
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  text: {
    color: colors.text0,
    fontSize: 16,
    fontWeight: "600",
    opacity: 0.96,
  },
});

