import type { AppPalette } from '../constants/themePalettes';
import { useAppTheme } from '../context/AppThemeContext';
import { useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

type HeaderProps = {
  /** z. B. „Unit 1 Basics“ – aus aktiver Lern-Unit */
  subtitle: string;
};

export default function Header({ subtitle }: HeaderProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <View style={styles.headerTextCol}>
          <Text style={styles.headerLine1}>{"Hello, let's learn!"}</Text>
          <Text style={styles.headerLine2}>{subtitle}</Text>
        </View>
        <View style={styles.headerLogoMask}>
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </View>
      </View>
    </View>
  );
}

function createStyles(c: AppPalette) {
  return StyleSheet.create({
    header: {
      backgroundColor: c.headerBg,
      marginTop: 12,
      marginHorizontal: '3%',
      borderRadius: 16,
      overflow: 'hidden',
      paddingTop: 50,
      paddingBottom: 14,
      paddingHorizontal: 20,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    headerTextCol: {
      flex: 1,
      marginRight: 10,
    },
    headerLine1: {
      color: c.headerPrimaryText,
      fontSize: 26,
      fontWeight: '600',
      lineHeight: 32,
    },
    headerLine2: {
      color: c.headerSecondaryText,
      fontSize: 14,
      marginTop: 4,
      lineHeight: 20,
    },
    headerLogoMask: {
      width: 88,
      height: 88,
      flexShrink: 0,
    },
    headerLogo: {
      width: '100%',
      height: '100%',
    },
  });
}
