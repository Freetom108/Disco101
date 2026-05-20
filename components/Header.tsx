import type { ModuleCode } from '../constants/products';
import type { AppPalette } from '../constants/themePalettes';
import { useAppTheme } from '../context/AppThemeContext';
import { useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

function unitNumberFromModuleCode(code: ModuleCode): number {
  switch (code) {
    case '101':
      return 1;
    case '102':
      return 2;
    case '103':
      return 3;
    case '104':
      return 4;
    default:
      return 1;
  }
}

type HeaderProps = {
  moduleCode: ModuleCode;
  chapterNumber: number;
};

export default function Header({ moduleCode, chapterNumber }: HeaderProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const subtitle = 'Einfach Englisch lernen';
  const unitN = unitNumberFromModuleCode(moduleCode);
  const learnLine = `Unit ${unitN} · Kapitel ${chapterNumber}`;

  return (
    <View style={styles.header}>
      <View style={styles.headerBrandBlock}>
        <View style={styles.headerLogoMask}>
          <Image
            source={require('../assets/images/disco-ball.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.headerBrand}>DISCO 101</Text>
        <Text style={styles.headerContext}>{subtitle}</Text>
        <Text style={styles.headerLearnLine}>{learnLine}</Text>
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
      paddingTop: 14,
      paddingBottom: 12,
      paddingHorizontal: 20,
    },
    headerBrandBlock: {
      alignItems: 'center',
      alignSelf: 'stretch',
    },
    headerBrand: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 3,
      color: '#999999',
      textAlign: 'center',
      marginTop: 4,
    },
    headerContext: {
      fontSize: 13,
      color: c.textMuted,
      fontWeight: '400',
      marginTop: 4,
      textAlign: 'center',
    },
    headerLearnLine: {
      fontSize: 13,
      color: c.textMuted,
      fontWeight: '400',
      textAlign: 'center',
      marginTop: 4,
    },
    headerLogoMask: {
      width: 44,
      height: 44,
      flexShrink: 0,
    },
    headerLogo: {
      width: '100%',
      height: '100%',
    },
  });
}
