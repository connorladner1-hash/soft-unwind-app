// constants/theme.ts
export const theme = {
  colors: {
    // Backgrounds
    bg: "#120A1F",          // deep night purple (base)
    bg2: "#1A1030",         // slightly lighter purple (for subtle layering if needed)
    card: "rgba(255, 255, 255, 0.06)", // soft frosted card
    cardStrong: "rgba(255, 255, 255, 0.09)",

    // Text
    text: "#F6F3FF",        // near-white lavender
    textMuted: "rgba(246, 243, 255, 0.72)",
    placeholder: "rgba(246, 243, 255, 0.45)",

    // Buttons
    button: "#3B2A5A",      // muted purple button
    buttonPressed: "#33224F",
    buttonText: "#F6F3FF",
    buttonDisabled: "rgba(59, 42, 90, 0.40)",

    // Borders / dividers
    border: "rgba(246, 243, 255, 0.12)",

    // Pills / selection highlight
    pillBg: "rgba(246, 243, 255, 0.08)",
    selectionBg: "rgba(165, 125, 255, 0.16)", // gentle lavender glow

    // Accent (icons / moon)
    accent: "#A57DFF",
  },

  // Spacing system
  space: {
    xs: 8,
    s: 12,
    m: 16,
    l: 24,
    xl: 28,
  },

  // Border radius
  radius: {
    s: 12,
    m: 16,
    l: 22,
    pill: 999,
  },

  // Typography scale
  type: {
    titleSize: 30,
    titleLine: 36,
    subSize: 18,
    subLine: 24,
    bodySize: 16,
    bodyLine: 22,
  },
};
