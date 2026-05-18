import type { AppPalette } from '../constants/themePalettes';
import { useAppTheme } from '../context/AppThemeContext';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function PlaceholderScreen({ name }: { name: string }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>{name}</Text>
    </View>
  );
}

function createStyles(c: AppPalette) {
  return StyleSheet.create({
    placeholder: {
      flex: 1,
      backgroundColor: c.screenBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    placeholderText: {
      fontSize: 24,
      fontWeight: '600',
      color: c.accentBlue,
    },
  });
}
