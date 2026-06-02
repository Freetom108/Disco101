import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import Constants from 'expo-constants';
import * as StoreReview from 'expo-store-review';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Purchases from 'react-native-purchases';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AUDIO_REPEAT_KEY,
  AUDIO_SPEED_KEY,
  type AudioRepeatStored,
  type AudioSpeedStored,
  DEFAULT_AUDIO_REPEAT,
  DEFAULT_AUDIO_SPEED,
  parseAudioRepeat,
  parseAudioSpeed,
} from '../../constants/audioSettingsStorage';
import type { ModuleCode } from '../../constants/products';
import type { AppPalette } from '../../constants/themePalettes';
import {
  INITIAL_MODULE_PURCHASE_STATE,
  loadModulePurchaseState,
  restorePurchases,
  type ModulePurchaseState,
} from '../../constants/chapterUnlock';
import { STRINGS } from '../../constants/strings';
import { useAppTheme } from '../../context/AppThemeContext';

const DISPLAY_OPTIONS = [
  { value: 'light' as const, label: STRINGS.displayLight },
  { value: 'auto' as const, label: STRINGS.displayAuto },
  { value: 'dark' as const, label: STRINGS.displayDark },
];

const SPEED_OPTIONS: AudioSpeedStored[] = ['0.7', '0.8', '0.9'];
/** Nur UI-Text; gespeicherte Werte / audioSpeedToRate bleiben 0.7 / 0.8 / 0.9 */
const SPEED_DISPLAY_LABELS: Record<AudioSpeedStored, string> = {
  '0.7': STRINGS.speedDisplay070,
  '0.8': STRINGS.speedDisplay080,
  '0.9': STRINGS.speedDisplay090,
};
const REPEAT_OPTIONS: AudioRepeatStored[] = ['1', '2'];

type FaqAccordionItem = {
  id: string;
  question: string;
  answer: string;
};

const FAQ_ACCORDION_ITEMS: FaqAccordionItem[] = [
  {
    id: 'offline',
    question: STRINGS.faqOfflineQuestion,
    answer: STRINGS.faqOfflineAnswer,
  },
  {
    id: 'unit101',
    question: STRINGS.faqUnit101Question,
    answer: STRINGS.faqUnit101Answer,
  },
  {
    id: 'unit102',
    question: STRINGS.faqUnit102Question,
    answer: STRINGS.faqUnit102Answer,
  },
  {
    id: 'unit103',
    question: STRINGS.faqUnit103Question,
    answer: STRINGS.faqUnit103Answer,
  },
  {
    id: 'unit104',
    question: STRINGS.faqUnit104Question,
    answer: STRINGS.faqUnit104Answer,
  },
  {
    id: 'restore',
    question: STRINGS.faqRestoreQuestion,
    answer: STRINGS.faqRestoreAnswer,
  },
  {
    id: 'userid',
    question: 'Was ist meine User ID?',
    answer: 'Deine User ID ist ein eindeutiger Bezeichner für dein Konto. Wenn du den Support kontaktierst, werden wir möglicherweise danach fragen. Du findest sie in den Einstellungen unter Support & Feedback – tippe darauf um sie zu kopieren.',
  },
];

const MODULE_CODES_ORDER: ModuleCode[] = ['101', '102', '103', '104'];

function purchaseStatusLabel(state: ModulePurchaseState): string {
  if (state.allUnitsUnlocked) return 'Alle Units';
  const unlocked = MODULE_CODES_ORDER.filter((m) => state.units[m]);
  if (unlocked.length >= 4) return 'Alle Units';
  if (unlocked.length === 0) return 'Gratis';
  return `Unit ${unlocked.map((m) => m.slice(-1)).join(' · ')}`;
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, preference, setPreference } = useAppTheme();
  const styles = useMemo(() => createSettingsStyles(colors), [colors]);
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const [audioSpeed, setAudioSpeed] = useState<AudioSpeedStored>(
    DEFAULT_AUDIO_SPEED,
  );
  const [audioRepeat, setAudioRepeat] = useState<AudioRepeatStored>(
    DEFAULT_AUDIO_REPEAT,
  );
  const [faqOpenId, setFaqOpenId] = useState<string | null>(null);
  const [purchaseState, setPurchaseState] = useState<ModulePurchaseState>(
    INITIAL_MODULE_PURCHASE_STATE,
  );
  const [appUserId, setAppUserId] = useState<string>('...');

  const toggleFaq = useCallback((id: string) => {
    setFaqOpenId((prev) => (prev === id ? null : id));
  }, []);

  const purchaseStatusText = useMemo(
    () => purchaseStatusLabel(purchaseState),
    [purchaseState],
  );

  const loadAudioSettings = useCallback(async () => {
    try {
      const [speedRaw, repeatRaw] = await Promise.all([
        AsyncStorage.getItem(AUDIO_SPEED_KEY),
        AsyncStorage.getItem(AUDIO_REPEAT_KEY),
      ]);
      setAudioSpeed(parseAudioSpeed(speedRaw));
      setAudioRepeat(parseAudioRepeat(repeatRaw));
    } catch {
      setAudioSpeed(DEFAULT_AUDIO_SPEED);
      setAudioRepeat(DEFAULT_AUDIO_REPEAT);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadAudioSettings();
      void loadModulePurchaseState().then(setPurchaseState);
      void Purchases.getAppUserID().then((id) => setAppUserId(id)).catch(() => setAppUserId('n/a'));
    }, [loadAudioSettings]),
  );

  const persistSpeed = async (value: AudioSpeedStored) => {
    setAudioSpeed(value);
    try {
      await AsyncStorage.setItem(AUDIO_SPEED_KEY, value);
    } catch {
      /* ignore */
    }
  };

  const persistRepeat = async (value: AudioRepeatStored) => {
    setAudioRepeat(value);
    try {
      await AsyncStorage.setItem(AUDIO_REPEAT_KEY, value);
    } catch {
      /* ignore */
    }
  };

  const openExternalUrl = useCallback((url: string) => {
    void Linking.openURL(url).catch(() => {
      /* ignore */
    });
  }, []);

  const wipeAllAppData = useCallback(async () => {
    try {
      await AsyncStorage.clear();
      router.replace('/onboarding');
    } catch {
      Alert.alert(
        STRINGS.alertErrorTitle,
        STRINGS.alertWipeFailed,
      );
    }
  }, [router]);

  const confirmWipeAllData = useCallback(() => {
    Alert.alert(
      STRINGS.alertWipeConfirmTitle,
      STRINGS.alertWipeConfirmBody,
      [
        { text: STRINGS.alertCancel, style: 'cancel' },
        {
          text: STRINGS.alertDelete,
          style: 'destructive',
          onPress: () => void wipeAllAppData(),
        },
      ],
    );
  }, [wipeAllAppData]);

  const handleRestorePurchases = useCallback(() => {
    void (async () => {
      const result = await restorePurchases();
      Alert.alert(
        result === 'restored'
          ? STRINGS.restoreSuccessTitle
          : STRINGS.restoreNoneTitle,
      );
    })();
  }, []);

  const handleCopyUserId = useCallback(() => {
    void Clipboard.setStringAsync(appUserId).then(() => {
      Alert.alert('Kopiert!', 'User ID wurde in die Zwischenablage kopiert.');
    });
  }, [appUserId]);

  const truncatedUserId = useMemo(() => {
    if (appUserId.length <= 10) return appUserId;
    return appUserId.slice(0, 6) + '...' + appUserId.slice(-4);
  }, [appUserId]);

  const handleRateApp = useCallback(() => {
    void (async () => {
      const available = await StoreReview.isAvailableAsync();
      if (available) {
        await StoreReview.requestReview();
      } else if (Platform.OS === 'android') {
        void Linking.openURL('https://play.google.com/store/apps/details?id=com.tommi07051967.disco101deen&showAllReviews=true');
      } else {
        void Linking.openURL('https://apps.apple.com/app/id0000000000?action=write-review');
      }
    })();
  }, []);

  return (
    <View style={[styles.screen, { backgroundColor: colors.screenBg }]}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextCol}>
            <Text style={styles.headerLine1}>{STRINGS.settingsTitle}</Text>
            <Text style={styles.headerLine2}>Einstellungen</Text>
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
        <Text style={styles.sectionLabelFirst}>{STRINGS.settingsSectionDisplay}</Text>
        <View style={styles.group}>
          <View style={styles.playbackBlock}>
            <View style={styles.segmentRow}>
              {DISPLAY_OPTIONS.map(({ value, label }) => {
                const active = preference === value;
                return (
                  <Pressable
                    key={value}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={label}
                    onPress={() => setPreference(value)}
                    style={({ pressed }) => [
                      styles.segmentBtn,
                      active ? styles.segmentBtnActive : styles.segmentBtnInactive,
                      pressed && { opacity: 0.88 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentBtnText,
                        active
                          ? styles.segmentBtnTextActive
                          : styles.segmentBtnTextInactive,
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>{STRINGS.settingsSectionPlayback}</Text>
        <View style={styles.group}>
          <View style={styles.playbackBlock}>
            <Text style={styles.playbackLabel}>{STRINGS.settingsSpeedLabel}</Text>
            <View style={styles.segmentRow}>
              {SPEED_OPTIONS.map((v) => {
                const active = audioSpeed === v;
                const label = SPEED_DISPLAY_LABELS[v];
                return (
                  <Pressable
                    key={v}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`${STRINGS.a11ySpeedPrefix}${label}`}
                    onPress={() => void persistSpeed(v)}
                    style={({ pressed }) => [
                      styles.segmentBtn,
                      active ? styles.segmentBtnActive : styles.segmentBtnInactive,
                      pressed && { opacity: 0.88 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentBtnText,
                        active
                          ? styles.segmentBtnTextActive
                          : styles.segmentBtnTextInactive,
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.playbackDivider} />

          <View style={styles.playbackBlock}>
            <Text style={styles.playbackLabel}>{STRINGS.settingsRepeatPhraseLabel}</Text>
            <View style={styles.segmentRow}>
              {REPEAT_OPTIONS.map((v) => {
                const active = audioRepeat === v;
                const label = v === '1' ? STRINGS.repeatCount1x : STRINGS.repeatCount2x;
                return (
                  <Pressable
                    key={v}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`${STRINGS.a11yRepeatCountPrefix}${label}`}
                    onPress={() => void persistRepeat(v)}
                    style={({ pressed }) => [
                      styles.segmentBtn,
                      active ? styles.segmentBtnActive : styles.segmentBtnInactive,
                      pressed && { opacity: 0.88 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentBtnText,
                        active
                          ? styles.segmentBtnTextActive
                          : styles.segmentBtnTextInactive,
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>{STRINGS.settingsSectionFaq}</Text>
        <View style={styles.group}>
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/onboarding',
                params: { from: 'settings' },
              })
            }
            style={({ pressed }) => [pressed && { opacity: 0.75 }]}
            accessibilityRole="button"
            accessibilityLabel={STRINGS.appIntroRepeatA11y}
          >
            <View style={[styles.row, styles.rowBorder]}>
              <Text style={styles.rowLabel} numberOfLines={2}>
                {STRINGS.appIntroRepeat}
              </Text>
              <Ionicons name="arrow-forward" size={20} color={colors.iconMuted} />
            </View>
          </Pressable>
          {FAQ_ACCORDION_ITEMS.map((item, index) => {
            const open = faqOpenId === item.id;
            const isLast = index === FAQ_ACCORDION_ITEMS.length - 1;
            return (
              <View key={item.id}>
                <Pressable
                  onPress={() => toggleFaq(item.id)}
                  style={({ pressed }) => [pressed && { opacity: 0.85 }]}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: open }}
                  accessibilityLabel={item.question}
                >
                  <View
                    style={[
                      styles.row,
                      !open && styles.rowBorder,
                    ]}
                  >
                    <Text style={styles.rowLabel} numberOfLines={3}>
                      {item.question}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={22}
                      color={colors.iconMuted}
                      style={{
                        transform: [{ rotate: open ? '90deg' : '0deg' }],
                      }}
                    />
                  </View>
                </Pressable>
                {open ? (
                  <View
                    style={[
                      styles.faqAnswer,
                      !isLast && styles.faqAnswerBorder,
                    ]}
                  >
                    <Text style={styles.aboutText}>{item.answer}</Text>
                  </View>
                ) : null}
              </View>
            );
          })}
          <Pressable
            onPress={() => router.push('/paywall')}
            style={({ pressed }) => [pressed && { opacity: 0.75 }]}
            accessibilityRole="button"
            accessibilityLabel="Units freischalten"
          >
            <View style={styles.row}>
              <Text style={styles.rowLabel} numberOfLines={2}>
                Units freischalten
              </Text>
              <Ionicons name="arrow-forward" size={20} color={colors.iconMuted} />
            </View>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>{STRINGS.settingsSectionSupport}</Text>
        <View style={styles.group}>
          <Pressable
            onPress={handleCopyUserId}
            style={({ pressed }) => [pressed && { opacity: 0.75 }]}
            accessibilityRole="button"
            accessibilityLabel="User ID kopieren"
          >
            <View style={[styles.row, styles.rowBorder]}>
              <Text style={styles.rowLabel} numberOfLines={1}>User ID</Text>
              <Text style={[styles.rowValue, { marginRight: 8 }]}>{truncatedUserId}</Text>
              <Ionicons name="copy-outline" size={18} color={colors.iconMuted} />
            </View>
          </Pressable>
          <Pressable
            onPress={() => openExternalUrl(STRINGS.urlContact)}
            style={({ pressed }) => [pressed && { opacity: 0.75 }]}
            accessibilityRole="button"
            accessibilityLabel={STRINGS.contactFeedbackA11y}
          >
            <View style={[styles.row, styles.rowBorder]}>
              <Text style={styles.rowLabel} numberOfLines={2}>
                {STRINGS.contactFeedback}
              </Text>
              <Ionicons name="open-outline" size={22} color={colors.iconMuted} />
            </View>
          </Pressable>
          <Pressable
            onPress={handleRateApp}
            style={({ pressed }) => [pressed && { opacity: 0.75 }]}
            accessibilityRole="button"
            accessibilityLabel={STRINGS.rateAppA11y}
          >
            <View style={styles.row}>
              <Text style={styles.rowLabel} numberOfLines={2}>
                {STRINGS.rateApp}
              </Text>
              <Ionicons name="star-outline" size={22} color={colors.iconMuted} />
            </View>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>{STRINGS.settingsSectionLegal}</Text>
        <View style={styles.group}>
          <Pressable
            onPress={() => openExternalUrl(STRINGS.urlPrivacy)}
            style={({ pressed }) => [pressed && { opacity: 0.75 }]}
            accessibilityRole="button"
            accessibilityLabel={STRINGS.legalPrivacyA11y}
          >
            <View style={[styles.row, styles.rowBorder]}>
              <Text style={styles.rowLabel} numberOfLines={2}>
                {STRINGS.privacyPolicy}
              </Text>
              <Ionicons name="open-outline" size={22} color={colors.iconMuted} />
            </View>
          </Pressable>
          <Pressable
            onPress={() => openExternalUrl(STRINGS.urlTerms)}
            style={({ pressed }) => [pressed && { opacity: 0.75 }]}
            accessibilityRole="button"
            accessibilityLabel={STRINGS.legalTermsA11y}
          >
            <View style={styles.row}>
              <Text style={styles.rowLabel} numberOfLines={2}>
                {STRINGS.termsShort}
              </Text>
              <Ionicons name="open-outline" size={22} color={colors.iconMuted} />
            </View>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>{STRINGS.settingsSectionAppInfo}</Text>
        <View style={styles.group}>
          <Row sx={styles} label={STRINGS.appInfoVersion} value={version} />
          <Row sx={styles} label={STRINGS.appInfoLanguage} value={STRINGS.appInfoLanguageValue} />
          <Row sx={styles} label="Status" value={purchaseStatusText} />
          <Pressable
            onPress={handleRestorePurchases}
            style={({ pressed }) => [pressed && { opacity: 0.75 }]}
            accessibilityRole="button"
            accessibilityLabel={STRINGS.restorePurchases}
          >
            <View style={styles.row}>
              <Text style={styles.rowLabel} numberOfLines={2}>
                {STRINGS.restorePurchases}
              </Text>
              <Ionicons name="arrow-forward" size={20} color={colors.iconMuted} />
            </View>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>{STRINGS.settingsSectionDanger}</Text>
        <View style={styles.group}>
          <Pressable
            onPress={confirmWipeAllData}
            style={({ pressed }) => [
              styles.dangerZoneBtn,
              pressed && { opacity: 0.92 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={STRINGS.wipeAllDataA11y}
          >
            <Text style={styles.dangerZoneBtnText}>
              {STRINGS.wipeAllData}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function Row({
  sx,
  label,
  value,
  last,
}: {
  sx: ReturnType<typeof createSettingsStyles>;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      style={[
        sx.row,
        !last && sx.rowBorder,
      ]}
    >
      <Text style={sx.rowLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={sx.rowValue}>{value}</Text>
    </View>
  );
}

function createSettingsStyles(c: AppPalette) {
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
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: c.textMuted,
    marginBottom: 12,
    marginTop: 36,
  },
  sectionLabelFirst: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: c.textMuted,
    marginBottom: 12,
    marginTop: 0,
  },
  group: {
    backgroundColor: c.cardBg,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: c.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
  },
  playbackBlock: {
    padding: 16,
  },
  playbackLabel: {
    fontSize: 16,
    color: c.textPrimary,
    fontWeight: '600',
    marginBottom: 12,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 10,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  segmentBtnActive: {
    backgroundColor: c.accentBlue,
    borderWidth: 0,
  },
  segmentBtnInactive: {
    backgroundColor: c.segmentInactiveBg,
    borderWidth: 1.5,
    borderColor: c.segmentInactiveBorder,
  },
  segmentBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  segmentBtnTextActive: {
    color: c.segmentActiveText,
  },
  segmentBtnTextInactive: {
    color: c.segmentInactiveText,
  },
  playbackDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: c.borderSubtle,
    marginHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.borderSubtle,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    color: c.textPrimary,
    marginRight: 12,
  },
  rowValue: {
    fontSize: 16,
    color: c.iconMuted,
  },
  aboutText: {
    fontSize: 15,
    lineHeight: 22,
    color: c.textPrimary,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 0,
  },
  faqAnswerBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.borderSubtle,
  },
  faqUpgradeBtn: {
    marginTop: 14,
    alignSelf: 'stretch',
    backgroundColor: c.accentBlue,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faqUpgradeBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: c.buttonOnAccent,
  },
  dangerZoneBtn: {
    margin: 16,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: c.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerZoneBtnText: {
    color: c.buttonOnAccent,
    fontSize: 16,
    fontWeight: '600',
  },
  });
}
