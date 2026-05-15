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
  preloadPhraseAudio,
} from '../../utils/audioPreloader';
import {
  ACTIVE,
  BRAND,
  BUTTON_TEXT,
  CARD_BG,
  CARD_DE,
  FONT_DM_SERIF,
  INACTIVE,
  SCREEN_BG,
} from '../../constants/theme';
import { audioAssets } from '../../utils/audioAssets';
import { phraseAudioAssetKey } from '../../utils/phraseAudioKey';
import {
  safePlayerPause,
  safePlayerPlay,
  safePlayerReplace,
  safePlayerSetPlaybackRate,
} from '../../utils/safeAudioPlayer';
import { titleForModule } from '../../constants/activeLearningModule';
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
  hasDisc101FullAccess,
  isChapterLockedWithoutPurchase,
} from '../../constants/chapterUnlock';
import type { ModuleCode } from '../../constants/products';

const CHRIS_AVATAR = require('../../assets/chris.png');
const ANN_AVATAR = require('../../assets/ann.png');

type Phrase = SentenceRecord;

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

/** Zwei Distraktoren + korrekte Phrase, gemischt als A/B/C. */
function buildTestOptions(correct: Phrase, pool: Phrase[]): Phrase[] {
  const others = shufflePhrases(pool.filter((p) => p.id !== correct.id));
  const w1 = others[0] ?? correct;
  const w2 = others[1] ?? others[0] ?? correct;
  return shufflePhrases([correct, w1, w2]);
}

function testPhraseAudioSource(
  phraseId: number,
  gender: 'm' | 'f',
  moduleCode: ModuleCode,
) {
  const key = phraseAudioAssetKey(moduleCode, phraseId, gender);
  return audioAssets[key] ?? null;
}

function TestChrisAnnButtons({
  player,
  phraseId,
  moduleCode,
  showOptions,
  onOpenOptionsAfterFirstVoice,
  compact,
}: {
  player: AudioPlayer;
  phraseId: number;
  moduleCode: ModuleCode;
  showOptions: boolean;
  onOpenOptionsAfterFirstVoice: () => void;
  compact: boolean;
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
      const src = testPhraseAudioSource(phraseId, gender, moduleCode);
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

  const btnStyle = compact ? styles.testVoiceBtnCompact : styles.testVoiceBtn;

  return (
    <View
      style={[
        styles.testVoiceRow,
        compact && styles.testVoiceRowCompact,
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
        <View style={styles.testVoiceBtnInner}>
          <View style={styles.testVoiceAvatarWrap}>
            <Image
              source={CHRIS_AVATAR}
              style={styles.testVoiceAvatarImg}
              resizeMode="cover"
            />
          </View>
          <Text style={styles.testVoiceBtnText}>Chris</Text>
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
        <View style={styles.testVoiceBtnInner}>
          <View style={styles.testVoiceAvatarWrap}>
            <Image
              source={ANN_AVATAR}
              style={styles.testVoiceAvatarImg}
              resizeMode="cover"
            />
          </View>
          <Text style={styles.testVoiceBtnText}>Ann</Text>
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
  const [disc101FullUnlocked, setDisc101FullUnlocked] = useState(false);
  const [learningModule, setLearningModule] = useState<ModuleCode>('101');
  const [bootReady, setBootReady] = useState(false);
  const [homeHeaderSubtitle, setHomeHeaderSubtitle] = useState(() =>
    titleForModule('101'),
  );
  const [showTestSelection, setShowTestSelection] = useState(false);
  const activeTestKindRef = useRef<1 | 2 | null>(null);

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
          void hasDisc101FullAccess().then((full) =>
            setDisc101FullUnlocked(full),
          );
          setHomeHeaderSubtitle(titleForModule(module));
          const maxInCh = pack.filter((p) => p.chapterId === chapterId).length;
          const clampedIdx =
            pack.length === 0
              ? 0
              : Math.min(Math.max(0, phraseIndex), maxInCh);
          setCurrentChapter(chapterId);
          setCurrentIndex(clampedIdx);
        } catch {
          setHomeHeaderSubtitle(titleForModule('101'));
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
  const categoryTitle = chPhrases[0]?.category ?? `Kapitel ${currentChapter}`;

  const phrasesBefore = useMemo(
    () => sentences.filter((p) => p.chapterId < currentChapter).length,
    [currentChapter, sentences],
  );

  const mergeWrongIntoPinned = useCallback(
    async (wrongIds: number[]) => {
      try {
        const toAdd = disc101FullUnlocked
          ? wrongIds
          : wrongIds.filter((wid) => {
              const m = sentences.find((p) => p.id === wid);
              return (
                m != null && !isChapterLockedWithoutPurchase(m.chapterId)
              );
            });
        const existing = await loadPinnedIdsForModule(learningModule);
        const merged = Array.from(new Set([...existing, ...toAdd]));
        setPinnedIds(merged);
        await persistPinnedIdsForModule(learningModule, merged);
      } catch {
        /* ignore */
      }
    },
    [disc101FullUnlocked, learningModule, sentences],
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
    setCurrentOptions(buildTestOptions(correct, chPhrases));
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
    activeTestKindRef.current = testNumber;
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
    activeTestKindRef.current = null;
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
  const onRepeatChapter = () => {
    setCurrentIndex(0);
  };

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
        <ActivityIndicator size="large" color={BRAND} />
      </View>
    );
  }

  if (sentences.length === 0) {
    return (
      <View style={[styles.home, { backgroundColor: SCREEN_BG }]}>
        <Header subtitle={homeHeaderSubtitle} />
        <View style={[styles.homeBody, styles.homeEmptyPack]}>
          <Text style={styles.homeEmptyPackText}>
            Die Phrasen für diese Unit werden bald ergänzt.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.home, { backgroundColor: SCREEN_BG }]}>
      <Header subtitle={homeHeaderSubtitle} />
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
                    Wähle deinen Test
                  </Text>

                  <View style={styles.testBlock}>
                    <Text style={styles.testBlockLabel}>Test 1</Text>
                    <Text style={styles.testBlockBody}>
                      Chris oder Ann lesen dir einen Satz vor. Deine Aufgabe:
                      Erkenne den gehörten Satz unter drei englischen Optionen.
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Test 1 starten"
                      onPress={() => startTest(1)}
                      style={({ pressed }) => [
                        styles.testBlockBtn,
                        styles.testBlockBtnPrimary,
                        pressed && { opacity: 0.92 },
                      ]}
                    >
                      <Text style={styles.testBlockBtnText}>
                        Test 1 starten →
                      </Text>
                    </Pressable>
                  </View>

                  <View style={styles.testBlock}>
                    <Text style={styles.testBlockLabel}>Test 2</Text>
                    <Text style={styles.testBlockBody}>
                      Chris oder Ann lesen dir einen Satz vor. Deine Aufgabe:
                      Finde die richtige deutsche Bedeutung unter drei Optionen.
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Test 2 starten"
                      onPress={() => startTest(2)}
                      style={({ pressed }) => [
                        styles.testBlockBtn,
                        styles.testBlockBtnAccent,
                        pressed && { opacity: 0.92 },
                      ]}
                    >
                      <Text style={styles.testBlockBtnText}>
                        Test 2 starten →
                      </Text>
                    </Pressable>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Zurück"
                    onPress={() => setShowTestSelection(false)}
                    style={({ pressed }) => [
                      styles.testSelectionBack,
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Text style={styles.testSelectionBackText}>Zurück</Text>
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
                    Test abgeschlossen! 🎉
                  </Text>
                  <Text style={styles.testResultScoreBig}>
                    {testPhrases.length - wrongAnswers.length} /{' '}
                    {testPhrases.length}
                  </Text>
                  <Text style={styles.testResultScoreLabel}>
                    Richtige Antworten
                  </Text>
                  {wrongAnswers.length > 0 ? (
                    <Text style={styles.testResultRepeatNote}>
                      {wrongAnswers.length === 1
                        ? '1 Karte wurde in deinem Repeat-Stapel gespeichert 📌'
                        : `${wrongAnswers.length} Karten wurden in deinem Repeat-Stapel gespeichert 📌`}
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
                        accessibilityLabel="Test-Ergebnis"
                      />
                      {testIsPerfect ? (
                        <Text style={styles.testResultPerfectCaption}>
                          Perfekt! Alle Karten richtig! 🎉
                        </Text>
                      ) : null}
                    </View>
                  ) : null}
                  {activeTestKind != null ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={
                        activeTestKind === 1
                          ? 'Test 2 starten'
                          : 'Test 1 starten'
                      }
                      onPress={() =>
                        startTest(activeTestKind === 1 ? 2 : 1)
                      }
                      style={({ pressed }) => [
                        styles.testResultBtnOtherTest,
                        {
                          backgroundColor:
                            activeTestKind === 1 ? '#C8102E' : ACTIVE,
                        },
                        pressed && { opacity: 0.92 },
                      ]}
                    >
                      <Text style={styles.testResultBtnPrimaryText}>
                        {activeTestKind === 1
                          ? 'Test 2 starten →'
                          : 'Test 1 starten →'}
                      </Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Zurück zur Übersicht"
                    onPress={exitTest}
                    style={({ pressed }) => [
                      styles.testResultBtnSecondary,
                      styles.testResultBtnAfterSwitch,
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Text style={styles.testResultBtnSecondaryText}>
                      Zurück zur Übersicht
                    </Text>
                  </Pressable>
                  {currentChapter < 7 ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Nächstes Kapitel"
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
                        Nächstes Kapitel →
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
              Frage {testIndex + 1} / {testPhrases.length}
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
                      <ActivityIndicator size="large" color={ACTIVE} />
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
                          />
                          <Text style={styles.testPlayHintPhase1}>
                            Wähle Chris oder Ann, um den Satz zu hören
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
                            />
                            <Ionicons
                              name="pin"
                              size={20}
                              color={
                                answerLocked &&
                                selectedOptionId !== null &&
                                selectedOptionId !==
                                  testPhrases[testIndex]!.id
                                  ? '#C8102E'
                                  : '#888888'
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
                            let rowBg = SCREEN_BG;
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
                              ? BUTTON_TEXT
                              : '#1A1A1A';
                            const letterCol = onColored
                              ? BUTTON_TEXT
                              : ACTIVE;
                            const showCheckBefore =
                              answerLocked && opt.id === correctId;
                            return (
                              <Pressable
                                key={`${opt.id}-${i}`}
                                accessibilityRole="button"
                                accessibilityLabel={`Antwort ${letter}`}
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
            ch1Count={chCount}
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
                isChapterLockedWithoutPurchase(meta.chapterId) &&
                !disc101FullUnlocked
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
            onRepeatChapter={onRepeatChapter}
            onRestartChapter={() => setCurrentIndex(0)}
            onNextChapter={onNextChapter}
            onBack={onBack}
            onNext={onNext}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  home: {
    flex: 1,
    flexDirection: 'column',
  },
  homeLoading: {
    backgroundColor: SCREEN_BG,
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
    color: CARD_DE,
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
    backgroundColor: SCREEN_BG,
    borderRadius: 28,
    marginHorizontal: '3%',
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
  testSelectionCard: {
    flex: 1,
    minHeight: 0,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: CARD_BG,
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
    color: ACTIVE,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '600',
    textAlign: 'center',
  },
  testSelectionSubtitle: {
    color: CARD_DE,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 24,
  },
  testBlock: {
    backgroundColor: SCREEN_BG,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      android: { elevation: 3 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
    }),
  },
  testBlockLabel: {
    color: INACTIVE,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  testBlockBody: {
    color: CARD_DE,
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
    backgroundColor: ACTIVE,
  },
  testBlockBtnAccent: {
    backgroundColor: '#C8102E',
  },
  testBlockBtnText: {
    color: BUTTON_TEXT,
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
    color: INACTIVE,
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
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  testRunProgressTrackOutside: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0, 36, 125, 0.15)',
    overflow: 'hidden',
    marginBottom: 12,
  },
  testRunProgressFillOutside: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: ACTIVE,
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
    color: CARD_DE,
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
    color: INACTIVE,
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
        shadowColor: '#000',
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
    color: ACTIVE,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  testResultScoreBig: {
    fontSize: 48,
    fontWeight: '700',
    color: ACTIVE,
    textAlign: 'center',
  },
  testResultScoreLabel: {
    marginTop: 6,
    fontSize: 14,
    color: INACTIVE,
    textAlign: 'center',
  },
  testResultRepeatNote: {
    marginTop: 20,
    fontSize: 14,
    color: INACTIVE,
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
    color: ACTIVE,
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
    backgroundColor: ACTIVE,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  testResultBtnPrimaryText: {
    color: BUTTON_TEXT,
    fontSize: 16,
    fontWeight: '600',
  },
  testResultBtnSecondary: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: ACTIVE,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  testResultBtnSecondaryText: {
    color: ACTIVE,
    fontSize: 16,
    fontWeight: '600',
  },
});
