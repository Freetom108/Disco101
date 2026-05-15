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
  BUTTON_TEXT,
  HEADER_DARK,
  HEADER_TEXT_SUB,
  INACTIVE,
  SCREEN_BG,
} from '../../../constants/theme';
import {
  filterPhraseIdsForRepeatAccess,
  hasDisc101FullAccess,
} from '../../../constants/chapterUnlock';
import { getActiveLearningModule } from '../../../constants/activeLearningModule';
import { loadPinnedIdsForModule } from '../../../constants/learningResume';
import type { ModuleCode } from '../../../constants/products';
import {
  getSentencesForModule,
  type SentenceRecord,
} from '../../../constants/sentencePacks';

type Phrase = SentenceRecord;

type ChapterPinGroup = {
  chapterId: number;
  title: string;
  count: number;
  phraseIds: number[];
};

function buildChapterGroups(
  pinnedIds: number[],
  sentences: Phrase[],
): ChapterPinGroup[] {
  const byId = new Map(sentences.map((s) => [s.id, s]));
  const map = new Map<number, number[]>();
  for (const id of pinnedIds) {
    const s = byId.get(id);
    if (!s) continue;
    const list = map.get(s.chapterId) ?? [];
    list.push(id);
    map.set(s.chapterId, list);
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([chapterId, phraseIds]) => {
      const first = sentences.find((x) => x.chapterId === chapterId);
      return {
        chapterId,
        title: first?.category ?? `Kapitel ${chapterId}`,
        count: phraseIds.length,
        phraseIds,
      };
    });
}

export default function RepeatOverviewScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState<ModuleCode>('101');
  const [pinnedIds, setPinnedIds] = useState<number[]>([]);
  const [disc101FullUnlocked, setDisc101FullUnlocked] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const mod = await getActiveLearningModule();
          const [pins, full101] = await Promise.all([
            loadPinnedIdsForModule(mod),
            hasDisc101FullAccess(),
          ]);
          if (!cancelled) {
            setActiveModule(mod);
            setPinnedIds(pins);
            setDisc101FullUnlocked(full101);
          }
        } catch {
          if (!cancelled) {
            setPinnedIds([]);
            setDisc101FullUnlocked(false);
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const sentences = useMemo(
    () => getSentencesForModule(activeModule),
    [activeModule],
  );

  const chapter1PhraseIds = useMemo(
    () =>
      sentences
        .filter((p) => p.chapterId === 1)
        .sort((a, b) => a.id - b.id)
        .map((p) => p.id),
    [sentences],
  );

  const allowedPinnedIds = useMemo(
    () =>
      filterPhraseIdsForRepeatAccess(
        pinnedIds,
        disc101FullUnlocked,
        sentences,
      ),
    [pinnedIds, disc101FullUnlocked, sentences],
  );

  const groups = useMemo(
    () => buildChapterGroups(allowedPinnedIds, sentences),
    [allowedPinnedIds, sentences],
  );

  const totalPinnedAllowed = allowedPinnedIds.length;

  const showEmpty = !loading && totalPinnedAllowed === 0;

  const startAllSession = () => {
    if (allowedPinnedIds.length === 0) return;
    router.push({
      pathname: '/(tabs)/wiederholen/session',
      params: {
        phraseIds: JSON.stringify(allowedPinnedIds),
        moduleCode: activeModule,
      },
    });
  };

  const startChapter1Session = () => {
    if (chapter1PhraseIds.length === 0) return;
    router.push({
      pathname: '/(tabs)/wiederholen/session',
      params: {
        phraseIds: JSON.stringify(chapter1PhraseIds),
        moduleCode: activeModule,
      },
    });
  };

  const startChapterSession = (g: ChapterPinGroup) => {
    if (g.phraseIds.length === 0) return;
    router.push({
      pathname: '/(tabs)/wiederholen/session',
      params: {
        phraseIds: JSON.stringify(g.phraseIds),
        moduleCode: activeModule,
      },
    });
  };

  return (
    <View style={[styles.screen, { backgroundColor: SCREEN_BG }]}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextCol}>
            <Text style={styles.headerLine1}>Repeat</Text>
            <Text style={styles.headerLine2}>Dein Übungsstapel</Text>
          </View>
          <View style={styles.headerLogoMask}>
            <Image
              source={require('../../../assets/images/logo.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingBody} />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 90 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.chapter1Block}>
            <Text style={styles.chapter1Title}>Kapitel 1 · Alle Phrasen</Text>
            <Text style={styles.chapter1Sub}>
              {chapter1PhraseIds.length} Karten · für alle Nutzer (Unit 1 Basics)
            </Text>
            <Pressable
              onPress={startChapter1Session}
              style={({ pressed }) => [
                styles.chapter1Btn,
                pressed && { opacity: 0.92 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Alle Phrasen aus Kapitel 1 wiederholen"
            >
              <Text style={styles.chapter1BtnText}>
                🔁 Alle Phrasen aus Kapitel 1 üben
              </Text>
            </Pressable>
          </View>

          <View style={styles.divider} />

          {showEmpty ? (
            <View style={styles.pinnedEmptyWrap}>
              <Ionicons name="pin" size={40} color="#AAAAAA" />
              <Text style={styles.pinnedEmptyTitle}>
                Noch keine Karten aus dem Stapel
              </Text>
              <Text style={styles.pinnedEmptySubtext}>
                Tippe die Stecknadel auf einer Karte im Home-Tab – gespeicherte
                Phrasen aus Kapitel 1 erscheinen hier zum Üben. (Weitere Kapitel:
                nach Freischaltung.)
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.stackHeaderBlock}>
                <Text style={styles.stackHeaderTitle}>
                  Dein Stapel (Stecknadel)
                </Text>
                <Text style={styles.stackHeaderSub}>
                  {totalPinnedAllowed} Karte{totalPinnedAllowed === 1 ? '' : 'n'}{' '}
                  gespeichert
                </Text>
              </View>

              <Pressable
                onPress={startAllSession}
                style={({ pressed }) => [
                  styles.shuffleBtn,
                  pressed && { opacity: 0.92 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Alle gespeicherten Karten wiederholen"
              >
                <Text style={styles.shuffleBtnText}>
                  🔀 Alle gespeicherten Karten wiederholen
                </Text>
              </Pressable>

              <View style={styles.divider} />

              {groups.map((g) => (
                <Pressable
                  key={g.chapterId}
                  onPress={() => startChapterSession(g)}
                  style={({ pressed }) => [
                    styles.chapterCard,
                    pressed && { opacity: 0.85 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${g.title}, ${g.count} Karten wiederholen`}
                >
                  <View style={styles.chapterRowInner}>
                    <Text style={styles.chapterTitle} numberOfLines={2}>
                      {g.title}
                    </Text>
                    <View style={styles.chapterMeta}>
                      <Text style={styles.chapterCount}>
                        {g.count} {g.count === 1 ? 'Karte' : 'Karten'}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#8E8E93"
                      />
                    </View>
                  </View>
                </Pressable>
              ))}
            </>
          )}
        </ScrollView>
      )}
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
  loadingBody: {
    flex: 1,
  },
  chapter1Block: {
    marginBottom: 8,
  },
  chapter1Title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  chapter1Sub: {
    fontSize: 14,
    color: INACTIVE,
    marginTop: 4,
    marginBottom: 14,
  },
  chapter1Btn: {
    backgroundColor: '#C8102E',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  chapter1BtnText: {
    color: BUTTON_TEXT,
    fontSize: 17,
    fontWeight: '600',
  },
  pinnedEmptyWrap: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 12,
  },
  pinnedEmptyTitle: {
    marginTop: 14,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    color: '#444444',
  },
  pinnedEmptySubtext: {
    marginTop: 10,
    color: '#AAAAAA',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: '3%',
  },
  stackHeaderBlock: {
    marginBottom: 16,
  },
  stackHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  stackHeaderSub: {
    fontSize: 14,
    color: INACTIVE,
  },
  shuffleBtn: {
    backgroundColor: '#C8102E',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  shuffleBtnText: {
    color: BUTTON_TEXT,
    fontSize: 17,
    fontWeight: '600',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C6C6C8',
    marginBottom: 16,
  },
  chapterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    ...Platform.select({
      android: { elevation: 3 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
    }),
  },
  chapterRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  chapterTitle: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    marginRight: 12,
  },
  chapterMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chapterCount: {
    fontSize: 15,
    color: '#8E8E93',
  },
});
