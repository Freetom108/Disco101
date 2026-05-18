import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ModuleCode } from '../../constants/products';
import { setActiveLearningModule } from '../../constants/activeLearningModule';
import type { AppPalette } from '../../constants/themePalettes';
import { useAppTheme } from '../../context/AppThemeContext';

type ModuleTileConfig = {
  code: ModuleCode;
  title: string;
  body: string;
  buttonLabel: string;
};

const MODULE_TILES: ModuleTileConfig[] = [
  {
    code: '101',
    title: '🔓 Unit 1 Basics',
    body:
      '101 Redewendungen in 7 Kapiteln – die wichtigsten englischen Phrasen für deinen Alltag. Von der Begrüßung bis zum Small Talk.',
    buttonLabel: 'Freischalten – 5,99 €',
  },
  {
    code: '102',
    title: '🔒 Unit 2 Urlaub',
    body:
      '101 Redewendungen in 7 Kapiteln – erweiterter Wortschatz für deinen Urlaub. Strand, Hotel, Restaurant und mehr.',
    buttonLabel: '🔓 Freischalten – 5,99 €',
  },
  {
    code: '103',
    title: '🔒 Unit 3 Job',
    body:
      '101 Redewendungen in 7 Kapiteln – alles was du für den englischen Berufsalltag brauchst. Meetings, Präsentationen und Geschäftsreisen.',
    buttonLabel: '🔓 Freischalten – 5,99 €',
  },
  {
    code: '104',
    title: '🔒 Unit 4 Expat',
    body:
      '101 Redewendungen in 7 Kapiteln – für alle die im englischsprachigen Ausland leben. Behörden, Arzt, Versicherungen und Alltagsleben.',
    buttonLabel: '🔓 Freischalten – 5,99 €',
  },
];

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createMoreStyles(colors), [colors]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.screenBg }]}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextCol}>
            <Text style={styles.headerLine1}>More</Text>
            <Text style={styles.headerLine2}>Erweitere deinen Wortschatz</Text>
          </View>
          <View style={styles.headerLogoMask}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 90 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {MODULE_TILES.map((m) => (
          <View key={m.code} style={styles.tile}>
            <Text style={styles.tileTitle}>{m.title}</Text>
            <Text style={styles.tileBody}>{m.body}</Text>
            <Pressable
              onPress={() => {
                void setActiveLearningModule(m.code);
                router.push({
                  pathname: '/paywall',
                  params: { focusModule: m.code },
                });
              }}
              style={({ pressed }) => [
                styles.unlockBtn,
                pressed && { opacity: 0.92 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Freischalten ${m.title}`}
            >
              <Text style={styles.unlockBtnText}>{m.buttonLabel}</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function createMoreStyles(c: AppPalette) {
  return StyleSheet.create({
    screen: {
      flex: 1,
    },
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
      width: 56,
      height: 56,
      borderRadius: 16,
      overflow: 'hidden',
      flexShrink: 0,
    },
    headerLogo: {
      width: '100%',
      height: '100%',
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingTop: 16,
      paddingHorizontal: '3%',
    },
    tile: {
      backgroundColor: c.cardBg,
      borderRadius: 12,
      marginBottom: 12,
      padding: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.chapterTileBorder,
      ...Platform.select({
        android: { elevation: 2 },
        ios: {
          shadowColor: c.shadowColor,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: c.scheme === 'dark' ? 0.25 : 0.06,
          shadowRadius: 3,
        },
      }),
    },
    tileTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: c.textPrimary,
      marginBottom: 8,
    },
    tileBody: {
      fontSize: 15,
      lineHeight: 22,
      color: c.textSecondary,
    },
    unlockBtn: {
      marginTop: 14,
      alignSelf: 'stretch',
      backgroundColor: c.accentRed,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44,
    },
    unlockBtnText: {
      fontSize: 15,
      fontWeight: '700',
      color: c.buttonOnAccent,
    },
  });
}
