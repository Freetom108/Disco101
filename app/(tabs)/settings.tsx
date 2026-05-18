import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
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
import type { AppPalette } from '../../constants/themePalettes';
import { restorePurchases } from '../../constants/chapterUnlock';
import { useAppTheme } from '../../context/AppThemeContext';

const URL_CONTACT =
  'https://freetom108.github.io/Disco101/kontakt/';
const URL_PRIVACY =
  'https://freetom108.github.io/Disco101/datenschutz/';
const URL_TERMS = 'https://freetom108.github.io/Disco101/agb/';

const DISPLAY_OPTIONS = [
  { value: 'light' as const, label: 'Hell' },
  { value: 'auto' as const, label: 'Auto' },
  { value: 'dark' as const, label: 'Dunkel' },
];

const SPEED_OPTIONS: AudioSpeedStored[] = ['0.7', '0.8', '0.9'];
/** Nur UI-Text; gespeicherte Werte / audioSpeedToRate bleiben 0.7 / 0.8 / 0.9 */
const SPEED_DISPLAY_LABELS: Record<AudioSpeedStored, string> = {
  '0.7': '0.9x',
  '0.8': '1.0x',
  '0.9': '1.1x',
};
const REPEAT_OPTIONS: AudioRepeatStored[] = ['1', '2'];

type FaqAccordionItem = {
  id: string;
  question: string;
  answer: string;
  upgradeCta?: boolean;
};

const FAQ_ACCORDION_ITEMS: FaqAccordionItem[] = [
  {
    id: 'offline',
    question: 'Funktioniert die App offline?',
    answer:
      'Ja, die App ist extra so konzipiert dass sie vollständig offline funktioniert – damit du zum Beispiel auch im Auto, in der U-Bahn oder im Flugzeug üben kannst. Keine Internetverbindung notwendig.',
  },
  {
    id: 'unit101',
    question: 'Unit 1 Basics',
    answer:
      '101 Redewendungen in 7 Kapiteln – die wichtigsten englischen Phrasen für deinen Alltag. Von der Begrüßung bis zum Small Talk.',
  },
  {
    id: 'unit102',
    question: 'Unit 2 Urlaub',
    answer:
      '101 Redewendungen in 7 Kapiteln – erweiterter Wortschatz für deinen Urlaub. Strand, Hotel, Restaurant und mehr.',
  },
  {
    id: 'unit103',
    question: 'Unit 3 Job',
    answer:
      '101 Redewendungen in 7 Kapiteln – alles was du für den englischen Berufsalltag brauchst. Meetings, Präsentationen und Geschäftsreisen.',
  },
  {
    id: 'unit104',
    question: 'Unit 4 Expat',
    answer:
      '101 Redewendungen in 7 Kapiteln – für alle die im englischsprachigen Ausland leben. Behörden, Arzt, Versicherungen und Alltagsleben.',
  },
  {
    id: 'restore',
    question: 'Käufe wiederherstellen',
    answer:
      "Falls du die App neu installiert hast und deine bereits gekauften Inhalte nicht mehr verfügbar sind, tippe einfach auf 'Käufe wiederherstellen' unter App Info – deine Käufe werden kostenlos wiederhergestellt. Du kannst Käufe auch direkt auf dem Upgrade-Screen wiederherstellen.",
  },
  {
    id: 'upgrade_options',
    question: 'Wo finde ich die Upgrade Optionen?',
    answer:
      'Die Upgrade-Ansicht mit allen Modulen und Bundle-Preisen erreichst du über die Schaltfläche unten oder indem du im Learn-Tab ein gesperrtes Kapitel auswählst.',
    upgradeCta: true,
  },
];

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

  const toggleFaq = useCallback((id: string) => {
    setFaqOpenId((prev) => (prev === id ? null : id));
  }, []);

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
        'Fehler',
        'Die Daten konnten nicht gelöscht werden. Bitte versuche es erneut.',
      );
    }
  }, [router]);

  const confirmWipeAllData = useCallback(() => {
    Alert.alert(
      'Bist du sicher?',
      'Deine Lernfortschritte, gepinnten Karten und Einstellungen werden gelöscht. Die 404 Phrasen und Audioinhalte bleiben vollständig erhalten.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
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
          ? 'Käufe wurden wiederhergestellt'
          : 'Keine Käufe gefunden',
      );
    })();
  }, []);

  return (
    <View style={[styles.screen, { backgroundColor: colors.screenBg }]}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextCol}>
            <Text style={styles.headerLine1}>Settings</Text>
            <Text style={styles.headerLine2}>Disco 101 · Deutsch-Englisch</Text>
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
        <Text style={styles.sectionLabelFirst}>Über die App</Text>
        <View style={styles.group}>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutText}>
              Disco 101 ist dein idealer Sprachtrainer für die wichtigsten
              englischen Redewendungen – egal ob Alltag, Urlaub, Job oder Leben
              im Ausland.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Display</Text>
        <View style={styles.group}>
          <View style={styles.playbackBlock}>
            <Text style={styles.playbackLabel}>Erscheinungsbild</Text>
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

        <Text style={styles.sectionLabel}>Wiedergabe</Text>
        <View style={styles.group}>
          <View style={styles.playbackBlock}>
            <Text style={styles.playbackLabel}>Wiedergabegeschwindigkeit</Text>
            <View style={styles.segmentRow}>
              {SPEED_OPTIONS.map((v) => {
                const active = audioSpeed === v;
                const label = SPEED_DISPLAY_LABELS[v];
                return (
                  <Pressable
                    key={v}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`Geschwindigkeit ${label}`}
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
            <Text style={styles.playbackLabel}>Phrase wiederholen</Text>
            <View style={styles.segmentRow}>
              {REPEAT_OPTIONS.map((v) => {
                const active = audioRepeat === v;
                const label = v === '1' ? '1x' : '2x';
                return (
                  <Pressable
                    key={v}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`Wiederholung ${label}`}
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

        <Text style={styles.sectionLabel}>FAQ</Text>
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
            accessibilityLabel="App Intro wiederholen"
          >
            <View style={[styles.row, styles.rowBorder]}>
              <Text style={styles.rowLabel} numberOfLines={2}>
                App Intro wiederholen
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
                      !open && !isLast && styles.rowBorder,
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
                    {item.upgradeCta ? (
                      <Pressable
                        onPress={() => router.push('/paywall')}
                        style={({ pressed }) => [
                          styles.faqUpgradeBtn,
                          pressed && { opacity: 0.92 },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel="Upgrade ansehen"
                      >
                        <Text style={styles.faqUpgradeBtnText}>
                          Upgrade ansehen →
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>Support & Feedback</Text>
        <View style={styles.group}>
          <Pressable
            onPress={() => openExternalUrl(URL_CONTACT)}
            style={({ pressed }) => [pressed && { opacity: 0.75 }]}
            accessibilityRole="button"
            accessibilityLabel="Kontakt und Feedback"
          >
            <View style={[styles.row, styles.rowBorder]}>
              <Text style={styles.rowLabel} numberOfLines={2}>
                Kontakt & Feedback
              </Text>
              <Ionicons name="open-outline" size={22} color={colors.iconMuted} />
            </View>
          </Pressable>
          <Pressable
            onPress={() =>
              Alert.alert(
                'App bewerten',
                'Kommt bald nach Store-Launch',
              )
            }
            style={({ pressed }) => [pressed && { opacity: 0.75 }]}
            accessibilityRole="button"
            accessibilityLabel="App bewerten"
          >
            <View style={styles.row}>
              <Text style={styles.rowLabel} numberOfLines={2}>
                App bewerten
              </Text>
              <Ionicons name="star-outline" size={22} color={colors.iconMuted} />
            </View>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>Legal</Text>
        <View style={styles.group}>
          <Pressable
            onPress={() => openExternalUrl(URL_PRIVACY)}
            style={({ pressed }) => [pressed && { opacity: 0.75 }]}
            accessibilityRole="button"
            accessibilityLabel="Datenschutz"
          >
            <View style={[styles.row, styles.rowBorder]}>
              <Text style={styles.rowLabel} numberOfLines={2}>
                Datenschutz
              </Text>
              <Ionicons name="open-outline" size={22} color={colors.iconMuted} />
            </View>
          </Pressable>
          <Pressable
            onPress={() => openExternalUrl(URL_TERMS)}
            style={({ pressed }) => [pressed && { opacity: 0.75 }]}
            accessibilityRole="button"
            accessibilityLabel="AGB"
          >
            <View style={styles.row}>
              <Text style={styles.rowLabel} numberOfLines={2}>
                AGB
              </Text>
              <Ionicons name="open-outline" size={22} color={colors.iconMuted} />
            </View>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>App Info</Text>
        <View style={styles.group}>
          <Row sx={styles} label="Version" value={version} />
          <Row sx={styles} label="Sprache" value="Deutsch 🇩🇪 – Englisch 🇬🇧" />
          <Pressable
            onPress={handleRestorePurchases}
            style={({ pressed }) => [pressed && { opacity: 0.75 }]}
            accessibilityRole="button"
            accessibilityLabel="Käufe wiederherstellen"
          >
            <View style={styles.row}>
              <Text style={styles.rowLabel} numberOfLines={2}>
                Käufe wiederherstellen
              </Text>
              <Ionicons name="arrow-forward" size={20} color={colors.iconMuted} />
            </View>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>Danger Zone</Text>
        <View style={styles.group}>
          <Pressable
            onPress={confirmWipeAllData}
            style={({ pressed }) => [
              styles.dangerZoneBtn,
              pressed && { opacity: 0.92 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Alle App-Daten löschen"
          >
            <Text style={styles.dangerZoneBtnText}>
              Alle App-Daten löschen
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
    fontSize: 12,
    textTransform: 'uppercase',
    color: c.textMuted,
    marginBottom: 4,
    marginTop: 20,
  },
  sectionLabelFirst: {
    fontSize: 12,
    textTransform: 'uppercase',
    color: c.textMuted,
    marginBottom: 4,
    marginTop: 0,
  },
  group: {
    backgroundColor: c.groupBg,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      android: { elevation: 2 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
    }),
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
    backgroundColor: c.borderHairline,
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
    borderBottomColor: c.borderHairline,
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
  aboutRow: {
    padding: 16,
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
    borderBottomColor: c.borderHairline,
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
