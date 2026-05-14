import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ModuleCode } from '../../constants/products';
import {
  BUTTON_TEXT,
  CARD_BG,
  CARD_DE,
  HEADER_DARK,
  HEADER_TEXT_SUB,
  INACTIVE,
  SCREEN_BG,
} from '../../constants/theme';

const UNLOCK_RED = '#CF142B';

type ModuleTileConfig = {
  code: ModuleCode;
  title: string;
  body: string;
};

const MODULE_TILES: ModuleTileConfig[] = [
  {
    code: '102',
    title: '🔒 Disco 102',
    body:
      '102 Redewendungen in 7 Kapiteln – erweiterter Wortschatz für deinen Urlaub. Strand, Hotel, Restaurant und mehr.',
  },
  {
    code: '103',
    title: '🔒 Disco 103 – Job',
    body:
      '103 Redewendungen in 7 Kapiteln – alles was du für den englischen Berufsalltag brauchst. Meetings, Präsentationen und Geschäftsreisen.',
  },
  {
    code: '104',
    title: '🔒 Disco 104 – Expats',
    body:
      '104 Redewendungen in 7 Kapiteln – für alle die im englischsprachigen Ausland leben. Behörden, Arzt, Versicherungen und Alltagsleben.',
  },
];

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.screen, { backgroundColor: SCREEN_BG }]}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextCol}>
            <Text style={styles.headerLine1}>More</Text>
            <Text style={styles.headerLine2}>Erweitere dein Englisch</Text>
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
              onPress={() =>
                router.push({
                  pathname: '/paywall',
                  params: { focusModule: m.code },
                })
              }
              style={({ pressed }) => [
                styles.unlockBtn,
                pressed && { opacity: 0.92 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Freischalten ${m.title}`}
            >
              <Text style={styles.unlockBtnText}>🔓 Freischalten – 9,99 €</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    backgroundColor: HEADER_DARK,
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
    color: INACTIVE,
    fontSize: 26,
    fontWeight: '600',
    lineHeight: 32,
  },
  headerLine2: {
    color: HEADER_TEXT_SUB,
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
    backgroundColor: CARD_BG,
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    ...Platform.select({
      android: { elevation: 2 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
      },
    }),
  },
  tileTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  tileBody: {
    fontSize: 15,
    lineHeight: 22,
    color: CARD_DE,
  },
  unlockBtn: {
    marginTop: 14,
    alignSelf: 'stretch',
    backgroundColor: UNLOCK_RED,
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
    color: BUTTON_TEXT,
  },
});
