import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import type { AudioPlayer } from 'expo-audio';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useFonts } from 'expo-font';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ConfettiCannon from 'react-native-confetti-cannon';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
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
  AUDIO_SPEED_KEY,
  audioSpeedToRate,
  parseAudioSpeed,
} from '../../constants/audioSettingsStorage';
import Header from '../../components/Header';
import PhraseCard from '../../components/PhraseCard';
import {
  preloadFirstPhrasesOfCurrentChapter,
  preloadPhraseAudio,
} from '../../utils/audioPreloader';
import type { AppPalette } from '../../constants/themePalettes';
import { FONT_DM_SERIF } from '../../constants/theme';
import { STRINGS } from '../../constants/strings';
import { useAppTheme } from '../../context/AppThemeContext';
import { audioAssets } from '../../utils/audioAssets';
import { buildQuizOptions, phraseAudioSource, shufflePhrases } from '../../utils/phraseUtils';
import {
  safePlayerPause,
  safePlayerPlay,
  safePlayerReplace,
  safePlayerSetPlaybackRate,
} from '../../utils/safeAudioPlayer';
import {
  applyChapterProgressUpdatesAsync,
  LAST_POSITION_KEY,
  loadPinnedIdsForModule,
  persistPinnedIdsForModule,
  resolveHomeResume,
} from '../../constants/learningResume';
import {
  getSentencesForModule,
  type SentenceRecord,
} from '../../constants/sentencePacks';
import {
  INITIAL_MODULE_PURCHASE_STATE,
  isChapterLockedWithoutPurchase,
  loadModulePurchaseState,
  type ModulePurchaseState,
} from '../../constants/chapterUnlock';
import type { ModuleCode } from '../../constants/products';

const CHRIS_AVATAR = require('../../assets/chris.png');
const ANN_AVATAR = require('../../assets/ann.png');

type Phrase = SentenceRecord;


function TestChrisAnnButtons({
  player,
  phraseId,
  moduleCode,
  showOptions,
  onOpenOptionsAfterFirstVoice,
  compact,
  homeStyles,
}: {
  player: AudioPlayer;
  phraseId: number;
  moduleCode: ModuleCode;
  showOptions: boolean;
  onOpenOptionsAfterFirstVoice: () => void;
  compact: boolean;
  homeStyles: ReturnType<typeof createHomeStyles>;
}) {
  const showOptionsRef = useRef(showOptions);
  useEffect(() => {
    showOptionsRef.current = showOptions;
  }, [showOptions]);

  useEffect(() => {
    return () => {
      safePlayerPause(player);
    };
  }, [player]);

  const playVoice = useCallback(
    async (gender: 'm' | 'f') => {
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
        safePlayerPause(player);
        safePlayerReplace(player, src);
        for (let i = 0; i < 60; i++) {
          if (player.currentStatus.duration > 0) break;
          await new Promise<void>((r) => setTimeout(r, 40));
        }
        if (player.currentStatus.duration <= 0) return;
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: false,
          interruptionMode: 'duckOthers',
          shouldPlayInBackground: false,
          shouldRouteThroughEarpiece: false,
        });
        safePlayerPause(player);
        await player.seekTo(0);
        safePlayerSetPlaybackRate(player, rate, 'medium');
        safePlayerPlay(player);
      } catch {
        safePlayerPause(player);
      }
    },
    [moduleCode, onOpenOptionsAfterFirstVoice, player, phraseId],
  );

  const btnStyle = compact
    ? homeStyles.testVoiceBtnCompact
    : homeStyles.testVoiceBtn;

  return (
    <View
      style={[
        homeStyles.testVoiceRow,
        compact && homeStyles.testVoiceRowCompact,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={STRINGS.a11yChrisMaleVoice}
        onPress={() => void playVoice('m')}
        style={({ pressed }) => [
          btnStyle,
          pressed && { opacity: 0.9 },
        ]}
      >
        <View style={homeStyles.testVoiceBtnInner}>
          <View style={homeStyles.testVoiceAvatarWrap}>
            <Image
              source={CHRIS_AVATAR}
              style={homeStyles.testVoiceAvatarImg}
              resizeMode="cover"
            />
          </View>
          <Text style={homeStyles.testVoiceBtnText}>{STRINGS.voiceChris}</Text>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={STRINGS.a11yAnnFemaleVoice}
        onPress={() => void playVoice('f')}
        style={({ pressed }) => [
          btnStyle,
          pressed && { opacity: 0.9 },
        ]}
      >
        <View style={homeStyles.testVoiceBtnInner}>
          <View style={homeStyles.testVoiceAvatarWrap}>
            <Image
              source={ANN_AVATAR}
              style={homeStyles.testVoiceAvatarImg}
              resizeMode="cover"
            />
          </View>
          <Text style={homeStyles.testVoiceBtnText}>{STRINGS.voiceAnn}</Text>
        </View>
      </Pressable>
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({
    [FONT_DM_SERIF]: require('../../assets/fonts/DMSerifDisplay-Regular.ttf'),
  });

  const { colors } = useAppTheme();
  const styles = useMemo(() => createHomeStyles(colors), [colors]);

  const [currentChapter, setCurrentChapter] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [isTestMode, setIsTestMode] = useState(false);
  const [testPhrases, setTestPhrases] = useState<Phrase[]>([]);
  const [testIndex, setTestIndex] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState<number[]>([]);
  const [currentOptions, setCurrentOptions] = useState<Phrase[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [answerLocked, setAnswerLocked] = useState(false);
  const [activeTestKind, setActiveTestKind] = useState<1 | 2 | null>(null);
  const [showTestDone, setShowTestDone] = useState(false);
  const [pinnedIds, setPinnedIds] = useState<number[]>([]);
  const [purchaseState, setPurchaseState] = useState<ModulePurchaseState>(
    INITIAL_MODULE_PURCHASE_STATE,
  );
  const [learningModule, setLearningModule] = useState<ModuleCode>('101');
  const [bootReady, setBootReady] = useState(false);
  const [showTestSelection, setShowTestSelection] = useState(false);

  const sentences = useMemo(
    () => getSentencesForModule(learningModule),
    [learningModule],
  );
  const totalPhrases = sentences.length;

  const persistPosition = useCallback(
    (chapterId: number, phraseIndex: number) => {
      void AsyncStorage.setItem(
        LAST_POSITION_KEY,
        JSON.stringify({
          chapterId,
          phraseIndex,
          moduleCode: learningModule,
        }),
      );
    },
    [learningModule],
  );

  const persistOnNext = useCallback(
    (chapterId: number, phraseIndex: number) => {
      persistPosition(chapterId, phraseIndex);
      void applyChapterProgressUpdatesAsync(learningModule, [
        { chapterId, phraseIndex },
      ]);
    },
    [learningModule, persistPosition],
  );
  const showOptionsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const testPlaybackPlayer = useAudioPlayer(null, { updateInterval: 100 });
  const feedbackPlayer = useAudioPlayer(null, { updateInterval: 100 });
  const testConfettiRef = useRef<InstanceType<typeof ConfettiCannon> | null>(
    null,
  );
  const testResultFxFiredRef = useRef(false);
  const testDiscoSpin = useRef(new Animated.Value(0)).current;
  const spin = useMemo(
    () =>
      testDiscoSpin.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
      }),
    [testDiscoSpin],
  );

  useEffect(() => {
    if (!showTestDone || testPhrases.length === 0) {
      testDiscoSpin.setValue(0);
      return;
    }
    const pct =
      ((testPhrases.length - wrongAnswers.length) / testPhrases.length) * 100;
    if (pct < 80) {
      testDiscoSpin.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(testDiscoSpin, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => {
      loop.stop();
      testDiscoSpin.setValue(0);
    };
  }, [
    showTestDone,
    wrongAnswers.length,
    testPhrases.length,
    testDiscoSpin,
  ]);

  const playFeedbackSound = useCallback(
    async (key: string) => {
      const src = audioAssets[key];
      if (!src) return;
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: false,
          interruptionMode: 'duckOthers',
          shouldPlayInBackground: false,
          shouldRouteThroughEarpiece: false,
        });
        safePlayerReplace(feedbackPlayer, src);
        safePlayerPlay(feedbackPlayer);
      } catch {
        safePlayerPause(feedbackPlayer);
      }
    },
    [feedbackPlayer],
  );

  useEffect(() => {
    if (!showTestDone) {
      testResultFxFiredRef.current = false;
      return;
    }
    if (testPhrases.length === 0) return;
    if (testResultFxFiredRef.current) return;
    const pct =
      ((testPhrases.length - wrongAnswers.length) / testPhrases.length) * 100;
    if (wrongAnswers.length === 0) {
      testResultFxFiredRef.current = true;
      void (async () => {
        try {
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          );
        } catch {
          /* ignore */
        }
      })();
      void (async () => {
        try {
          await playFeedbackSound('chris-das-war-spitze');
        } catch {
          /* ignore */
        }
      })();
      try {
        requestAnimationFrame(() => {
          try {
            testConfettiRef.current?.start();
          } catch {
            /* ignore */
          }
        });
      } catch {
        /* ignore */
      }
    } else if (pct >= 80) {
      testResultFxFiredRef.current = true;
      void (async () => {
        try {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch {
          /* ignore */
        }
      })();
      void (async () => {
        try {
          await playFeedbackSound('ann-gut-gemacht');
        } catch {
          /* ignore */
        }
      })();
    }
  }, [
    showTestDone,
    testPhrases.length,
    wrongAnswers.length,
    playFeedbackSound,
  ]);

  useEffect(() => {
    setShowTestSelection(false);
  }, [currentChapter]);

  useFocusEffect(
    useCallback(() => {
      setIsTestMode(false);
      setShowTestDone(false);
      setShowTestSelection(false);
      setTestIndex(0);
      setWrongAnswers([]);
      setCurrentOptions([]);
      setSelectedOptionId(null);
      setShowOptions(false);
      setAnswerLocked(false);
      void (async () => {
        try {
          const { module, chapterId, phraseIndex } = await resolveHomeResume();
          const pack = getSentencesForModule(module);
          setLearningModule(module);
          setPinnedIds(await loadPinnedIdsForModule(module));
          void loadModulePurchaseState().then(setPurchaseState);
          const maxInCh = pack.filter((p) => p.chapterId === chapterId).length;
          const clampedIdx =
            pack.length === 0
              ? 0
              : Math.min(Math.max(0, phraseIndex), maxInCh);
          setCurrentChapter(chapterId);
          setCurrentIndex(clampedIdx);
        } catch {
        } finally {
          setBootReady(true);
        }
      })();
    }, []),
  );

  const chPhrases = useMemo(
    () =>
      sentences.filter((p) => p.chapterId === currentChapter).sort(
        (a, b) => a.id - b.id,
      ) as Phrase[],
    [currentChapter, sentences],
  );
  const chapterPhraseIds = useMemo(
    () => chPhrases.map((p) => p.id),
    [chPhrases],
  );
  const chCount = chPhrases.length;
  const categoryTitle = chPhrases[0]?.category ?? `${STRINGS.chapterWord} ${currentChapter}`;

  useEffect(() => {
    if (!bootReady) return;
    if (chPhrases.length === 0) return;
    preloadFirstPhrasesOfCurrentChapter(chPhrases, learningModule);
  }, [bootReady, learningModule, currentChapter, chPhrases]);

  const phrasesBefore = useMemo(
    () => sentences.filter((p) => p.chapterId < currentChapter).length,
    [currentChapter, sentences],
  );

  const mergeWrongIntoPinned = useCallback(
    (wrongIds: number[]) => {
      setPinnedIds((prev) => {
        const next = [...prev];
        for (const wid of wrongIds) {
          const meta = sentences.find((p) => p.id === wid);
          if (
            meta &&
            isChapterLockedWithoutPurchase(
              learningModule,
              meta.chapterId,
              purchaseState,
            )
          ) {
            continue;
          }
          if (!next.includes(wid)) next.push(wid);
        }
        void persistPinnedIdsForModule(learningModule, next);
        return next;
      });
    },
    [purchaseState, learningModule, sentences],
  );

  useEffect(() => {
    safePlayerPause(testPlaybackPlayer);
    if (!isTestMode || showTestSelection) return;
    if (testPhrases.length === 0) return;
    if (testIndex >= testPhrases.length) return;
    const correct = testPhrases[testIndex];
    if (!correct) return;
    if (showOptionsTimerRef.current) {
      clearTimeout(showOptionsTimerRef.current);
      showOptionsTimerRef.current = null;
    }
    setCurrentOptions(buildQuizOptions(correct, chPhrases));
    setSelectedOptionId(null);
    setShowOptions(false);
    setAnswerLocked(false);
  }, [isTestMode, showTestSelection, testIndex, testPhrases, chPhrases]);

  const onOpenOptionsAfterFirstVoice = useCallback(() => {
    setShowOptions(true);
  }, []);

  const onPickTestOption = useCallback(
    (optionPhraseId: number) => {
      if (answerLocked) return;
      const correct = testPhrases[testIndex];
      if (!correct) return;
      setAnswerLocked(true);
      setSelectedOptionId(optionPhraseId);
      const isCorrect = optionPhraseId === correct.id;
      const delay = isCorrect ? 1000 : 2000;
      if (isCorrect) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        void (async () => {
          try {
            await playFeedbackSound('correct1');
          } catch {
            /* ignore */
          }
        })();
      } else {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Error,
        );
      }

      setWrongAnswers((prev) => {
        const nextWrong = isCorrect ? prev : [...prev, correct.id];
        setTimeout(() => {
          setTestIndex((currentIdx) => {
            if (currentIdx + 1 >= testPhrases.length) {
              setIsTestMode(false);
              setShowTestDone(true);
              void mergeWrongIntoPinned(nextWrong);
              return testPhrases.length;
            }
            return currentIdx + 1;
          });
        }, delay);
        return nextWrong;
      });
    },
    [
      answerLocked,
      mergeWrongIntoPinned,
      playFeedbackSound,
      testIndex,
      testPhrases,
    ],
  );

  const isChapterComplete = chCount > 0 && currentIndex >= chCount;
  const isAllPhrasesComplete = isChapterComplete && currentChapter === 7;
  const inChapterN = isChapterComplete ? chCount : currentIndex + 1;

  const completedForProgress =
    phrasesBefore + (isChapterComplete ? chCount : currentIndex);
  const globalBarPct =
    totalPhrases > 0
      ? Math.min(
          100,
          Math.round(
            (completedForProgress / totalPhrases) * 10000,
          ) / 100,
        )
      : 0;
  const globalProgressText = `${Math.min(
    totalPhrases,
    completedForProgress,
  )}/${totalPhrases}`;

  const advanceToNextChapter = () => {
    if (currentChapter < 7) {
      setCurrentChapter((c) => c + 1);
      setCurrentIndex(0);
    }
  };

  const startTest = (testNumber: 1 | 2) => {
    if (showOptionsTimerRef.current) {
      clearTimeout(showOptionsTimerRef.current);
      showOptionsTimerRef.current = null;
    }
    setShowTestSelection(false);
    setActiveTestKind(testNumber);
    const shuffled = shufflePhrases(chPhrases);
    const limited = shuffled.slice(0, 8);
    preloadPhraseAudio(limited.map((p) => p.id), learningModule);
    setTestPhrases(limited);
    setTestIndex(0);
    setWrongAnswers([]);
    setCurrentOptions([]);
    setSelectedOptionId(null);
    setShowOptions(false);
    setAnswerLocked(false);
    setShowTestDone(false);
    setIsTestMode(true);
  };

  const exitTest = () => {
    if (showOptionsTimerRef.current) {
      clearTimeout(showOptionsTimerRef.current);
      showOptionsTimerRef.current = null;
    }
    safePlayerPause(testPlaybackPlayer);
    setIsTestMode(false);
    setActiveTestKind(null);
    setTestIndex(0);
    setWrongAnswers([]);
    setCurrentOptions([]);
    setSelectedOptionId(null);
    setShowOptions(false);
    setAnswerLocked(false);
    setShowTestDone(false);
  };

  const onNext = () => {
    if (isAllPhrasesComplete) {
      return;
    }
    if (isChapterComplete) {
      if (currentChapter < 7) {
        const nextCh = currentChapter + 1;
        setCurrentChapter(nextCh);
        setCurrentIndex(0);
        persistPosition(nextCh, 0);
        void applyChapterProgressUpdatesAsync(learningModule, [
          { chapterId: currentChapter, phraseIndex: chCount },
          { chapterId: nextCh, phraseIndex: 0 },
        ]);
      }
      return;
    }
    if (currentIndex < chCount - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      persistOnNext(currentChapter, nextIdx);
    } else {
      setCurrentIndex(chCount);
      persistOnNext(currentChapter, chCount);
    }
  };

  const onNextChapter = advanceToNextChapter;

  const onBack = () => {
    setShowTestSelection(false);
    if (isAllPhrasesComplete) {
      setCurrentIndex(chCount - 1);
      return;
    }
    if (isChapterComplete) {
      setCurrentIndex(chCount - 1);
      return;
    }
    if (currentIndex === 0) {
      setCurrentIndex(chCount);
      return;
    }
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  const phrase = chPhrases[
    isChapterComplete ? chCount - 1 : currentIndex
  ] as Phrase | undefined;

  const phraseIdForCard = (() => {
    const fromPhrase = phrase?.id;
    if (typeof fromPhrase === 'number' && fromPhrase > 0) {
      return fromPhrase;
    }
    const first = chPhrases[0]?.id;
    if (typeof first === 'number' && first > 0) {
      return first;
    }
    return 1;
  })();

  const testScorePct =
    showTestDone && testPhrases.length > 0
      ? ((testPhrases.length - wrongAnswers.length) / testPhrases.length) *
        100
      : 0;
  const testShowDiscoBall = showTestDone && testScorePct >= 80;
  const testIsPerfect = showTestDone && wrongAnswers.length === 0;

  if (!fontsLoaded || !bootReady) {
    return (
      <View style={[styles.home, styles.homeLoading, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.accentBlue} />
      </View>
    );
  }

  if (sentences.length === 0) {
    return (
      <View style={[styles.home, { backgroundColor: colors.screenBg }]}>
        <Header moduleCode={learningModule} chapterNumber={currentChapter} />
        <View style={[styles.homeBody, styles.homeEmptyPack]}>
          <Text style={styles.homeEmptyPackText}>
            {STRINGS.homeEmptyPack}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.home, { backgroundColor: colors.screenBg }]}>
      <Header moduleCode={learningModule} chapterNumber={currentChapter} />
      <View style={styles.homeBody}>
        {showTestSelection ? (
          <View style={styles.testSelectionOuter}>
            <View style={styles.testSelectionShadow}>
              <View style={styles.testSelectionCard}>
                <ScrollView
                  style={styles.testSelectionScroll}
                  contentContainerStyle={styles.testSelectionScrollContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <Text
                    style={[
                      styles.testSelectionTitle,
                      { fontFamily: FONT_DM_SERIF },
                    ]}
                  >
                    {STRINGS.testChooseTitle}
                  </Text>

                  <View style={styles.testBlock}>
                    <Text style={styles.testBlockLabel}>{STRINGS.test1Label}</Text>
                    <Text style={styles.testBlockBody}>
                      {STRINGS.test1Body}
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={STRINGS.test1StartA11y}
                      onPress={() => startTest(1)}
                      style={({ pressed }) => [
                        styles.testBlockBtn,
                        styles.testBlockBtnPrimary,
                        pressed && { opacity: 0.92 },
                      ]}
                    >
                      <Text style={styles.testBlockBtnText}>
                        {STRINGS.test1Start}
                      </Text>
                    </Pressable>
                  </View>

                  <View style={styles.testBlock}>
                    <Text style={styles.testBlockLabel}>{STRINGS.test2Label}</Text>
                    <Text style={styles.testBlockBody}>
                      {STRINGS.test2Body}
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={STRINGS.test2StartA11y}
                      onPress={() => startTest(2)}
                      style={({ pressed }) => [
                        styles.testBlockBtn,
                        styles.testBlockBtnAccent,
                        pressed && { opacity: 0.92 },
                      ]}
                    >
                      <Text style={styles.testBlockBtnText}>
                        {STRINGS.test2Start}
                      </Text>
                    </Pressable>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={STRINGS.back}
                    onPress={() => setShowTestSelection(false)}
                    style={({ pressed }) => [
                      styles.testSelectionBack,
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Text style={styles.testSelectionBackText}>{STRINGS.back}</Text>
                  </Pressable>
                </ScrollView>
              </View>
            </View>
          </View>
        ) : showTestDone ? (
          <View style={styles.testSelectionOuter}>
            <View style={styles.testSelectionShadow}>
              <View
                style={[
                  styles.testSelectionCard,
                  styles.testResultCardInner,
                  testIsPerfect && styles.testResultCardConfetti,
                ]}
              >
                {testIsPerfect ? (
                  <View
                    pointerEvents="none"
                    style={styles.testConfettiLayer}
                  >
                    <ConfettiCannon
                      ref={testConfettiRef}
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
                <ScrollView
                  style={[styles.testSelectionScroll, styles.testResultScroll]}
                  contentContainerStyle={styles.testResultScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  <Text
                    style={[
                      styles.testResultScreenTitle,
                      { fontFamily: FONT_DM_SERIF },
                    ]}
                  >
                    {STRINGS.testCompletedTitle}
                  </Text>
                  <Text style={styles.testResultScoreBig}>
                    {testPhrases.length - wrongAnswers.length} /{' '}
                    {testPhrases.length}
                  </Text>
                  <Text style={styles.testResultScoreLabel}>
                    {STRINGS.correctAnswersLabel}
                  </Text>
                  {wrongAnswers.length > 0 ? (
                    <Text style={styles.testResultRepeatNote}>
                      {wrongAnswers.length === 1
                        ? STRINGS.repeatNoteOneCard
                        : `${wrongAnswers.length}${STRINGS.repeatNoteManyCards}`}
                    </Text>
                  ) : null}
                  {testShowDiscoBall ? (
                    <View
                      style={
                        wrongAnswers.length > 0
                          ? styles.testDiscoWrapAfterNote
                          : undefined
                      }
                    >
                      <Animated.Image
                        source={require('../../assets/images/logo.png')}
                        style={[
                          styles.testResultDiscoBall,
                          wrongAnswers.length > 0
                            ? styles.testResultDiscoBallAfterNote
                            : undefined,
                          { transform: [{ rotate: spin }] },
                        ]}
                        accessibilityLabel={STRINGS.testResultDiscoA11y}
                      />
                      {testIsPerfect ? (
                        <Text style={styles.testResultPerfectCaption}>
                          {STRINGS.testPerfectCaption}
                        </Text>
                      ) : null}
                    </View>
                  ) : null}
                  {activeTestKind != null ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={
                        activeTestKind === 1
                          ? STRINGS.testSwitchToTest2A11y
                          : STRINGS.testSwitchToTest1A11y
                      }
                      onPress={() =>
                        startTest(activeTestKind === 1 ? 2 : 1)
                      }
                      style={({ pressed }) => [
                        styles.testResultBtnOtherTest,
                        {
                          backgroundColor:
                            activeTestKind === 1 ? colors.accentRed : colors.tabActive,
                        },
                        pressed && { opacity: 0.92 },
                      ]}
                    >
                      <Text style={styles.testResultBtnPrimaryText}>
                        {activeTestKind === 1
                          ? STRINGS.test2StartArrow
                          : STRINGS.test1StartArrow}
                      </Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={STRINGS.backToOverviewA11y}
                    onPress={exitTest}
                    style={({ pressed }) => [
                      styles.testResultBtnSecondary,
                      styles.testResultBtnAfterSwitch,
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Text style={styles.testResultBtnSecondaryText}>
                      {STRINGS.backToOverview}
                    </Text>
                  </Pressable>
                  {currentChapter < 7 ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={STRINGS.nextChapterA11y}
                      onPress={() => {
                        advanceToNextChapter();
                        exitTest();
                      }}
                      style={({ pressed }) => [
                        styles.testResultBtnPrimary,
                        styles.testResultBtnAfterBack,
                        pressed && { opacity: 0.92 },
                      ]}
                    >
                      <Text style={styles.testResultBtnPrimaryText}>
                        {STRINGS.nextChapter}
                      </Text>
                    </Pressable>
                  ) : null}
                </ScrollView>
              </View>
            </View>
          </View>
        ) : isTestMode &&
          testPhrases.length > 0 &&
          activeTestKind != null &&
          testIndex < testPhrases.length ? (
          <View style={styles.testRunColumn}>
            <Text style={styles.testRunHeaderOutside}>
              {STRINGS.testQuestionProgressPrefix}
              {testIndex + 1}
              {STRINGS.progressSlash}
              {testPhrases.length}
            </Text>
            <View style={styles.testRunProgressTrackOutside}>
              <View
                style={[
                  styles.testRunProgressFillOutside,
                  {
                    width: `${Math.round(
                      ((testIndex + 1) / testPhrases.length) * 100,
                    )}%`,
                  },
                ]}
              />
            </View>
            <View style={styles.testSelectionOuter}>
              <View style={styles.testSelectionShadow}>
                <View style={styles.testSelectionCard}>
                  {currentOptions.length < 3 || !testPhrases[testIndex] ? (
                    <View style={styles.testLoadingInner}>
                      <ActivityIndicator size="large" color={colors.tabActive} />
                    </View>
                  ) : (
                    <ScrollView
                      style={styles.testSelectionScroll}
                      contentContainerStyle={styles.testRunScrollContent}
                      showsVerticalScrollIndicator={false}
                      keyboardShouldPersistTaps="handled"
                    >
                      {!showOptions ? (
                        <View style={styles.testPhase1Wrap}>
                          <TestChrisAnnButtons
                            player={testPlaybackPlayer}
                            phraseId={testPhrases[testIndex]!.id}
                            moduleCode={learningModule}
                            showOptions={showOptions}
                            onOpenOptionsAfterFirstVoice={
                              onOpenOptionsAfterFirstVoice
                            }
                            compact={false}
                            homeStyles={styles}
                          />
                          <Text style={styles.testPlayHintPhase1}>
                            {STRINGS.testListenHint}
                          </Text>
                        </View>
                      ) : (
                        <>
                          <View style={styles.testPhase2TopRow}>
                            <TestChrisAnnButtons
                              player={testPlaybackPlayer}
                              phraseId={testPhrases[testIndex]!.id}
                              moduleCode={learningModule}
                              showOptions={showOptions}
                              onOpenOptionsAfterFirstVoice={
                                onOpenOptionsAfterFirstVoice
                              }
                              compact
                              homeStyles={styles}
                            />
                            <Ionicons
                              name="pin"
                              size={20}
                              color={
                                answerLocked &&
                                selectedOptionId !== null &&
                                selectedOptionId !==
                                  testPhrases[testIndex]!.id
                                  ? colors.accentRed
                                  : colors.textMuted
                              }
                            />
                          </View>
                          {currentOptions.map((opt, i) => {
                            const letter = ['A', 'B', 'C'][i] ?? '?';
                            const correctId = testPhrases[testIndex]!.id;
                            const label =
                              activeTestKind === 1
                                ? opt.english
                                : opt.german;
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
                                accessibilityLabel={`${STRINGS.a11yAnswerPrefix}${letter}`}
                                disabled={answerLocked}
                                onPress={() => onPickTestOption(opt.id)}
                                style={({ pressed }) => [
                                  styles.testOptionRow,
                                  {
                                    backgroundColor: rowBg,
                                  },
                                  !answerLocked &&
                                    pressed && { opacity: 0.92 },
                                ]}
                              >
                                <View style={styles.testOptionRowInner}>
                                  <Text
                                    style={[
                                      styles.testOptionLetter,
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
                                      styles.testOptionText,
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
                        </>
                      )}
                    </ScrollView>
                  )}
                </View>
              </View>
            </View>
          </View>
        ) : (
          <PhraseCard
            chapterNumber={currentChapter}
            categoryTitle={categoryTitle}
            isChapterComplete={isChapterComplete}
            isAllPhrasesComplete={isAllPhrasesComplete}
            inChapterN={inChapterN}
            currentChapterCount={chCount}
            totalPhraseCount={totalPhrases}
            globalProgressText={globalProgressText}
            globalBarPct={globalBarPct}
            english={phrase?.english ?? ''}
            german={phrase?.german ?? ''}
            category={phrase?.category ?? ''}
            currentIndex={currentIndex}
            completedChapterName={categoryTitle}
            phraseId={phraseIdForCard}
            chapterPhraseIds={chapterPhraseIds}
            moduleCode={learningModule}
            isPinned={phrase ? pinnedIds.includes(phrase.id) : false}
            onTogglePin={(id) => {
              const meta = sentences.find((p) => p.id === id);
              if (
                meta &&
                isChapterLockedWithoutPurchase(
                  learningModule,
                  meta.chapterId,
                  purchaseState,
                )
              ) {
                return;
              }
              const updated = pinnedIds.includes(id)
                ? pinnedIds.filter((x) => x !== id)
                : [...pinnedIds, id];
              setPinnedIds(updated);
              void persistPinnedIdsForModule(learningModule, updated);
            }}
            onStartTest={() => setShowTestSelection(true)}
            onNextChapter={onNextChapter}
            onBack={onBack}
            onNext={onNext}
          />
        )}
      </View>
    </View>
  );
}

function createHomeStyles(c: AppPalette) {
  return StyleSheet.create({
  home: {
    flex: 1,
    flexDirection: 'column',
  },
  homeLoading: {
    backgroundColor: c.screenBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeBody: {
    flex: 1,
    flexDirection: 'column',
    minHeight: 0,
    paddingTop: 16,
    paddingHorizontal: '3%',
    paddingBottom: 90, // schwebende Tab-Bar
  },
  homeEmptyPack: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  homeEmptyPackText: {
    fontSize: 16,
    lineHeight: 24,
    color: c.textSecondary,
    textAlign: 'center',
  },
  testSelectionOuter: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  testSelectionShadow: {
    flex: 1,
    minHeight: 0,
    backgroundColor: c.screenBg,
    borderRadius: 28,
    marginHorizontal: '3%',
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
  testSelectionCard: {
    flex: 1,
    minHeight: 0,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: c.cardBg,
  },
  testSelectionScroll: {
    flex: 1,
  },
  testResultScroll: {
    zIndex: 2,
  },
  testSelectionScrollContent: {
    padding: 20,
    paddingBottom: 28,
    flexGrow: 1,
  },
  testSelectionTitle: {
    color: c.tabActive,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '600',
    textAlign: 'center',
  },
  testSelectionSubtitle: {
    color: c.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 24,
  },
  testBlock: {
    backgroundColor: c.screenBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
  testBlockLabel: {
    color: c.tabInactive,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  testBlockBody: {
    color: c.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  testBlockBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  testBlockBtnPrimary: {
    backgroundColor: c.tabActive,
  },
  testBlockBtnAccent: {
    backgroundColor: c.accentRed,
  },
  testBlockBtnText: {
    color: c.buttonOnAccent,
    fontSize: 16,
    fontWeight: '600',
  },
  testSelectionBack: {
    alignSelf: 'center',
    marginTop: 24,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  testSelectionBackText: {
    color: c.tabInactive,
    fontSize: 15,
    fontWeight: '500',
  },
  testLoadingInner: {
    flex: 1,
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testRunScrollContent: {
    padding: 20,
    paddingBottom: 28,
  },
  testRunColumn: {
    flex: 1,
    minHeight: 0,
  },
  testRunHeaderOutside: {
    fontSize: 16,
    fontWeight: '600',
    color: c.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  testRunProgressTrackOutside: {
    height: 6,
    borderRadius: 3,
    backgroundColor: c.testProgressTint,
    overflow: 'hidden',
    marginBottom: 12,
  },
  testRunProgressFillOutside: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: c.tabActive,
  },
  testPhase1Wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    width: '100%',
  },
  testPlayHintPhase1: {
    marginTop: 16,
    fontSize: 14,
    color: c.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  testPhase2TopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
    gap: 10,
  },
  testVoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
    maxWidth: 340,
  },
  testVoiceRowCompact: {
    flex: 1,
    maxWidth: undefined,
    minWidth: 0,
  },
  testVoiceBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testVoiceBtnCompact: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  testVoiceBtnInner: {
    alignItems: 'center',
  },
  testVoiceAvatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 999,
    overflow: 'hidden',
  },
  testVoiceAvatarImg: {
    width: 72,
    height: 72,
  },
  testVoiceBtnText: {
    fontSize: 13,
    color: c.tabInactive,
    textAlign: 'center',
    marginTop: 4,
  },
  testOptionRow: {
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
  testOptionRowInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  testOptionLetterWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 36,
  },
  testOptionLetter: {
    fontSize: 18,
    fontWeight: '700',
  },
  testOptionCheck: {
    fontSize: 14,
    fontWeight: '700',
  },
  testOptionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  testResultCardInner: {
    padding: 0,
    overflow: 'hidden',
  },
  testResultCardConfetti: {
    overflow: 'visible',
  },
  testConfettiLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    overflow: 'visible',
  },
  testDiscoWrapAfterNote: {
    alignItems: 'center',
    marginTop: 12,
  },
  testResultScrollContent: {
    padding: 28,
    alignItems: 'center',
  },
  testResultScreenTitle: {
    fontSize: 30,
    color: c.tabActive,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  testResultScoreBig: {
    fontSize: 48,
    fontWeight: '700',
    color: c.tabActive,
    textAlign: 'center',
  },
  testResultScoreLabel: {
    marginTop: 6,
    fontSize: 14,
    color: c.tabInactive,
    textAlign: 'center',
  },
  testResultRepeatNote: {
    marginTop: 20,
    fontSize: 14,
    color: c.tabInactive,
    textAlign: 'center',
    lineHeight: 20,
  },
  testResultDiscoBall: {
    marginTop: 20,
    width: 120,
    height: 120,
    alignSelf: 'center',
  },
  testResultDiscoBallAfterNote: {
    marginTop: 0,
  },
  testResultPerfectCaption: {
    marginTop: 12,
    fontSize: 18,
    color: c.tabActive,
    textAlign: 'center',
  },
  testResultBtnOtherTest: {
    marginTop: 24,
    width: '100%',
    maxWidth: 320,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  testResultBtnAfterSwitch: {
    marginTop: 12,
  },
  testResultBtnAfterBack: {
    marginTop: 12,
  },
  testResultBtnPrimary: {
    marginTop: 28,
    width: '100%',
    maxWidth: 320,
    backgroundColor: c.tabActive,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  testResultBtnPrimaryText: {
    color: c.buttonOnAccent,
    fontSize: 16,
    fontWeight: '600',
  },
  testResultBtnSecondary: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: c.tabActive,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  testResultBtnSecondaryText: {
    color: c.tabActive,
    fontSize: 16,
    fontWeight: '600',
  },
});
}
