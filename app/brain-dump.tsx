import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { ScreenMascot } from "../components/ScreenMascot";
import { theme } from "../constants/theme";

export default function BrainDump() {
  const params = useLocalSearchParams<{
    userState?: string;
    feelingId?: string;
    feelingLabel?: string;
    timeId?: string;
    timeLabel?: string;
  }>();

  const feelingId = (params.feelingId ?? "").toString();
  const feelingLabel = (params.feelingLabel ?? "").toString();
  const timeId = (params.timeId ?? "").toString();
  const timeLabel = (params.timeLabel ?? "").toString();
  const userState = (params.userState ?? "").toString();

  const [text, setText] = useState("");
  const canContinue = useMemo(() => text.trim().length > 0, [text]);

  const onContinue = () => {
    const dump = text.trim();

    router.push({
      pathname: "/reflection",
      params: {
        dump,

        // 👇 forward these so later screens (breathe.tsx) know what was selected
        feelingId,
        feelingLabel,
        timeId,
        timeLabel,
        userState,
      },
    });
  };

  return (
    <Screen style={{ justifyContent: "flex-start", padding: 0 }}>
      <ScreenMascot size={140} style={{ marginBottom: 12 }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <Text style={styles.title}>Let it out.</Text>
          <Text style={styles.sub}>No formatting. No judgment.</Text>

          {feelingLabel || timeLabel ? (
            <View style={styles.metaRow}>
              {!!feelingLabel && (
                <Text style={styles.metaPill}>{feelingLabel}</Text>
              )}
              {!!timeLabel && <Text style={styles.metaPill}>{timeLabel}</Text>}
            </View>
          ) : null}

          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Write whatever your mind is holding…"
            placeholderTextColor={theme.colors.placeholder ?? "rgba(28,28,30,0.45)"}
            multiline
            textAlignVertical="top"
            style={styles.input}
          />

          <PrimaryButton
            label="Continue"
            onPress={onContinue}
            disabled={!canContinue}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: theme.space.xl,
    paddingBottom: theme.space.xl,
  },
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
    marginBottom: theme.space.m,
    color: theme.colors.text,
  },
  metaRow: {
    flexDirection: "row",
    gap: theme.space.s,
    marginBottom: theme.space.m,
  },
  metaPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
    overflow: "hidden",
    fontWeight: "600",
  },
  input: {
    minHeight: 320,
    borderRadius: theme.radius.m,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.space.m,
    fontSize: 16,
    lineHeight: 22,
    color: theme.colors.text,
    marginBottom: theme.space.l,
  },
});






