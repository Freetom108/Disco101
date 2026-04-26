import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
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
  BRAND,
  BUTTON_TEXT,
  HEADER_DARK,
  HEADER_TEXT_SUB,
  INACTIVE,
  SCREEN_BG,
} from '../../constants/theme';
import SENTENCES from '../../data/sentences.json';

const LAST_POSITION_KEY = 'last_position';
const CHAPTER_PROGRESS_KEY = 'chapter_progress';

type Phrase = (typeof SENTENCES)[number];

type LastPosition = { chapterId: number; phraseIndex: number };

function parseLastPosition(val: string | null): LastPosition | null {
  if (!val) return null;
  try {
    const { chapterId, phraseIndex } = JSON.parse(val) as {
      chapterId?: unknown;
      phraseIndex?: unknown;
    };
    const ch = Number(chapterId);
    const idx = Number(phraseIndex);
    if (!Number.isFinite(ch) || !Number.isFinite(idx)) return null;
    if (ch < 1 || ch > 7) return null;
    return { chapterId: ch, phraseIndex: idx };
  } catch {
    return null;
  }
}

function parseChapterProgress(val: string | null): Record<string, number> {
  if (!val) return {};
  try {
    const o = JSON.parse(val) as Record<string, unknown>;
    if (!o || typeof o !== 'object') return {};
    const out: Record<string, number> = {};
    for (let i = 1; i <= 7; i++) {
      const k = String(i);
      const v = o[k] ?? o[i as unknown as string];
      const n = Number(v);
      if (Number.isFinite(n) && n >= 0) out[k] = n;
    }
    return out;
  } catch {
    return {};
  }
}

export default function LernenScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [lastPosition, setLastPosition] = useState<LastPosition | null>(null);
  const [chapterProgress, setChapterProgress] = useState<Record<string, number>>(
    {},
  );

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const [lp, cp] = await Promise.all([
          AsyncStorage.getItem(LAST_POSITION_KEY),
          AsyncStorage.getItem(CHAPTER_PROGRESS_KEY),
        ]);
        if (cancelled) return;
        setLastPosition(parseLastPosition(lp));
        setChapterProgress(parseChapterProgress(cp));
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const chapterRows = useMemo(() => {
    return [1, 2, 3, 4, 5, 6, 7].map((chapterId) => {
      const phrases = (SENTENCES as Phrase[])
        .filter((p) => p.chapterId === chapterId)
        .sort((a, b) => a.id - b.id);
      const y = phrases.length;
      const title = phrases[0]?.category ?? `Kapitel ${chapterId}`;
      const raw = chapterProgress[String(chapterId)] ?? 0;
      const x = Math.max(0, raw);
      const completed = y > 0 && x >= y;
      const barPct =
        y > 0 && !completed
          ? Math.min(100, Math.round(((x + 1) / y) * 10000) / 100)
          : completed
            ? 100
            : 0;
      const displayX = x >= y ? y : x + 1;
      return {
        chapterId,
        title,
        y,
        x,
        completed,
        barPct,
        displayX,
      };
    });
  }, [chapterProgress]);

  const weitermachenMeta = useMemo(() => {
    if (!lastPosition) return null;
    const { chapterId, phraseIndex } = lastPosition;
    const phrases = (SENTENCES as Phrase[])
      .filter((p) => p.chapterId === chapterId)
      .sort((a, b) => a.id - b.id);
    const y = phrases.length;
    if (y === 0) return null;
    const name = phrases[0]?.category ?? `Kapitel ${chapterId}`;
    const idx = Math.min(Math.max(0, phraseIndex), y);
    const displayPhrase = idx >= y ? y : idx + 1;
    return { name, displayPhrase, y };
  }, [lastPosition]);

  const goHome = () => {
    router.replace('/(tabs)');
  };

  const selectChapter = async (chapterId: number) => {
    await AsyncStorage.setItem(
      LAST_POSITION_KEY,
      JSON.stringify({ chapterId, phraseIndex: 0 }),
    );
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.screen, { backgroundColor: SCREEN_BG }]}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextCol}>
            <Text style={styles.headerLine1}>Learn</Text>
            <Text style={styles.headerLine2}>Wähle dein Kapitel</Text>
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
        <View style={styles.sectionBlock}>
          <Pressable
            onPress={goHome}
            style={({ pressed }) => [
              styles.weiterBtn,
              pressed && { opacity: 0.92 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Weitermachen"
          >
            <Text style={styles.weiterBtnText}>Weitermachen →</Text>
          </Pressable>
          {weitermachenMeta ? (
            <Text style={styles.weiterSub} numberOfLines={2}>
              {weitermachenMeta.name}
              {' · '}
              Phrase {weitermachenMeta.displayPhrase} / {weitermachenMeta.y}
            </Text>
          ) : (
            <Text style={styles.weiterSubMuted}>
              Noch keine Lernposition gespeichert.
            </Text>
          )}
        </View>

        <Text style={styles.listHeading}>Kapitel</Text>

        {chapterRows.map((row) => (
          <Pressable
            key={row.chapterId}
            onPress={() => selectChapter(row.chapterId)}
            style={({ pressed }) => [
              styles.chapterCard,
              pressed && { opacity: 0.88 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${row.title} öffnen`}
          >
            <View style={styles.chapterCardTop}>
              <Text style={styles.chapterName} numberOfLines={2}>
                {row.title}
              </Text>
              <Text style={styles.chapterFrac}>
                {row.displayX} / {row.y}
              </Text>
            </View>
            {row.completed ? (
              <Text style={styles.chapterCheck}>✓</Text>
            ) : (
              <View style={styles.progressTrack}>
                <View
                  style={[styles.progressFill, { width: `${row.barPct}%` }]}
                />
              </View>
            )}
          </Pressable>
        ))}
      </ScrollView>
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
  sectionBlock: {
    marginBottom: 24,
  },
  weiterBtn: {
    backgroundColor: '#CF142B',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  weiterBtnText: {
    color: BUTTON_TEXT,
    fontSize: 17,
    fontWeight: '600',
  },
  weiterSub: {
    marginTop: 8,
    fontSize: 13,
    color: HEADER_TEXT_SUB,
    textAlign: 'center',
  },
  weiterSubMuted: {
    marginTop: 8,
    fontSize: 13,
    color: '#AAAAAA',
    textAlign: 'center',
  },
  listHeading: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888888',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  chapterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
  chapterCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  chapterName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  chapterFrac: {
    fontSize: 14,
    color: '#8E8E93',
  },
  progressTrack: {
    height: 3,
    marginTop: 12,
    borderRadius: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    backgroundColor: BRAND,
    borderRadius: 2,
  },
  chapterCheck: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '700',
    color: '#2E7D32',
  },
});
