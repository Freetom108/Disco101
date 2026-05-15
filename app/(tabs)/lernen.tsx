import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
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
  HEADER_DARK,
  HEADER_TEXT_SUB,
  INACTIVE,
  SCREEN_BG,
} from '../../constants/theme';
import {
  getActiveLearningModule,
  setActiveLearningModule,
} from '../../constants/activeLearningModule';
import {
  hasDisc101FullAccess,
  isChapterLockedWithoutPurchase,
} from '../../constants/chapterUnlock';
import {
  LAST_POSITION_KEY,
  parseChapterProgressRecord,
  readChapterProgressRaw,
} from '../../constants/learningResume';
import {
  MODULE_PRODUCTS,
  type ModuleCode,
} from '../../constants/products';
import { getSentencesForModule } from '../../constants/sentencePacks';

/** App accent red for Learn tab unit accordion headers */
const UNIT_HEADER_RED = '#CF142B';
const UNIT_HEADER_ON_RED = '#FFFFFF';

type ChapterRowMeta = {
  chapterId: number;
  title: string;
  y: number;
  x: number;
  completed: boolean;
  barPct: number;
  displayX: number;
};

function buildChapterRows(
  sentences: ReturnType<typeof getSentencesForModule>,
  chapterProgress: Record<string, number>,
): ChapterRowMeta[] {
  return [1, 2, 3, 4, 5, 6, 7].map((chapterId) => {
    const phrases = sentences
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
}

const EMPTY_PROGRESS: Record<ModuleCode, Record<string, number>> = {
  '101': {},
  '102': {},
  '103': {},
  '104': {},
};

export default function LernenScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [expandedUnit, setExpandedUnit] = useState<ModuleCode | null>('101');
  const [progressByModule, setProgressByModule] =
    useState<Record<ModuleCode, Record<string, number>>>(EMPTY_PROGRESS);
  const [disc101FullUnlocked, setDisc101FullUnlocked] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        const mod = await getActiveLearningModule();
        if (cancelled) return;
        setExpandedUnit(mod);

        const progressEntries = await Promise.all(
          MODULE_PRODUCTS.map(async (p) => {
            const raw = await readChapterProgressRaw(p.code);
            const rec = parseChapterProgressRecord(raw);
            return [p.code, rec] as const;
          }),
        );
        const nextProgress = { ...EMPTY_PROGRESS };
        for (const [code, rec] of progressEntries) {
          nextProgress[code] = rec;
        }
        if (!cancelled) {
          setProgressByModule(nextProgress);
          setDisc101FullUnlocked(await hasDisc101FullAccess());
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const sentencesByModule = useMemo(() => {
    const o = {} as Record<ModuleCode, ReturnType<typeof getSentencesForModule>>;
    for (const p of MODULE_PRODUCTS) {
      o[p.code] = getSentencesForModule(p.code);
    }
    return o;
  }, []);

  const toggleUnitAccordion = useCallback((code: ModuleCode) => {
    setExpandedUnit((prev) => (prev === code ? null : code));
  }, []);

  const selectChapter = useCallback(
    async (chapterId: number, moduleCode: ModuleCode) => {
      const locked =
        isChapterLockedWithoutPurchase(chapterId) && !disc101FullUnlocked;
      if (locked) {
        router.push({
          pathname: '/paywall',
          params: { focusModule: moduleCode },
        });
        return;
      }
      await setActiveLearningModule(moduleCode);
      await AsyncStorage.setItem(
        LAST_POSITION_KEY,
        JSON.stringify({
          chapterId,
          phraseIndex: 0,
          moduleCode,
        }),
      );
      router.replace('/(tabs)');
    },
    [disc101FullUnlocked, router],
  );

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
        {MODULE_PRODUCTS.map((product) => {
          const code = product.code;
          const isOpen = expandedUnit === code;
          const pack = sentencesByModule[code];
          const hasChapters = pack.length > 0;
          const chapterRows = hasChapters
            ? buildChapterRows(pack, progressByModule[code] ?? {})
            : [];

          return (
            <View key={code} style={styles.accordionBlock}>
              <Pressable
                onPress={() => toggleUnitAccordion(code)}
                style={({ pressed }) => [
                  styles.accordionHeader,
                  pressed && { opacity: 0.92 },
                ]}
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}
                accessibilityLabel={`${product.title}${isOpen ? ' einklappen' : ' aufklappen'}`}
              >
                <Text style={styles.accordionTitle}>{product.title}</Text>
                <Ionicons
                  name={isOpen ? 'chevron-up' : 'chevron-down'}
                  size={22}
                  color={UNIT_HEADER_ON_RED}
                />
              </Pressable>

              {isOpen ? (
                hasChapters ? (
                  <View style={styles.accordionBody}>
                    {chapterRows.map((row) => {
                      const locked =
                        isChapterLockedWithoutPurchase(row.chapterId) &&
                        !disc101FullUnlocked;
                      return (
                        <Pressable
                          key={row.chapterId}
                          onPress={() => void selectChapter(row.chapterId, code)}
                          style={({ pressed }) => [
                            styles.chapterCard,
                            locked && styles.chapterCardLocked,
                            pressed && { opacity: locked ? 0.92 : 0.88 },
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={
                            locked ? `${row.title} gesperrt` : `${row.title} öffnen`
                          }
                        >
                          <View style={styles.chapterCardTop}>
                            <View style={styles.chapterTitleBlock}>
                              <Text style={styles.chapterLabel}>
                                Kapitel {row.chapterId}
                              </Text>
                              <Text
                                style={styles.chapterName}
                                numberOfLines={2}
                              >
                                {row.title}
                              </Text>
                            </View>
                            {locked ? (
                              <Ionicons
                                name="lock-closed"
                                size={18}
                                color="#8E8E93"
                              />
                            ) : (
                              <Text style={styles.chapterFrac}>
                                {row.displayX} / {row.y}
                              </Text>
                            )}
                          </View>
                          {locked ? (
                            <Text style={styles.chapterLockedHint}>
                              Tippe zum Freischalten
                            </Text>
                          ) : row.completed ? (
                            <Text style={styles.chapterCheck}>✓</Text>
                          ) : (
                            <View style={styles.progressTrack}>
                              <View
                                style={[
                                  styles.progressFill,
                                  { width: `${row.barPct}%` },
                                ]}
                              />
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.accordionPlaceholderWrap}>
                    <Text style={styles.accordionPlaceholder}>Kommt bald</Text>
                  </View>
                )
              ) : null}
            </View>
          );
        })}
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
  accordionBlock: {
    marginBottom: 10,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: UNIT_HEADER_RED,
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 20,
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
  accordionTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: UNIT_HEADER_ON_RED,
    marginRight: 12,
  },
  accordionBody: {
    marginTop: 8,
    paddingLeft: 2,
  },
  accordionPlaceholderWrap: {
    marginTop: 8,
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderRadius: 12,
  },
  accordionPlaceholder: {
    fontSize: 15,
    color: HEADER_TEXT_SUB,
    textAlign: 'center',
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
  chapterCardLocked: {
    opacity: 0.92,
    backgroundColor: '#FAFAFA',
  },
  chapterCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  chapterTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  chapterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  chapterName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  chapterFrac: {
    fontSize: 14,
    color: '#8E8E93',
  },
  chapterLockedHint: {
    marginTop: 10,
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
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
