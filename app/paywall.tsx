import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import type { ModuleCode } from '../constants/products';
import { MODULE_PRODUCTS } from '../constants/products';
import {
  ACTIVE,
  BUTTON_TEXT,
  CARD_BG,
  FONT_DM_SERIF,
  HEADER_TEXT_SUB,
  SCREEN_BG,
} from '../constants/theme';

const PAYWALL_PRIMARY_RED = '#CF142B';

const COMING_SOON_TITLE = 'Hinweis';
const COMING_SOON_BODY =
  'Kommt bald – Zahlfunktion wird aktiviert sobald alle Module fertig sind.';

function showPurchasePlaceholder() {
  Alert.alert(COMING_SOON_TITLE, COMING_SOON_BODY);
}

function parseFocusModule(raw: unknown): ModuleCode | undefined {
  if (raw === '101' || raw === '102' || raw === '103' || raw === '104') {
    return raw;
  }
  return undefined;
}

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const params = useLocalSearchParams<{ focusModule?: string }>();
  const focusModule = parseFocusModule(params.focusModule);

  const [fontsLoaded] = useFonts({
    [FONT_DM_SERIF]: require('../assets/fonts/DMSerifDisplay-Regular.ttf'),
  });

  const horizontalPad = Math.max(16, windowWidth * 0.03);
  const gridGap = 10;
  const gridInnerWidth = windowWidth - horizontalPad * 2;
  const tileWidth = (gridInnerWidth - gridGap) / 2;

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  if (!fontsLoaded) {
    return <View style={[styles.root, { backgroundColor: SCREEN_BG }]} />;
  }

  return (
    <View style={[styles.root, { backgroundColor: SCREEN_BG }]}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View
          style={[
            styles.closeRow,
            { paddingRight: horizontalPad, paddingTop: 4 },
          ]}
        >
          <View style={styles.closeRowSpacer} />
          <Pressable
            onPress={close}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Schließen"
            style={({ pressed }) => [
              styles.closeBtn,
              pressed && { opacity: 0.75 },
            ]}
          >
            <Ionicons name="close" size={28} color="#1A1A1A" />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: horizontalPad,
              paddingBottom: 24 + insets.bottom,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <Image
              source={require('../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={[styles.title, { fontFamily: FONT_DM_SERIF }]}>
              Schalte alles frei 🔓
            </Text>
            <Text style={styles.subtitle}>Einmalige Zahlung – kein Abo</Text>
          </View>

          <View style={styles.gratisCard}>
            <Text style={styles.gratisTitle}>Immer gratis</Text>
            <Text style={styles.gratisLine}>✅ Kapitel 1</Text>
            <Text style={[styles.gratisLine, styles.gratisLineLast]}>
              ✅ Tests zu Kapitel 1
            </Text>
          </View>

          <View style={[styles.moduleGrid, { width: gridInnerWidth }]}>
            {MODULE_PRODUCTS.map((m, index) => {
              const highlighted = focusModule === m.code;
              return (
                <Pressable
                  key={m.code}
                  onPress={showPurchasePlaceholder}
                  style={({ pressed }) => [
                    styles.moduleTile,
                    {
                      width: tileWidth,
                      marginRight: index % 2 === 0 ? gridGap : 0,
                      marginBottom: index < 2 ? gridGap : 0,
                    },
                    highlighted && styles.moduleTileHighlight,
                    pressed && { opacity: 0.92 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${m.title} ${m.subtitle} kaufen`}
                >
                  <View>
                    <Text style={styles.moduleTileTitle} numberOfLines={3}>
                      {`${m.title}\n${m.subtitle} · ${m.priceLabel}`}
                    </Text>
                    <Text style={styles.moduleTilePaymentHint}>Einmalzahlung</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.ctaSection}>
            <Pressable
              onPress={showPurchasePlaceholder}
              style={({ pressed }) => [
                styles.singleBtn,
                pressed && { opacity: 0.9 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Nur dieses Modul kaufen"
            >
              <Text style={styles.singleBtnText}>Nur dieses Modul – 9,99 €</Text>
            </Pressable>
            <Text style={styles.ctaSubcaption}>Einmalzahlung</Text>
          </View>

          <View style={[styles.ctaSection, styles.ctaSectionBelow]}>
            <Pressable
              onPress={showPurchasePlaceholder}
              style={({ pressed }) => [
                styles.bundleBtn,
                pressed && { opacity: 0.92 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Alle vier Module kaufen"
            >
              <Text style={styles.bundleBtnText}>Alle vier Module – 34,99 €</Text>
            </Pressable>
            <Text style={styles.ctaSubcaption}>
              Einmalzahlung · Du sparst 5,- €
            </Text>
          </View>

          <Pressable
            onPress={showPurchasePlaceholder}
            style={({ pressed }) => [
              styles.restoreLink,
              pressed && { opacity: 0.75 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Käufe wiederherstellen"
          >
            <Text style={styles.restoreLinkText}>Käufe wiederherstellen</Text>
          </Pressable>

          <Text style={styles.footerLegal}>
            Einmalige Zahlung – kein Abo · Datenschutz · AGB
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  closeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  closeRowSpacer: {
    flex: 1,
  },
  closeBtn: {
    padding: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 4,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 96,
    height: 96,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: HEADER_TEXT_SUB,
    textAlign: 'center',
  },
  gratisCard: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  gratisTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555555',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  gratisLine: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1A1A1A',
    marginBottom: 6,
  },
  gratisLineLast: {
    marginBottom: 0,
  },
  moduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignSelf: 'center',
    marginBottom: 28,
  },
  moduleTile: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 14,
    minHeight: 128,
    justifyContent: 'flex-start',
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
  moduleTileHighlight: {
    borderColor: ACTIVE,
    borderWidth: 2,
  },
  moduleTileTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    lineHeight: 19,
  },
  moduleTilePaymentHint: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    color: '#A0A0A0',
  },
  ctaSection: {
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  ctaSectionBelow: {
    marginTop: 14,
  },
  ctaSubcaption: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 16,
    color: '#A0A0A0',
    textAlign: 'center',
  },
  bundleBtn: {
    alignSelf: 'stretch',
    backgroundColor: PAYWALL_PRIMARY_RED,
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  bundleBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: BUTTON_TEXT,
    textAlign: 'center',
  },
  singleBtn: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  singleBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  restoreLink: {
    alignSelf: 'center',
    marginTop: 28,
    paddingVertical: 8,
  },
  restoreLinkText: {
    fontSize: 15,
    fontWeight: '600',
    color: ACTIVE,
    textDecorationLine: 'underline',
  },
  footerLegal: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 17,
    color: '#A0A0A0',
    textAlign: 'center',
  },
});
