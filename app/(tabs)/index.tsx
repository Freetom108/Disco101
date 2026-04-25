import { useFonts } from 'expo-font';
import { useMemo, useState } from 'react';
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

const SENTENCES: Phrase[] = require('../../data/sentences.json');

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({
    [FONT_DM_SERIF]: require('../../assets/fonts/DMSerifDisplay-Regular.ttf'),
  });

  const ch1 = useMemo(
    () =>
      SENTENCES.filter((p) => p.chapterId === 1).sort(
        (a, b) => a.id - b.id,
      ) as Phrase[],
    [],
  );
  const ch1Count = ch1.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const isChapterComplete = currentIndex >= ch1Count;
  const categoryTitle = ch1[0]?.category ?? 'Kapitel 1';
  const inChapterN = isChapterComplete ? ch1Count : currentIndex + 1;
  const chapterBarPct =
    ch1Count > 0 ? Math.round((inChapterN / ch1Count) * 10000) / 100 : 0;

  if (!fontsLoaded) {
    return (
      <View style={[styles.home, styles.homeLoading, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={BRAND} />
      </View>
    );
  }

  const onNext = () => {
    if (isChapterComplete) {
      return;
    }
    if (currentIndex < ch1Count - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setCurrentIndex(ch1Count);
    }
  };

  const onBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  const phrase = ch1[currentIndex];

  return (
    <View style={[styles.home, { backgroundColor: SCREEN_BG }]}>
      <Header />
      <View style={styles.homeBody}>
        <PhraseCard
          categoryTitle={categoryTitle}
          isChapterComplete={isChapterComplete}
          inChapterN={inChapterN}
          ch1Count={ch1Count}
          chapterBarPct={chapterBarPct}
          english={phrase?.english ?? ''}
          german={phrase?.german ?? ''}
          category={phrase?.category ?? ''}
          currentIndex={currentIndex}
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
