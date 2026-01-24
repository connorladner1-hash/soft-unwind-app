import React from "react";
import Svg, { Circle, Ellipse, G, Path } from "react-native-svg";
import { theme } from "../constants/theme";

export type BearMood = "calm" | "listening" | "proud" | "sleepy";

type Props = {
  size?: number;
  mood?: BearMood;
  tint?: "brown" | "lavender" | "gray";
  accessory?: "none" | "moonPin" | "scarf" | "beanie"; // future
};

function palette(tint: Props["tint"]) {
  // tuned for your dark theme
  const base = {
    brown: {
      fur: "#B88A63",
      furShadow: "#A77B56",
      muzzle: "#E7C8AA",
      nose: "#2A1E2C",
      blush: "rgba(165,125,255,0.35)",
      outline: "rgba(246,243,255,0.18)",
    },
    lavender: {
      fur: "#9B7AE0",
      furShadow: "#8464CC",
      muzzle: "#D8CBFF",
      nose: "#23182B",
      blush: "rgba(246,243,255,0.28)",
      outline: "rgba(246,243,255,0.18)",
    },
    gray: {
      fur: "#9AA0AA",
      furShadow: "#858B95",
      muzzle: "#D7D9DD",
      nose: "#1E1E22",
      blush: "rgba(165,125,255,0.25)",
      outline: "rgba(246,243,255,0.18)",
    },
  };

  return base[tint || "brown"];
}

export function MascotBear({
  size = 96,
  mood = "calm",
  tint = "brown",
  accessory = "none",
}: Props) {
  const c = palette(tint);

  // Face variants (tiny changes, big vibe shift)
  const mouth =
    mood === "proud"
      ? "M50 67 C54 71, 60 71, 64 67" // small smile
      : mood === "sleepy"
      ? "M50 69 C56 70, 58 70, 64 69" // flatter sleepy smile
      : mood === "listening"
      ? "M52 69 C56 72, 60 72, 64 69" // warmer
      : "M52 69 C56 71, 60 71, 64 69"; // calm

  const eyes =
    mood === "sleepy" ? (
      <>
        <Path
          d="M40 55 C44 57, 48 57, 52 55"
          stroke={theme.colors.text}
          strokeOpacity={0.7}
          strokeWidth={3}
          strokeLinecap="round"
        />
        <Path
          d="M62 55 C66 57, 70 57, 74 55"
          stroke={theme.colors.text}
          strokeOpacity={0.7}
          strokeWidth={3}
          strokeLinecap="round"
        />
      </>
    ) : (
      <>
        <Circle cx="46" cy="55" r="4" fill={theme.colors.text} opacity={0.9} />
        <Circle cx="68" cy="55" r="4" fill={theme.colors.text} opacity={0.9} />
        <Circle cx="47.5" cy="54" r="1.5" fill={theme.colors.bg} opacity={0.9} />
        <Circle cx="69.5" cy="54" r="1.5" fill={theme.colors.bg} opacity={0.9} />
      </>
    );

  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      {/* Ears */}
      <Circle cx="30" cy="32" r="18" fill={c.furShadow} opacity={0.95} />
      <Circle cx="90" cy="32" r="18" fill={c.furShadow} opacity={0.95} />
      <Circle cx="30" cy="32" r="12" fill={c.fur} opacity={0.95} />
      <Circle cx="90" cy="32" r="12" fill={c.fur} opacity={0.95} />

      {/* Head */}
      <Circle cx="60" cy="60" r="44" fill={c.fur} />
      <Circle cx="60" cy="60" r="44" fill="none" stroke={c.outline} strokeWidth={2} />

      {/* Cheeks */}
      <Ellipse cx="38" cy="67" rx="9" ry="6" fill={c.blush} />
      <Ellipse cx="82" cy="67" rx="9" ry="6" fill={c.blush} />

      {/* Muzzle */}
      <Ellipse cx="60" cy="72" rx="26" ry="20" fill={c.muzzle} opacity={0.95} />

      {/* Nose */}
      <Path
        d="M58 64 C60 62, 62 62, 64 64 C63 67, 59 67, 58 64 Z"
        fill={c.nose}
        opacity={0.95}
      />

      {/* Eyes */}
      {eyes}

      {/* Mouth */}
      <Path d={mouth} stroke={c.nose} strokeWidth={3} strokeLinecap="round" fill="none" />

      {/* Tiny “moon pin” placeholder accessory (future) */}
      {accessory === "moonPin" ? (
        <G opacity={0.9}>
          <Path
            d="M92 78 C86 72, 86 62, 92 56 C88 58, 86 62, 86 67 C86 72, 88 76, 92 78 Z"
            fill={theme.colors.accent}
          />
        </G>
      ) : null}
    </Svg>
  );
}
