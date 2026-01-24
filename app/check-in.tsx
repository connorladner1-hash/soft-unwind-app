import { ScreenMascot } from "@/components/ScreenMascot";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { theme } from "../constants/theme";

type Option = { id: string; label: string };

const FEELINGS: Option[] = [
  { id: "overthinking", label: "Overthinking" },
  { id: "anxious", label: "Anxious" },
  { id: "wired", label: "Tired but wired" },
  { id: "okay", label: "Mostly okay" },
];

const TIMES: Option[] = [
  { id: "before-11", label: "Before 11" },
  { id: "11-12", label: "11–12" },
  { id: "12-1", label: "12–1" },
  { id: "1-plus", label: "1 or later" },
];

function SelectBox({
  label,
  selected,
  isFirst,
  onPress,
}: {
  label: string;
  selected: boolean;
  isFirst?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.option,
        isFirst && styles.optionFirst,
        selected && styles.optionSelected,
      ]}
    >
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function CheckIn() {
  const [feelingId, setFeelingId] = useState<string | null>(null);
  const [timeId, setTimeId] = useState<string | null>(null);

  const canContinue = useMemo(() => !!feelingId && !!timeId, [feelingId, timeId]);

  const feelingLabel = FEELINGS.find((f) => f.id === feelingId)?.label ?? "";
  const timeLabel = TIMES.find((t) => t.id === timeId)?.label ?? "";

  return (
    <Screen>
        <ScreenMascot size={140} style={{ marginBottom: 12 }} />
      <View style={styles.centerWrap}>
        <Text style={styles.title}>How do you feel right now?</Text>
        <Text style={styles.sub}>It’s okay to be awake.</Text>

        <View style={styles.grid}>
          <View style={styles.col}>
            <Text style={styles.colTitle}>Right now</Text>
            <View style={styles.card}>
              {FEELINGS.map((opt, idx) => (
                <SelectBox
                  key={opt.id}
                  label={opt.label}
                  selected={feelingId === opt.id}
                  isFirst={idx === 0}
                  onPress={() => setFeelingId(opt.id)}
                />
              ))}
            </View>
          </View>

          <View style={styles.col}>
            <Text style={styles.colTitle}>How late is it?</Text>
            <View style={styles.card}>
              {TIMES.map((opt, idx) => (
                <SelectBox
                  key={opt.id}
                  label={opt.label}
                  selected={timeId === opt.id}
                  isFirst={idx === 0}
                  onPress={() => setTimeId(opt.id)}
                />
              ))}
            </View>
          </View>
        </View>

        <View style={{ height: theme.space.l }} />

        <PrimaryButton
          label="Let it out"
          disabled={!canContinue}
          onPress={() =>
            router.push({
              pathname: "/brain-dump",
              params: {
                feelingId: feelingId ?? "",
                feelingLabel,
                timeId: timeId ?? "",
                timeLabel,
              },
            })
          }
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centerWrap: {
    flex: 1,
    justifyContent: "center",
  },

  title: {
    fontSize: theme.type.titleSize,
    lineHeight: theme.type.titleLine,
    fontWeight: "600",
    marginBottom: theme.space.s,
    color: theme.colors.text,
    textAlign: "center",
  },
  sub: {
    fontSize: theme.type.subSize,
    lineHeight: theme.type.subLine,
    opacity: 0.75,
    marginBottom: theme.space.l,
    color: theme.colors.text,
    textAlign: "center",
  },

  grid: {
    flexDirection: "row",
    gap: theme.space.m,
    alignSelf: "stretch",
  },
  col: {
    flex: 1,
  },
  colTitle: {
    fontSize: 14,
    opacity: 0.75,
    marginBottom: theme.space.s,
    color: theme.colors.text,
    fontWeight: "600",
    textAlign: "center",
  },

  card: {
    borderRadius: theme.radius.m,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
  },

  option: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  optionFirst: {
    borderTopWidth: 0,
  },
  optionSelected: {
    backgroundColor: theme.colors.selectionBg,
  },
  optionText: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: "center",
  },
  optionTextSelected: {
    fontWeight: "700",
  },
});


