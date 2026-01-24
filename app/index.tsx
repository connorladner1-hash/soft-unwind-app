import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { theme } from "../constants/theme";

export default function Welcome() {
  return (
    <Screen style={{ justifyContent: "center" }}>
      <View style={styles.container}>
        <Text style={styles.title}>
          Can’t sleep because your brain won’t shut up?
        </Text>

        <PrimaryButton
          label="Start tonight’s wind down"
          onPress={() => router.push("/value")}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.space.l,
  },
  title: {
    fontSize: theme.type.titleSize,
    lineHeight: theme.type.titleLine,
    fontWeight: "600",
    textAlign: "center",
    color: theme.colors.text,
  },
});

