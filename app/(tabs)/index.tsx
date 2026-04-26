import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../components/Header';
import PhraseCard from '../../components/PhraseCard';
import { BRAND, FONT_DM_SERIF, SCREEN_BG } from '../../constants/theme';

type Phrase = {
  id: number;
  chapterId: number;
  english: string;
  german: string;
  category: string;
};

type TestAnswer = { phraseId: number; correct: boolean };

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

const SENTENCES: Phrase[] = require('../../data/sentences.json');
const TOTAL_PHRASES = SENTENCES.length;

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
  const [testAnswers, setTestAnswers] = useState<TestAnswer[]>([]);
  const [pinnedIds, setPinnedIds] = useState<number[]>([]);

  useEffect(() => {
    AsyncStorage.getItem('pinned_phrases').then((val) => {
      if (val) setPinnedIds(JSON.parse(val));
    });
  }, []);

  const chPhrases = useMemo(
    () =>
      SENTENCES.filter((p) => p.chapterId === currentChapter).sort(
        (a, b) => a.id - b.id,
      ) as Phrase[],
    [currentChapter],
  );
  const chCount = chPhrases.length;
  const categoryTitle = chPhrases[0]?.category ?? `Kapitel ${currentChapter}`;

  const phrasesBefore = useMemo(
    () => SENTENCES.filter((p) => p.chapterId < currentChapter).length,
    [currentChapter],
  );

  const isChapterComplete = chCount > 0 && currentIndex >= chCount;
  const isAllPhrasesComplete = isChapterComplete && currentChapter === 7;
  const inChapterN = isChapterComplete ? chCount : currentIndex + 1;

  const completedForProgress =
    phrasesBefore + (isChapterComplete ? chCount : currentIndex);
  const globalBarPct =
    TOTAL_PHRASES > 0
      ? Math.min(
          100,
          Math.round(
            (completedForProgress / TOTAL_PHRASES) * 10000,
          ) / 100,
        )
      : 0;
  const globalProgressText = `${Math.min(
    TOTAL_PHRASES,
    completedForProgress,
  )}/${TOTAL_PHRASES}`;

  if (!fontsLoaded) {
    return (
      <View style={[styles.home, styles.homeLoading, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={BRAND} />
      </View>
    );
  }

  const advanceToNextChapter = () => {
    if (currentChapter < 7) {
      setCurrentChapter((c) => c + 1);
      setCurrentIndex(0);
    }
  };

  const startTest = () => {
    setTestPhrases(shufflePhrases(chPhrases));
    setTestIndex(0);
    setTestAnswers([]);
    setIsTestMode(true);
  };

  const exitTest = () => {
    setIsTestMode(false);
  };

  const onNext = () => {
    if (isAllPhrasesComplete) {
      return;
    }
    if (isChapterComplete) {
      advanceToNextChapter();
      return;
    }
    if (currentIndex < chCount - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setCurrentIndex(chCount);
    }
  };

  const onNextChapter = advanceToNextChapter;
  const onRepeatChapter = () => {
    setCurrentIndex(0);
  };

  const onBack = () => {
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

  return (
    <View style={[styles.home, { backgroundColor: SCREEN_BG }]}>
      <Header />
      <View style={styles.homeBody}>
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
          phraseId={phrase?.id ?? 0}
          isPinned={phrase ? pinnedIds.includes(phrase.id) : false}
          onTogglePin={(id) => {
            const updated = pinnedIds.includes(id)
              ? pinnedIds.filter((x) => x !== id)
              : [...pinnedIds, id];
            setPinnedIds(updated);
            AsyncStorage.setItem('pinned_phrases', JSON.stringify(updated));
          }}
          onStartTest={startTest}
          onRepeatChapter={onRepeatChapter}
          onNextChapter={onNextChapter}
          onBack={onBack}
          onNext={onNext}
        />
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
});
