import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Alert,
  Linking,
  Platform,
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

function showPurchasePlaceholder() {
  Alert.alert(STRINGS.paywallComingSoonTitle, STRINGS.paywallComingSoonBody);
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

          <View style={styles.infoBox}>
            <Text style={styles.infoBoxParagraph}>
              {STRINGS.paywallInfoParagraph}
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
                      {m.priceLabel}
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
              onPress={showPurchasePlaceholder}
              style={({ pressed }) => [
                styles.singleBtn,
                pressed && { opacity: 0.9 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={STRINGS.paywallSingleUnitA11y}
            >
              <Text style={styles.singleBtnText}>{STRINGS.paywallSingleUnitCta}</Text>
            </Pressable>
            <Text style={styles.ctaSubcaption}>
              {STRINGS.paywallSingleUnitSubcaption}
            </Text>
          </View>

          <View style={[styles.ctaSection, styles.ctaSectionBelow]}>
            <Pressable
              onPress={showPurchasePlaceholder}
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
            onPress={showPurchasePlaceholder}
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
    paddingTop: 4,
  },
  hero: {
    alignItems: 'center',
    marginTop: -4,
    marginBottom: 0,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '600',
    color: c.textPrimary,
    textAlign: 'center',
  },
  infoBox: {
    alignSelf: 'stretch',
    marginTop: 14,
    marginBottom: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: c.categoryPillBg,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.borderHairline,
  },
  infoBoxParagraph: {
    fontSize: 14,
    lineHeight: 21,
    color: c.textSecondary,
    textAlign: 'left',
  },
  moduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignSelf: 'center',
    marginBottom: 28,
  },
  moduleTile: {
    backgroundColor: c.cardBg,
    borderRadius: 12,
    padding: 14,
    minHeight: 188,
    justifyContent: 'flex-start',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.borderHairline,
    ...Platform.select({
      android: { elevation: 2 },
      ios: {
        shadowColor: c.shadowColor,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
      },
    }),
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
