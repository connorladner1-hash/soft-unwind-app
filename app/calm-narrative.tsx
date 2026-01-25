import { ScreenMascot } from "@/components/ScreenMascot";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { theme } from "../constants/theme";

export default function CalmNarrative() {
  const params = useLocalSearchParams<{
    userState?: string
    dump?: string;
    reflection?: string;
    feelingLabel?: string;
    timeLabel?: string;
  }>();

  const dump = (params.dump ?? "").toString();
  const reflection = (params.reflection ?? "").toString();
  const feelingLabel = (params.feelingLabel ?? "").toString();
  const timeLabel = (params.timeLabel ?? "").toString();
  const userState = (params.userState ?? "").toString();

  return (
    <Screen style={{ justifyContent: "center" }}>
        <ScreenMascot size={160} style={{ marginBottom: 16 }} />
      <Text style={styles.title}>You can let today be incomplete.</Text>

      <View style={styles.card}>
        <Text style={styles.paragraph}>
          Tonight isn’t for figuring everything out.
        </Text>
        <Text style={styles.paragraph}>
          You already showed up. You already carried a lot.
        </Text>
        <Text style={styles.paragraph}>
          Whatever didn’t get solved can wait for a version of you that’s rested.
        </Text>
        <Text style={styles.paragraph}>
          Right now, your only job is to soften. To slow down. To come back to your body.
        </Text>
      </View>

      <PrimaryButton
        label="I’m ready"
        onPress={() =>
          router.push({
            pathname: "/breathe",
            params: { userState, dump, reflection, feelingLabel, timeLabel },
          })
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: theme.type.titleSize,
    lineHeight: theme.type.titleLine,
    fontWeight: "600",
    marginBottom: theme.space.m,
    color: theme.colors.text,
  },
  card: {
    borderRadius: theme.radius.m,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.space.m,
    marginBottom: theme.space.l,
  },
  paragraph: {
    fontSize: theme.type.bodySize,
    lineHeight: theme.type.bodyLine,
    color: theme.colors.text,
    opacity: 0.85,
    marginBottom: theme.space.s,
  },
});

