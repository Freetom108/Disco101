import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SpeakerButton from '../../../components/SpeakerButton';
import {
  preloadPhraseAudio,
} from '../../../utils/audioPreloader';

const CHRIS_AVATAR = require('../../../assets/images/chris-avatar.png');
const ANN_AVATAR = require('../../../assets/images/ann-avatar.png');
import {
  ACTIVE,
  BRAND,
  BUTTON_TEXT,
  CARD_BG,
  CARD_DE,
  FONT_DM_SERIF,
  INACTIVE,
  SCREEN_BG,
} from '../../../constants/theme';
import SENTENCES from '../../../data/sentences.json';

const PINNED_KEY = 'pinned_phrases';

type Phrase = (typeof SENTENCES)[number];

type RepeatSession = { phrases: Phrase[]; index: number };

function shufflePhrases(phrases: Phrase[]): Phrase[] {
  const a = [...phrases];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]!;
    a[i] = a[j]!;
    a[j] = t;
  }
  return a;
}

export default function RepeatSessionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ phraseIds?: string | string[] }>();
  const [fontsLoaded] = useFonts({
    [FONT_DM_SERIF]: require('../../../assets/fonts/DMSerifDisplay-Regular.ttf'),
  });

  const [pinnedIds, setPinnedIds] = useState<number[]>([]);
  const [repeatSession, setRepeatSession] = useState<RepeatSession | null>(null);
  const [sitztConfirmedPhraseIds, setSitztConfirmedPhraseIds] = useState<
    number[]
  >([]);
  const [initFailed, setInitFailed] = useState(false);

  const byId = useMemo(
    () => new Map((SENTENCES as Phrase[]).map((s) => [s.id, s])),
    [],
  );

  const loadPinned = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(PINNED_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      const ids = Array.isArray(parsed)
        ? parsed.filter((x: unknown) => typeof x === 'number')
        : [];
      setPinnedIds(ids);
    } catch {
      setPinnedIds([]);
    }
  }, []);

  useEffect(() => {
    loadPinned();
  }, [loadPinned]);

  useEffect(() => {
    const raw = params.phraseIds;
    const phraseIdsParam = Array.isArray(raw) ? raw[0] : raw;
    if (!phraseIdsParam || typeof phraseIdsParam !== 'string') {
      setInitFailed(true);
      return;
    }
    try {
      const ids = JSON.parse(phraseIdsParam) as unknown;
      if (!Array.isArray(ids) || ids.some((x) => typeof x !== 'number')) {
        setInitFailed(true);
        return;
      }
      const phrases = ids
        .map((id) => byId.get(id))
        .filter((p): p is Phrase => p != null);
      if (phrases.length === 0) {
        setInitFailed(true);
        return;
      }
      setRepeatSession({ phrases: shufflePhrases(phrases), index: 0 });
      setSitztConfirmedPhraseIds([]);
    } catch {
      setInitFailed(true);
    }
  }, [params.phraseIds, byId]);

  useEffect(() => {
    const phrases = repeatSession?.phrases;
    if (!phrases?.length) return;
    preloadPhraseAudio(phrases.map((p) => p.id));
  }, [repeatSession?.phrases]);

  useEffect(() => {
    if (initFailed) {
      router.back();
    }
  }, [initFailed, router]);

  const persistPinned = async (ids: number[]) => {
    setPinnedIds(ids);
    await AsyncStorage.setItem(PINNED_KEY, JSON.stringify(ids));
  };

  const sessionPhrases = repeatSession?.phrases ?? [];
  const sessionIndex = repeatSession?.index ?? 0;
  const sessionDone =
    repeatSession !== null &&
    (sessionPhrases.length === 0 || sessionIndex >= sessionPhrases.length);
  const currentPhrase =
    !sessionDone && sessionPhrases.length > 0
      ? sessionPhrases[sessionIndex]
      : undefined;

  const sitztDoneForCurrent =
    currentPhrase != null &&
    sitztConfirmedPhraseIds.includes(currentPhrase.id);

  const goBack = () => router.back();

  const onSessionPinTap = async () => {
    if (!repeatSession || !currentPhrase) return;
    const id = currentPhrase.id;
    const newPinned = pinnedIds.filter((x) => x !== id);
    await persistPinned(newPinned);
    const { phrases, index } = repeatSession;
    const removedAt = phrases.findIndex((p) => p.id === id);
    const newPhrases = phrases.filter((p) => p.id !== id);
    let newIndex = index;
    if (removedAt < index) newIndex = index - 1;
    else if (removedAt === index)
      newIndex = Math.min(index, Math.max(0, newPhrases.length - 1));
    if (newPhrases.length === 0) {
      setRepeatSession({ phrases: [], index: 0 });
      return;
    }
    newIndex = Math.max(0, Math.min(newIndex, newPhrases.length - 1));
    setRepeatSession({ phrases: newPhrases, index: newIndex });
  };

  const onSitzt = async () => {
    if (!repeatSession || !currentPhrase) return;
    const id = currentPhrase.id;
    const newPinned = pinnedIds.filter((x) => x !== id);
    await persistPinned(newPinned);
    setSitztConfirmedPhraseIds((prev) => [...prev, id]);
  };

  const onNaechste = () => {
    if (!repeatSession || !currentPhrase) return;
    const { phrases, index } = repeatSession;
    const id = currentPhrase.id;

    if (sitztConfirmedPhraseIds.includes(id)) {
      const newPhrases = phrases.filter((p) => p.id !== id);
      if (newPhrases.length === 0) {
        setRepeatSession({ phrases: [], index: 0 });
        return;
      }
      const removedAt = phrases.findIndex((p) => p.id === id);
      let newIndex = index;
      if (removedAt < index) newIndex = index - 1;
      else if (removedAt === index)
        newIndex = Math.min(index, Math.max(0, newPhrases.length - 1));
      newIndex = Math.max(0, Math.min(newIndex, newPhrases.length - 1));
      setRepeatSession({ phrases: newPhrases, index: newIndex });
      return;
    }

    if (index < phrases.length - 1) {
      setRepeatSession({ phrases, index: index + 1 });
    } else {
      setRepeatSession({ phrases, index: phrases.length });
    }
  };

  if (initFailed || !repeatSession) {
    return (
      <View style={[styles.screen, { backgroundColor: SCREEN_BG }]}>
        <View style={styles.sessionFontWait}>
          <ActivityIndicator size="large" color={BRAND} />
        </View>
      </View>
    );
  }

  const y = sessionPhrases.length;
  const progressLabel =
    sessionDone || y === 0 ? '' : `${sessionIndex + 1} / ${y} Karten`;

  return (
    <View style={[styles.screen, { backgroundColor: SCREEN_BG }]}>
      <View
        style={[
          styles.sessionHeaderBar,
          { paddingTop: Math.max(insets.top, 12) },
        ]}
      >
        <View style={styles.sessionHeaderSide}>
          <Pressable
            onPress={goBack}
            hitSlop={12}
            style={({ pressed }) => [pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel="Zurück"
          >
            <Text style={styles.sessionBackText}>← Zurück</Text>
          </Pressable>
        </View>
        <Text style={styles.sessionProgressText} numberOfLines={1}>
          {progressLabel}
        </Text>
        <View style={styles.sessionHeaderSide} />
      </View>

      <View style={styles.sessionBody}>
        <View style={styles.sessionCardShadow}>
          <View style={styles.sessionCard}>
            {sessionDone ? (
              <View style={styles.sessionCompleteInner}>
                <Text style={styles.sessionCompleteTitle}>Gut gemacht! 🎉</Text>
                <Text style={styles.sessionCompleteSub}>
                  Du hast alle Karten in diesem Stapel wiederholt.
                </Text>
                <Pressable
                  onPress={goBack}
                  style={({ pressed }) => [
                    styles.sessionCompleteBtn,
                    pressed && { opacity: 0.92 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Zurück zur Übersicht"
                >
                  <Text style={styles.sessionCompleteBtnText}>
                    Zurück zur Übersicht
                  </Text>
                </Pressable>
              </View>
            ) : currentPhrase && fontsLoaded ? (
              <>
                <View style={styles.sessionCardTop}>
                  <Text style={styles.sessionChapterLabel} numberOfLines={2}>
                    {`KAPITEL ${currentPhrase.chapterId} · ${currentPhrase.category.toUpperCase()}`}
                  </Text>
                  <Pressable
                    onPress={onSessionPinTap}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={
                      pinnedIds.includes(currentPhrase.id)
                        ? 'Markierung entfernen'
                        : 'Markieren'
                    }
                  >
                    <Ionicons
                      name="pin"
                      size={20}
                      color={
                        pinnedIds.includes(currentPhrase.id)
                          ? '#C8102E'
                          : BRAND
                      }
                    />
                  </Pressable>
                </View>

                <View style={styles.sessionCardMid}>
                  <View style={styles.sessionNumRow}>
                    <Text style={styles.sessionBigNum}>{sessionIndex + 1}</Text>
                    <Text style={styles.sessionNumHint}>
                      / {sessionPhrases.length} Karten
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.sessionEnglish,
                      { fontFamily: FONT_DM_SERIF },
                    ]}
                    adjustsFontSizeToFit
                    numberOfLines={4}
                    minimumFontScale={0.7}
                  >
                    {currentPhrase.english}
                  </Text>
                  <Text
                    style={styles.sessionGerman}
                    numberOfLines={3}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                  >
                    {currentPhrase.german}
                  </Text>
                  <View style={styles.categoryPill}>
                    <Text style={styles.categoryPillText}>
                      {currentPhrase.category}
                    </Text>
                  </View>
                </View>

                <View style={styles.sessionBottom}>
                  <View style={styles.cardMFRow}>
                    <SpeakerButton
                      accessibilityLabel="Male speaker"
                      letter="M"
                      phraseId={currentPhrase.id}
                      avatarSource={CHRIS_AVATAR}
                    />
                    <SpeakerButton
                      accessibilityLabel="Female speaker"
                      letter="F"
                      phraseId={currentPhrase.id}
                      avatarSource={ANN_AVATAR}
                    />
                  </View>
                  <View style={styles.sessionFooterRow}>
                    <Pressable
                      onPress={onSitzt}
                      style={({ pressed }) => [
                        styles.sitztBtn,
                        sitztDoneForCurrent && styles.sitztBtnDone,
                        pressed && { opacity: 0.85 },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel="Sitzt"
                    >
                      <Text
                        style={[
                          styles.sitztBtnText,
                          sitztDoneForCurrent && styles.sitztBtnTextDone,
                        ]}
                      >
                        {sitztDoneForCurrent ? '✓ Sitzt! ✓' : '✓ Sitzt!'}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={onNaechste}
                      style={({ pressed }) => [
                        styles.naechsteBtn,
                        pressed && { opacity: 0.92 },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel="Nächste Karte"
                    >
                      <Text style={styles.naechsteBtnText}>Nächste →</Text>
                    </Pressable>
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.sessionFontWait}>
                <ActivityIndicator size="large" color={BRAND} />
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  sessionHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 12,
    backgroundColor: SCREEN_BG,
  },
  sessionHeaderSide: {
    width: 100,
  },
  sessionBackText: {
    fontSize: 17,
    fontWeight: '600',
    color: BRAND,
  },
  sessionProgressText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  sessionBody: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: '3%',
    paddingBottom: 90,
  },
  sessionCardShadow: {
    flex: 1,
    minHeight: 0,
    backgroundColor: SCREEN_BG,
    borderRadius: 28,
    marginVertical: 8,
    ...Platform.select({
      android: { elevation: 12 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
    }),
  },
  sessionCard: {
    flex: 1,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: CARD_BG,
    padding: 20,
    justifyContent: 'space-between',
  },
  sessionCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  sessionChapterLabel: {
    color: INACTIVE,
    fontSize: 11,
    letterSpacing: 0.4,
    flex: 1,
  },
  sessionCardMid: {
    flex: 1,
    minHeight: 0,
    marginTop: 8,
    justifyContent: 'center',
  },
  sessionNumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: 8,
  },
  sessionBigNum: {
    color: ACTIVE,
    fontSize: 56,
    fontWeight: '700',
    lineHeight: 60,
  },
  sessionNumHint: {
    color: CARD_DE,
    fontSize: 15,
    marginBottom: 8,
  },
  sessionEnglish: {
    color: '#1A1A1A',
    fontSize: 26,
    lineHeight: 34,
    marginTop: 12,
  },
  sessionGerman: {
    color: '#999999',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 8,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    marginTop: 14,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
  },
  categoryPillText: {
    color: '#1A1A1A',
    fontSize: 13,
    fontWeight: '500',
  },
  sessionBottom: {
    marginTop: 8,
  },
  cardMFRow: {
    flexDirection: 'row',
    gap: 12,
  },
  sessionFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  sitztBtn: {
    borderWidth: 2,
    borderColor: '#2E7D32',
    borderRadius: 12,
    padding: 14,
    backgroundColor: 'transparent',
  },
  sitztBtnDone: {
    borderColor: '#1B5E20',
    borderWidth: 2,
    backgroundColor: '#2E7D32',
  },
  sitztBtnText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '600',
  },
  sitztBtnTextDone: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  naechsteBtn: {
    flex: 1,
    backgroundColor: '#C8102E',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  naechsteBtnText: {
    color: BUTTON_TEXT,
    fontSize: 16,
    fontWeight: '600',
  },
  sessionCompleteInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  sessionCompleteTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: ACTIVE,
    textAlign: 'center',
  },
  sessionCompleteSub: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 24,
    color: CARD_DE,
    textAlign: 'center',
  },
  sessionCompleteBtn: {
    marginTop: 28,
    backgroundColor: '#C8102E',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  sessionCompleteBtnText: {
    color: BUTTON_TEXT,
    fontSize: 17,
    fontWeight: '600',
  },
  sessionFontWait: {
    flex: 1,
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
