import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AudioPlayer } from 'expo-audio';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AUDIO_SPEED_KEY,
  audioSpeedToRate,
  parseAudioSpeed,
} from '../../../constants/audioSettingsStorage';
import {
  preloadPhraseAudio,
} from '../../../utils/audioPreloader';
import {
  filterPhraseIdsForRepeatAccess,
  INITIAL_MODULE_PURCHASE_STATE,
  loadModulePurchaseState,
  type ModulePurchaseState,
} from '../../../constants/chapterUnlock';
import { coerceModuleCode } from '../../../constants/activeLearningModule';
import {
  loadPinnedIdsForModule,
  persistPinnedIdsForModule,
} from '../../../constants/learningResume';
import type { ModuleCode } from '../../../constants/products';
import {
  getSentencesForModule,
  type SentenceRecord,
} from '../../../constants/sentencePacks';
import { audioAssets } from '../../../utils/audioAssets';
import { buildQuizOptions, phraseAudioSource, shufflePhrases } from '../../../utils/phraseUtils';
import {
  safePlayerPause,
  safePlayerPlay,
  safePlayerReplace,
  safePlayerSeekTo,
  safePlayerSetPlaybackRate,
} from '../../../utils/safeAudioPlayer';

import { FONT_DM_SERIF } from '../../../constants/theme';
import type { AppPalette } from '../../../constants/themePalettes';
import { useAppTheme } from '../../../context/AppThemeContext';

type Phrase = SentenceRecord;

type RepeatSession = { phrases: Phrase[]; index: number };

const CHRIS_AVATAR = require('../../../assets/chris.png');
const ANN_AVATAR = require('../../../assets/ann.png');


function SessionChrisAnnButtons({
  player,
  phraseId,
  moduleCode,
  showOptions,
  onOpenOptionsAfterFirstVoice,
  compact,
  isReleasedRef,
  sessionStyles,
}: {
  player: AudioPlayer;
  phraseId: number;
  moduleCode: ModuleCode;
  showOptions: boolean;
  onOpenOptionsAfterFirstVoice: () => void;
  compact: boolean;
  isReleasedRef: MutableRefObject<boolean>;
  sessionStyles: ReturnType<typeof createRepeatSessionStyles>;
}) {
  const showOptionsRef = useRef(showOptions);
  useEffect(() => {
    showOptionsRef.current = showOptions;
  }, [showOptions]);

  useEffect(() => {
    return () => {
      try {
        if (isReleasedRef.current) return;
        safePlayerPause(player);
      } catch {
        /* ignore */
      }
    };
  }, [player, isReleasedRef]);

  const playVoice = useCallback(
    async (gender: 'm' | 'f') => {
      if (isReleasedRef.current) return;
      const src = phraseAudioSource(phraseId, gender, moduleCode);
      if (!src) return;
      if (!showOptionsRef.current) {
        onOpenOptionsAfterFirstVoice();
      }
      let speedRaw: string | null = null;
      try {
        speedRaw = await AsyncStorage.getItem(AUDIO_SPEED_KEY);
      } catch {
        /* default rate */
      }
      const rate = audioSpeedToRate(parseAudioSpeed(speedRaw));
      try {
        if (isReleasedRef.current) return;
        safePlayerPause(player);
        if (isReleasedRef.current) return;
        safePlayerReplace(player, src);
        for (let i = 0; i < 60; i++) {
          if (isReleasedRef.current) return;
          if (player.currentStatus.duration > 0) break;
          await new Promise<void>((r) => setTimeout(r, 40));
        }
        if (isReleasedRef.current) return;
        if (player.currentStatus.duration <= 0) return;
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: false,
          interruptionMode: 'duckOthers',
          shouldPlayInBackground: false,
          shouldRouteThroughEarpiece: false,
        });
        if (isReleasedRef.current) return;
        safePlayerPause(player);
        if (isReleasedRef.current) return;
        await safePlayerSeekTo(player, 0);
        if (isReleasedRef.current) return;
        safePlayerSetPlaybackRate(player, rate, 'medium');
        if (isReleasedRef.current) return;
        safePlayerPlay(player);
      } catch {
        try {
          if (isReleasedRef.current) return;
          safePlayerPause(player);
        } catch {
          /* ignore */
        }
      }
    },
    [isReleasedRef, moduleCode, onOpenOptionsAfterFirstVoice, player, phraseId],
  );

  const btnStyle = compact
    ? sessionStyles.sessionTestVoiceBtnCompact
    : sessionStyles.sessionTestVoiceBtn;

  return (
    <View
      style={[
        sessionStyles.sessionTestVoiceRow,
        compact && sessionStyles.sessionTestVoiceRowCompact,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Chris (männliche Stimme)"
        onPress={() => void playVoice('m')}
        style={({ pressed }) => [
          btnStyle,
          pressed && { opacity: 0.9 },
        ]}
      >
        <View style={sessionStyles.sessionTestVoiceBtnInner}>
          <View style={sessionStyles.sessionTestVoiceAvatarWrap}>
            <Image
              source={CHRIS_AVATAR}
              style={sessionStyles.sessionTestVoiceAvatarImg}
              resizeMode="cover"
            />
          </View>
          <Text style={sessionStyles.sessionTestVoiceBtnText}>Chris</Text>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ann (weibliche Stimme)"
        onPress={() => void playVoice('f')}
        style={({ pressed }) => [
          btnStyle,
          pressed && { opacity: 0.9 },
        ]}
      >
        <View style={sessionStyles.sessionTestVoiceBtnInner}>
          <View style={sessionStyles.sessionTestVoiceAvatarWrap}>
            <Image
              source={ANN_AVATAR}
              style={sessionStyles.sessionTestVoiceAvatarImg}
              resizeMode="cover"
            />
          </View>
          <Text style={sessionStyles.sessionTestVoiceBtnText}>Ann</Text>
        </View>
      </Pressable>
    </View>
  );
}

export default function RepeatSessionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    phraseIds?: string | string[];
    moduleCode?: string | string[];
  }>();

  const rawModuleParam = params.moduleCode;
  const sessionModule = useMemo<ModuleCode>(() => {
    const v = Array.isArray(rawModuleParam)
      ? rawModuleParam[0]
      : rawModuleParam;
    return coerceModuleCode(typeof v === 'string' ? v : undefined);
  }, [rawModuleParam]);

  const sentencesPack = useMemo(
    () => getSentencesForModule(sessionModule),
    [sessionModule],
  );
  const [fontsLoaded] = useFonts({
    [FONT_DM_SERIF]: require('../../../assets/fonts/DMSerifDisplay-Regular.ttf'),
  });

  const { colors } = useAppTheme();
  const styles = useMemo(() => createRepeatSessionStyles(colors), [colors]);

  const [pinnedIds, setPinnedIds] = useState<number[]>([]);
  const [repeatSession, setRepeatSession] = useState<RepeatSession | null>(null);
  const [purchaseResolved, setPurchaseResolved] = useState(false);
  const [purchaseState, setPurchaseState] = useState<ModulePurchaseState>(
    INITIAL_MODULE_PURCHASE_STATE,
  );
  const [sitztConfirmedPhraseIds, setSitztConfirmedPhraseIds] = useState<
    number[]
  >([]);
  const [showStackCompleteNote, setShowStackCompleteNote] = useState(false);
  const [initFailed, setInitFailed] = useState(false);
  const [showQuizOptions, setShowQuizOptions] = useState(false);
  const [quizOptions, setQuizOptions] = useState<Phrase[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [answerLocked, setAnswerLocked] = useState(false);

  const sessionConfettiRef = useRef<InstanceType<typeof ConfettiCannon> | null>(
    null,
  );
  const isReleasedRef = useRef(false);
  const sitztFxPlayer = useAudioPlayer(null, { updateInterval: 100 });
  const celebrationPlayer = useAudioPlayer(null, { updateInterval: 100 });
  const sessionTestPlaybackPlayer = useAudioPlayer(null, {
    updateInterval: 100,
  });

  useEffect(() => {
    return () => {
      isReleasedRef.current = true;
      try {
        safePlayerPause(sitztFxPlayer);
      } catch {
        /* ignore */
      }
      try {
        safePlayerPause(celebrationPlayer);
      } catch {
        /* ignore */
      }
    };
  }, [sitztFxPlayer, celebrationPlayer]);

  useEffect(() => {
    if (!showStackCompleteNote) return;
    const frame = requestAnimationFrame(() => {
      try {
        sessionConfettiRef.current?.start();
      } catch {
        /* ignore */
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [showStackCompleteNote]);

  const byId = useMemo(
    () => new Map(sentencesPack.map((s) => [s.id, s])),
    [sentencesPack],
  );

  const loadPinned = useCallback(async () => {
    try {
      setPinnedIds(await loadPinnedIdsForModule(sessionModule));
    } catch {
      setPinnedIds([]);
    }
  }, [sessionModule]);

  useEffect(() => {
    void (async () => {
      try {
        setPurchaseState(await loadModulePurchaseState());
      } catch {
        setPurchaseState(INITIAL_MODULE_PURCHASE_STATE);
      } finally {
        setPurchaseResolved(true);
      }
    })();
  }, []);

  useEffect(() => {
    void loadPinned();
  }, [loadPinned]);

  useEffect(() => {
    if (!purchaseResolved) return;
    const raw = params.phraseIds;
    const phraseIdsParam = Array.isArray(raw) ? raw[0] : raw;
    if (!phraseIdsParam || typeof phraseIdsParam !== 'string') {
      setInitFailed(true);
      return;
    }
    try {
      const idsRaw = JSON.parse(phraseIdsParam) as unknown;
      if (!Array.isArray(idsRaw) || idsRaw.some((x) => typeof x !== 'number')) {
        setInitFailed(true);
        return;
      }
      const ids = filterPhraseIdsForRepeatAccess(
        idsRaw,
        purchaseState,
        sessionModule,
        sentencesPack,
      );
      const phrases = ids
        .map((id) => byId.get(id))
        .filter((p): p is Phrase => p != null);
      if (phrases.length === 0) {
        setInitFailed(true);
        return;
      }
      setRepeatSession({ phrases: shufflePhrases(phrases), index: 0 });
      setSitztConfirmedPhraseIds([]);
      setShowStackCompleteNote(false);
      setShowQuizOptions(false);
      setQuizOptions([]);
      setSelectedOptionId(null);
      setAnswerLocked(false);
    } catch {
      setInitFailed(true);
    }
  }, [
    purchaseResolved,
    purchaseState,
    params.phraseIds,
    params.moduleCode,
    byId,
    sentencesPack,
  ]);

  useEffect(() => {
    const phrases = repeatSession?.phrases;
    if (!phrases?.length) return;
    preloadPhraseAudio(phrases.map((p) => p.id), sessionModule);
  }, [repeatSession?.phrases, sessionModule]);

  useEffect(() => {
    if (initFailed) {
      router.back();
    }
  }, [initFailed, router]);

  const persistPinned = async (ids: number[]) => {
    setPinnedIds(ids);
    await persistPinnedIdsForModule(sessionModule, ids);
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

  useEffect(() => {
    isReleasedRef.current = false;
  }, [sessionIndex]);

  const sitztDoneForCurrent =
    currentPhrase != null &&
    sitztConfirmedPhraseIds.includes(currentPhrase.id);

  const chapterPhrasesPool = useMemo(() => {
    if (!currentPhrase) return [];
    return sentencesPack.filter(
      (p) => p.chapterId === currentPhrase.chapterId,
    );
  }, [currentPhrase, sentencesPack]);

  useEffect(() => {
    try {
      if (isReleasedRef.current) return;
      safePlayerPause(sessionTestPlaybackPlayer);
    } catch {
      /* ignore */
    }
    setShowQuizOptions(false);
    setQuizOptions([]);
    setSelectedOptionId(null);
    setAnswerLocked(false);
  }, [currentPhrase?.id, sessionTestPlaybackPlayer]);

  const onOpenQuizOptions = useCallback(() => {
    if (!currentPhrase) return;
    setShowQuizOptions(true);
    setQuizOptions(buildQuizOptions(currentPhrase, chapterPhrasesPool));
  }, [currentPhrase, chapterPhrasesPool]);

  const onPickQuizOption = useCallback(
    (optionPhraseId: number) => {
      if (answerLocked || !currentPhrase) return;
      setAnswerLocked(true);
      setSelectedOptionId(optionPhraseId);
      const isCorrect = optionPhraseId === currentPhrase.id;
      if (isCorrect) {
        void (async () => {
          try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } catch {
            /* ignore */
          }
        })();
        void (async () => {
          try {
            if (isReleasedRef.current) return;
            const src = audioAssets['correct1'];
            if (!src) throw new Error('missing asset');
            await setAudioModeAsync({
              playsInSilentMode: true,
              allowsRecording: false,
              interruptionMode: 'duckOthers',
              shouldPlayInBackground: false,
              shouldRouteThroughEarpiece: false,
            });
            if (isReleasedRef.current) return;
            safePlayerReplace(sitztFxPlayer, src);
            if (isReleasedRef.current) return;
            safePlayerPlay(sitztFxPlayer);
          } catch {
            try {
              if (isReleasedRef.current) return;
              safePlayerPause(sitztFxPlayer);
            } catch {
              /* ignore */
            }
          }
        })();
      } else {
        void (async () => {
          try {
            await Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Error,
            );
          } catch {
            /* ignore */
          }
        })();
      }
    },
    [answerLocked, currentPhrase, sitztFxPlayer],
  );

  const goBack = () => router.back();

  const onSessionPinTap = async () => {
    setShowStackCompleteNote(false);
    setShowQuizOptions(false);
    setQuizOptions([]);
    setSelectedOptionId(null);
    setAnswerLocked(false);
    try {
      if (isReleasedRef.current) return;
      safePlayerPause(sessionTestPlaybackPlayer);
    } catch {
      /* ignore */
    }
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
    if (
      !answerLocked ||
      selectedOptionId !== currentPhrase.id ||
      sitztDoneForCurrent
    ) {
      return;
    }
    const id = currentPhrase.id;
    const isLastCard = sessionPhrases.length === 1;

    const newPinned = pinnedIds.filter((x) => x !== id);
    await persistPinned(newPinned);
    setSitztConfirmedPhraseIds((prev) => [...prev, id]);

    if (!isLastCard) return;

    setShowStackCompleteNote(true);
    try {
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
    } catch {
      /* ignore */
    }
    try {
      if (isReleasedRef.current) return;
      const tadaSrc = audioAssets['tada'];
      if (!tadaSrc) throw new Error('missing asset');
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: false,
        interruptionMode: 'duckOthers',
        shouldPlayInBackground: false,
        shouldRouteThroughEarpiece: false,
      });
      if (isReleasedRef.current) return;
      safePlayerReplace(celebrationPlayer, tadaSrc);
      if (isReleasedRef.current) return;
      safePlayerPlay(celebrationPlayer);
    } catch {
      try {
        if (isReleasedRef.current) return;
        safePlayerPause(celebrationPlayer);
      } catch {
        /* ignore */
      }
    }
  };

  const onNaechste = () => {
    setShowStackCompleteNote(false);
    setShowQuizOptions(false);
    setQuizOptions([]);
    setSelectedOptionId(null);
    setAnswerLocked(false);
    try {
      if (isReleasedRef.current) return;
      safePlayerPause(sessionTestPlaybackPlayer);
    } catch {
      /* ignore */
    }
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
      <View style={[styles.screen, { backgroundColor: colors.screenBg }]}>
        <View style={styles.sessionFontWait}>
          <ActivityIndicator size="large" color={colors.accentBlue} />
        </View>
      </View>
    );
  }

  const y = sessionPhrases.length;
  const progressLabel =
    sessionDone || y === 0 ? '' : `${sessionIndex + 1} / ${y} Karten`;

  return (
    <View style={[styles.screen, { backgroundColor: colors.screenBg }]}>
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
                          ? colors.accentRed
                          : colors.accentBlue
                      }
                    />
                  </Pressable>
                </View>

                {!showQuizOptions ? (
                  <View style={styles.sessionCardMid}>
                    <View style={styles.sessionNumRow}>
                      <Text style={styles.sessionBigNum}>
                        {sessionIndex + 1}
                      </Text>
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
                    {showStackCompleteNote ? (
                      <Text style={styles.stackCompleteBanner}>
                        Geschafft! Dein Stapel ist leer.
                      </Text>
                    ) : null}
                    <View style={styles.categoryPill}>
                      <Text style={styles.categoryPillText}>
                        {currentPhrase.category}
                      </Text>
                    </View>
                  </View>
                ) : null}

                <View style={styles.sessionBottom}>
                  {!showQuizOptions ? (
                    <View style={styles.sessionPhase1Wrap}>
                      <SessionChrisAnnButtons
                        player={sessionTestPlaybackPlayer}
                        phraseId={currentPhrase.id}
                        moduleCode={sessionModule}
                        showOptions={showQuizOptions}
                        onOpenOptionsAfterFirstVoice={onOpenQuizOptions}
                        compact={false}
                        isReleasedRef={isReleasedRef}
                        sessionStyles={styles}
                      />
                      <Text style={styles.sessionPhase1Hint}>
                        Hör den Satz an – welche deutsche Bedeutung passt?
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.sessionQuizColumn}>
                      <View style={styles.sessionPhase2TopRow}>
                        <SessionChrisAnnButtons
                          player={sessionTestPlaybackPlayer}
                          phraseId={currentPhrase.id}
                          moduleCode={sessionModule}
                          showOptions={showQuizOptions}
                          onOpenOptionsAfterFirstVoice={onOpenQuizOptions}
                          compact
                          isReleasedRef={isReleasedRef}
                          sessionStyles={styles}
                        />
                      </View>
                      <View style={styles.sessionQuizOptionsBlock}>
                        {quizOptions.map((opt, i) => {
                          const letter = ['A', 'B', 'C'][i] ?? '?';
                          const correctId = currentPhrase.id;
                          const label = opt.german;
                          let rowBg = colors.screenBg;
                          if (answerLocked) {
                            if (opt.id === correctId) {
                              rowBg = '#2E7D32';
                            } else if (opt.id === selectedOptionId) {
                              rowBg = '#C8102E';
                            }
                          }
                          const onColored =
                            answerLocked &&
                            (opt.id === correctId ||
                              opt.id === selectedOptionId);
                          const textCol = onColored
                            ? colors.buttonOnAccent
                            : colors.textPrimary;
                          const letterCol = onColored
                            ? colors.buttonOnAccent
                            : colors.tabActive;
                          const showCheckBefore =
                            answerLocked && opt.id === correctId;
                          return (
                            <Pressable
                              key={`${opt.id}-${i}`}
                              accessibilityRole="button"
                              accessibilityLabel={`Antwort ${letter}`}
                              disabled={answerLocked}
                              onPress={() => onPickQuizOption(opt.id)}
                              style={({ pressed }) => [
                                styles.sessionQuizOptionRow,
                                {
                                  backgroundColor: rowBg,
                                },
                                !answerLocked &&
                                  pressed && { opacity: 0.92 },
                              ]}
                            >
                              <View style={styles.sessionQuizOptionRowInner}>
                                <Text
                                  style={[
                                    styles.sessionQuizOptionLetter,
                                    {
                                      color: letterCol,
                                      minWidth: 28,
                                    },
                                  ]}
                                >
                                  {letter}
                                </Text>
                                <Text
                                  style={[
                                    styles.sessionQuizOptionText,
                                    { color: textCol },
                                  ]}
                                >
                                  {showCheckBefore ? '✓ ' : ''}
                                  {label}
                                </Text>
                              </View>
                            </Pressable>
                          );
                        })}
                      </View>
                      {answerLocked ? (
                        <View
                          style={[
                            styles.sessionFooterRow,
                            styles.sessionQuizFooterPinned,
                          ]}
                        >
                          {selectedOptionId === currentPhrase.id ? (
                            <>
                              <Pressable
                                onPress={() => void onSitzt()}
                                disabled={sitztDoneForCurrent}
                                style={({ pressed }) => [
                                  styles.sitztBtn,
                                  sitztDoneForCurrent && styles.sitztBtnDone,
                                  pressed &&
                                    !sitztDoneForCurrent && {
                                      opacity: 0.85,
                                    },
                                ]}
                                accessibilityRole="button"
                                accessibilityLabel="Sitzt"
                              >
                                <Text
                                  style={[
                                    styles.sitztBtnText,
                                    sitztDoneForCurrent &&
                                      styles.sitztBtnTextDone,
                                  ]}
                                >
                                  {sitztDoneForCurrent
                                    ? '✓ Sitzt! ✓'
                                    : '✓ Sitzt!'}
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
                                <Text style={styles.naechsteBtnText}>
                                  Nächste →
                                </Text>
                              </Pressable>
                            </>
                          ) : (
                            <Pressable
                              onPress={onNaechste}
                              style={({ pressed }) => [
                                styles.naechsteBtn,
                                styles.naechsteBtnFullWidth,
                                pressed && { opacity: 0.92 },
                              ]}
                              accessibilityRole="button"
                              accessibilityLabel="Nächste Karte"
                            >
                              <Text style={styles.naechsteBtnText}>
                                Nächste →
                              </Text>
                            </Pressable>
                          )}
                        </View>
                      ) : null}
                    </View>
                  )}
                </View>
              </>
            ) : (
              <View style={styles.sessionFontWait}>
                <ActivityIndicator size="large" color={colors.accentBlue} />
              </View>
            )}
          </View>
        </View>
      </View>
      {showStackCompleteNote ? (
        <View pointerEvents="none" style={styles.sessionConfettiLayer}>
          <ConfettiCannon
            ref={sessionConfettiRef}
            count={200}
            origin={{
              x: Dimensions.get('window').width / 2,
              y: -10,
            }}
            autoStart={false}
            fadeOut
          />
        </View>
      ) : null}
    </View>
  );
}

function createRepeatSessionStyles(c: AppPalette) {
  return StyleSheet.create({
  screen: {
    flex: 1,
    position: 'relative',
  },
  sessionConfettiLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  sessionHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 12,
    backgroundColor: c.screenBg,
  },
  sessionHeaderSide: {
    width: 100,
  },
  sessionBackText: {
    fontSize: 17,
    fontWeight: '600',
    color: c.accentBlue,
  },
  sessionProgressText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: c.textPrimary,
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
    backgroundColor: c.screenBg,
    borderRadius: 28,
    marginVertical: 8,
    ...Platform.select({
      android: { elevation: 12 },
      ios: {
        shadowColor: c.shadowColor,
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
    backgroundColor: c.cardBg,
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
    color: c.tabInactive,
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
    color: c.tabActive,
    fontSize: 56,
    fontWeight: '700',
    lineHeight: 60,
  },
  sessionNumHint: {
    color: c.textSecondary,
    fontSize: 15,
    marginBottom: 8,
  },
  sessionEnglish: {
    color: c.textPrimary,
    fontSize: 26,
    lineHeight: 34,
    marginTop: 12,
  },
  stackCompleteBanner: {
    marginTop: 14,
    fontSize: 17,
    fontWeight: '700',
    color: c.tabActive,
    textAlign: 'center',
  },
  categoryPill: {
    alignSelf: 'flex-start',
    marginTop: 14,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 100,
    backgroundColor: c.categoryPillBg,
  },
  categoryPillText: {
    color: c.textPrimary,
    fontSize: 13,
    fontWeight: '500',
  },
  sessionBottom: {
    flex: 1,
    minHeight: 0,
    marginTop: 8,
  },
  sessionPhase1Wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    width: '100%',
    flex: 1,
  },
  sessionPhase1Hint: {
    marginTop: 16,
    fontSize: 14,
    color: c.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  sessionPhase2TopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    marginBottom: 20,
    gap: 10,
  },
  sessionQuizColumn: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    paddingBottom: 28,
  },
  sessionQuizOptionsBlock: {
    flex: 1,
    minHeight: 0,
    width: '100%',
  },
  sessionQuizOptionRow: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    ...Platform.select({
      android: { elevation: 3 },
      ios: {
        shadowColor: c.shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
    }),
  },
  sessionQuizOptionRowInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  sessionQuizOptionLetter: {
    fontSize: 18,
    fontWeight: '700',
  },
  sessionQuizOptionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  sessionTestVoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
    maxWidth: 340,
  },
  sessionTestVoiceRowCompact: {
    flex: 1,
    maxWidth: undefined,
    minWidth: 0,
  },
  sessionTestVoiceBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionTestVoiceBtnCompact: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  sessionTestVoiceBtnInner: {
    alignItems: 'center',
  },
  sessionTestVoiceAvatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 999,
    overflow: 'hidden',
  },
  sessionTestVoiceAvatarImg: {
    width: 72,
    height: 72,
  },
  sessionTestVoiceBtnText: {
    fontSize: 13,
    color: c.tabInactive,
    textAlign: 'center',
    marginTop: 4,
  },
  sessionFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  sessionQuizFooterPinned: {
    marginTop: 'auto',
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
    backgroundColor: c.accentRed,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    minWidth: 0,
  },
  naechsteBtnFullWidth: {
    flexGrow: 1,
    width: '100%',
  },
  naechsteBtnText: {
    color: c.buttonOnAccent,
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
    color: c.tabActive,
    textAlign: 'center',
  },
  sessionCompleteSub: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 24,
    color: c.textSecondary,
    textAlign: 'center',
  },
  sessionCompleteBtn: {
    marginTop: 28,
    backgroundColor: c.accentRed,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  sessionCompleteBtnText: {
    color: c.buttonOnAccent,
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
}
