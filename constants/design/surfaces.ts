import { colors } from "./colors";
import { shadow } from "./shadows";

export const surfaces = {
  glass: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glass,
    ...shadow.glow,
  },
};
