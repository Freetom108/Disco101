import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import type { ModuleCode } from '../constants/products';
import { MODULE_PRODUCTS } from '../constants/products';
import type { AppPalette } from '../constants/themePalettes';
import { STRINGS } from '../constants/strings';
import { FONT_DM_SERIF } from '../constants/theme';
import { useAppTheme } from '../context/AppThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases from 'react-native-purchases';
import {
  PURCHASE_ALL_UNITS,
  PURCHASE_UNIT_1,
  PURCHASE_UNIT_2,
  PURCHASE_UNIT_3,
  PURCHASE_UNIT_4,
} from '../constants/chapterUnlock';

async function purchaseProduct(productId: string, router: ReturnType<typeof useRouter>) {
  try {
    const offerings = await Purchases.getOfferings();
    const allPackages = offerings.current?.availablePackages ?? [];
    const pkg = allPackages.find((p) => p.product.identifier === productId);
    if (!pkg) {
      Alert.alert('Fehler', 'Produkt nicht gefunden.');
      return;
    }
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const entitlements = customerInfo.entitlements.active;
    const pairs: [string, string][] = [];
    if (entitlements['all_units']) {
      pairs.push([PURCHASE_ALL_UNITS, 'true']);
      pairs.push([PURCHASE_UNIT_1, 'true']);
      pairs.push([PURCHASE_UNIT_2, 'true']);
      pairs.push([PURCHASE_UNIT_3, 'true']);
      pairs.push([PURCHASE_UNIT_4, 'true']);
    } else {
      if (entitlements['unit_1']) pairs.push([PURCHASE_UNIT_1, 'true']);
      if (entitlements['unit_2']) pairs.push([PURCHASE_UNIT_2, 'true']);
      if (entitlements['unit_3']) pairs.push([PURCHASE_UNIT_3, 'true']);
      if (entitlements['unit_4']) pairs.push([PURCHASE_UNIT_4, 'true']);
    }
    if (pairs.length > 0) await AsyncStorage.multiSet(pairs);
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  } catch (e: any) {
    if (e?.code !== 'PURCHASE_CANCELLED') {
      Alert.alert('Fehler', 'Kauf fehlgeschlagen. Bitte versuche es erneut.');
    }
  }
}

async function restoreFromPaywall() {
  try {
    const customerInfo = await Purchases.restorePurchases();
    const entitlements = customerInfo.entitlements.active;
    const pairs: [string, string][] = [];
    if (entitlements['all_units']) {
      pairs.push([PURCHASE_ALL_UNITS, 'true']);
      pairs.push([PURCHASE_UNIT_1, 'true']);
      pairs.push([PURCHASE_UNIT_2, 'true']);
      pairs.push([PURCHASE_UNIT_3, 'true']);
      pairs.push([PURCHASE_UNIT_4, 'true']);
    } else {
      if (entitlements['unit_1']) pairs.push([PURCHASE_UNIT_1, 'true']);
      if (entitlements['unit_2']) pairs.push([PURCHASE_UNIT_2, 'true']);
      if (entitlements['unit_3']) pairs.push([PURCHASE_UNIT_3, 'true']);
      if (entitlements['unit_4']) pairs.push([PURCHASE_UNIT_4, 'true']);
    }
    if (pairs.length > 0) {
      await AsyncStorage.multiSet(pairs);
      Alert.alert('Käufe wiederhergestellt', 'Deine Käufe wurden erfolgreich wiederhergestellt.');
    } else {
      Alert.alert('Keine Käufe gefunden', 'Es wurden keine früheren Käufe gefunden.');
    }
  } catch {
    Alert.alert('Fehler', 'Wiederherstellung fehlgeschlagen.');
  }
}

function parseFocusModule(raw: unknown): ModuleCode | undefined {
  if (raw === '101' || raw === '102' || raw === '103' || raw === '104') {
    return raw;
  }
  return undefined;
}

export default function PaywallScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createPaywallStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const params = useLocalSearchParams<{ focusModule?: string }>();
  const focusModule = parseFocusModule(params.focusModule);
  const [selectedModule, setSelectedModule] = useState<string | null>(
    focusModule ? `purchase_unit_${focusModule.slice(-1)}` : 'purchase_unit_1',
  );

  const [prices, setPrices] = useState<Record<string, string>>({});

  useEffect(() => {
    void (async () => {
      try {
        const offerings = await Purchases.getOfferings();
        const allPackages = offerings.current?.availablePackages ?? [];
        const map: Record<string, string> = {};
        for (const pkg of allPackages) {
          map[pkg.product.identifier] = pkg.product.priceString;
        }
        setPrices(map);
      } catch {
        // Fallback: leer lassen, dann zeigen wir nichts
      }
    })();
  }, []);

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
    return <View style={styles.root} />;
  }

  return (
    <View style={styles.root}>
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
            accessibilityLabel={STRINGS.paywallCloseA11y}
            style={({ pressed }) => [
              styles.closeBtn,
              pressed && { opacity: 0.75 },
            ]}
          >
            <Ionicons name="close" size={28} color={colors.textPrimary} />
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
            <Text style={[styles.title, { fontFamily: FONT_DM_SERIF }]}>
              {STRINGS.paywallHeroTitle}
            </Text>
          </View>

          <View style={[styles.moduleGrid, { width: gridInnerWidth }]}>
            {MODULE_PRODUCTS.map((m, index) => {
              const highlighted = m.productId === selectedModule;
              return (
                <Pressable
                  key={m.code}
                  onPress={() => setSelectedModule(m.productId)}
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
                  accessibilityLabel={`${m.title} ${STRINGS.paywallBuyVerb}`}
                >
                  <View>
                    <Text style={styles.moduleTileBold} numberOfLines={1}>
                      {m.title}
                    </Text>
                    <Text style={[styles.moduleTileMuted, styles.moduleTileMutedGap]}>
                      {STRINGS.paywallTilePhrasesCount}
                    </Text>
                    <Text style={[styles.moduleTileMuted, styles.moduleTileMutedGapTight]}>
                      {STRINGS.paywallTileChaptersCount}
                    </Text>
                    <Text style={[styles.moduleTileMuted, styles.moduleTileMutedGapTight]}>
                      {STRINGS.paywallTileChapterOneFree}
                    </Text>
                    <Text style={[styles.moduleTileBold, styles.moduleTilePriceGap]}>
                      {prices[m.productId] ?? '...'}
                    </Text>
                    <Text style={[styles.moduleTileMuted, styles.moduleTileEinmalGap]}>
                      {STRINGS.paywallTileOneTimePayment}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.ctaSection}>
            <Pressable
              onPress={() => void purchaseProduct(selectedModule ?? 'purchase_unit_1', router)}
              style={({ pressed }) => [
                styles.singleBtn,
                pressed && { opacity: 0.9 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={STRINGS.paywallSingleUnitA11y}
            >
              <Text style={styles.singleBtnText}>
                {`${STRINGS.paywallSingleUnitCta} – ${prices[selectedModule ?? 'purchase_unit_1'] ?? '...'}`}
              </Text>
            </Pressable>
            <Text style={styles.ctaSubcaption}>
              {STRINGS.paywallSingleUnitSubcaption}
            </Text>
          </View>

          <View style={[styles.ctaSection, styles.ctaSectionBelow]}>
            <Pressable
              onPress={() => void purchaseProduct('purchase_all_units', router)}
              style={({ pressed }) => [
                styles.bundleBtn,
                pressed && { opacity: 0.92 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={STRINGS.paywallBundleA11y}
            >
              <Text style={styles.bundleBtnText}>{STRINGS.paywallBundleCta}</Text>
            </Pressable>
            <Text style={styles.ctaSubcaption}>
              {STRINGS.paywallBundleSubcaption}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.footerRestore}
            activeOpacity={0.75}
            onPress={() => void restoreFromPaywall()}
            accessibilityRole="button"
            accessibilityLabel={STRINGS.restorePurchases}
          >
            <Text style={styles.footerRestoreText}>{STRINGS.restorePurchases}</Text>
          </TouchableOpacity>

          <View style={styles.footerLinksRow}>
            <TouchableOpacity
              style={styles.footerLink}
              activeOpacity={0.75}
              accessibilityRole="link"
              accessibilityLabel={STRINGS.privacyPolicy}
              onPress={() =>
                void Linking.openURL(STRINGS.urlPrivacy)
              }
            >
              <Text style={styles.footerLinkText}>{STRINGS.privacyPolicy}</Text>
            </TouchableOpacity>
            <Text style={styles.footerDot}>{STRINGS.footerDotSeparator}</Text>
            <TouchableOpacity
              style={styles.footerLink}
              activeOpacity={0.75}
              accessibilityRole="link"
              accessibilityLabel={STRINGS.termsShort}
              onPress={() =>
                void Linking.openURL(STRINGS.urlTerms)
              }
            >
              <Text style={styles.footerLinkText}>{STRINGS.termsShort}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function createPaywallStyles(c: AppPalette) {
  return StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: c.screenBg,
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
    paddingTop: 16,
  },
  hero: {
    alignItems: 'center',
    marginTop: -4,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '600',
    color: c.textPrimary,
    textAlign: 'center',
  },
  moduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignSelf: 'center',
    marginBottom: 28,
  },
  moduleTile: {
    backgroundColor: c.cardBg,
    borderRadius: 14,
    padding: 14,
    minHeight: 188,
    justifyContent: 'flex-start',
    elevation: 2,
    shadowColor: c.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
  },
  moduleTileHighlight: {
    borderColor: c.accentBlue,
    borderWidth: 2,
  },
  moduleTileBold: {
    fontSize: 14,
    fontWeight: '700',
    color: c.textPrimary,
    lineHeight: 19,
  },
  moduleTileMuted: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    color: c.textMuted,
  },
  moduleTileMutedGap: {
    marginTop: 5,
  },
  moduleTileMutedGapTight: {
    marginTop: 3,
  },
  moduleTilePriceGap: {
    marginTop: 8,
  },
  moduleTileEinmalGap: {
    marginTop: 6,
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
    color: c.textMuted,
    textAlign: 'center',
  },
  bundleBtn: {
    alignSelf: 'stretch',
    backgroundColor: c.accentRed,
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
    color: c.buttonOnAccent,
    textAlign: 'center',
  },
  singleBtn: {
    alignSelf: 'stretch',
    backgroundColor: c.outlineButtonBg,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.outlineButtonBorder,
  },
  singleBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: c.textPrimary,
  },
  footerRestore: {
    alignSelf: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  footerRestoreText: {
    fontSize: 15,
    fontWeight: '600',
    color: c.accentBlue,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  footerLinksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 12,
    marginBottom: 32,
  },
  footerLink: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  footerLinkText: {
    fontSize: 12,
    color: c.accentBlue,
    textDecorationLine: 'underline',
  },
  footerDot: {
    fontSize: 12,
    color: c.textMuted,
  },
});
}
