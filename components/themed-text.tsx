import { StyleSheet, Text, type TextProps } from 'react-native';

import { colors, type } from '../constants/design';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'small';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const hasExplicitColor = lightColor !== undefined || darkColor !== undefined;
  const color = hasExplicitColor
    ? useThemeColor({ light: lightColor, dark: darkColor }, 'text')
    : undefined;

  return (
    <Text
      style={[
        color ? { color } : undefined,
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'small' ? styles.small : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    ...type.body,
    color: colors.text0,
  },
  defaultSemiBold: {
    ...type.body,
    fontWeight: '600',
    color: colors.text0,
  },
  title: {
    ...type.h1,
    color: colors.text0,
  },
  subtitle: {
    ...type.h2,
    color: colors.text0,
  },
  small: {
    ...type.small,
    color: colors.text1,
  },
  link: {
    ...type.body,
    color: colors.text1,
  },
});
