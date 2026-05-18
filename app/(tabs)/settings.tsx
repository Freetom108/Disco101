import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Image,
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
import {
  ACTIVE,
  BUTTON_TEXT,
  HEADER_DARK,
  HEADER_TEXT_SUB,
  INACTIVE,
  SCREEN_BG,
} from '../../constants/theme';

const SECTION_LABEL = '#888';

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
    question: 'Was ist Restore Purchase?',
    answer:
      'Falls du die App neu installiert hast und deine bereits gekauften Inhalte nicht mehr verfügbar sind, kannst du sie mit Restore Purchase kostenlos wiederherstellen. Tippe einfach auf den Restore Purchase Button weiter unten in den Settings.',
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

  return (
    <View style={[styles.screen, { backgroundColor: SCREEN_BG }]}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextCol}>
            <Text style={styles.headerLine1}>Settings</Text>
            <Text style={styles.headerLine2}>Disco 101 · English Edition</Text>
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
        <Text style={styles.sectionLabelFirst}>App Info</Text>
        <View style={styles.group}>
          <Row label="Version" value="1.0.0" />
          <Row label="Sprache" value="Deutsch 🇩🇪 – Englisch 🇬🇧" last />
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
              <Ionicons name="arrow-forward" size={20} color="#8E8E93" />
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
                      color="#8E8E93"
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

        <Text style={styles.sectionLabel}>Über die App</Text>
        <View style={styles.group}>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutText}>
              Disco 101 ist dein idealer Sprachtrainer für die wichtigsten
              englischen Redewendungen – egal ob Alltag, Urlaub, Job oder Leben
              im Ausland.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Row({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.row,
        !last && styles.rowBorder,
      ]}
    >
      <Text style={styles.rowLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.rowValue}>{value}</Text>
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
  sectionLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    color: SECTION_LABEL,
    marginBottom: 4,
    marginTop: 20,
  },
  sectionLabelFirst: {
    fontSize: 12,
    textTransform: 'uppercase',
    color: SECTION_LABEL,
    marginBottom: 4,
    marginTop: 0,
  },
  group: {
    backgroundColor: INACTIVE,
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
    color: BUTTON_TEXT,
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
    backgroundColor: ACTIVE,
    borderWidth: 0,
  },
  segmentBtnInactive: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.22)',
  },
  segmentBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  segmentBtnTextActive: {
    color: BUTTON_TEXT,
  },
  segmentBtnTextInactive: {
    color: '#1A1A1A',
  },
  playbackDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C6C6C8',
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
    borderBottomColor: '#C6C6C8',
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    color: BUTTON_TEXT,
    marginRight: 12,
  },
  rowValue: {
    fontSize: 16,
    color: '#8E8E93',
  },
  aboutRow: {
    padding: 16,
  },
  aboutText: {
    fontSize: 15,
    lineHeight: 22,
    color: BUTTON_TEXT,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 0,
  },
  faqAnswerBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  faqUpgradeBtn: {
    marginTop: 14,
    alignSelf: 'stretch',
    backgroundColor: ACTIVE,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faqUpgradeBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: BUTTON_TEXT,
  },
});
