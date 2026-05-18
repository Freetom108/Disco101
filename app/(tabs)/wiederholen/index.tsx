import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AppPalette } from '../../../constants/themePalettes';
import { useAppTheme } from '../../../context/AppThemeContext';
import {
  filterPhraseIdsForRepeatAccess,
  loadModulePurchaseState,
} from '../../../constants/chapterUnlock';
import { loadPinnedIdsForModule } from '../../../constants/learningResume';
import { MODULE_PRODUCTS, type ModuleCode } from '../../../constants/products';
import {
  getSentencesForModule,
  type SentenceRecord,
} from '../../../constants/sentencePacks';

type ChapterPinGroup = {
  chapterId: number;
  title: string;
  count: number;
  phraseIds: number[];
};

type ModulePinOverview = {
  code: ModuleCode;
  unitTitle: string;
  allowedPinnedIds: number[];
  groups: ChapterPinGroup[];
};

function buildChapterGroups(
  pinnedIds: number[],
  sentences: SentenceRecord[],
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

function kartenZuUbenLabel(n: number): string {
  return n === 1 ? '1 Karte zu üben' : `${n} Karten zu üben`;
}

export default function RepeatOverviewScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createRepeatOverviewStyles(colors), [colors]);
  const [loading, setLoading] = useState(true);
  const [modulePinOverviews, setModulePinOverviews] = useState<
    ModulePinOverview[]
  >([]);
  const [expandedUnit, setExpandedUnit] = useState<ModuleCode | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const purchaseState = await loadModulePurchaseState();
          const overviewPromises = MODULE_PRODUCTS.map(async (product) => {
            const pack = getSentencesForModule(product.code);
            if (pack.length === 0) return null;
            const pins = await loadPinnedIdsForModule(product.code);
            const allowed = filterPhraseIdsForRepeatAccess(
              pins,
              purchaseState,
              product.code,
              pack,
            );
            if (allowed.length === 0) return null;
            return {
              code: product.code,
              unitTitle: product.title,
              allowedPinnedIds: allowed,
              groups: buildChapterGroups(allowed, pack),
            } satisfies ModulePinOverview;
          });
          const resolved = (await Promise.all(overviewPromises)).filter(
            (x): x is ModulePinOverview => x != null,
          );
          if (!cancelled) {
            setModulePinOverviews(resolved);
            setExpandedUnit((prev) =>
              prev != null && resolved.some((o) => o.code === prev)
                ? prev
                : null,
            );
          }
        } catch {
          if (!cancelled) {
            setModulePinOverviews([]);
            setExpandedUnit(null);
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

  const totalPinnedAllowed = modulePinOverviews.reduce(
    (acc, m) => acc + m.allowedPinnedIds.length,
    0,
  );

  const showEmpty = !loading && totalPinnedAllowed === 0;

  const toggleUnitAccordion = (code: ModuleCode) => {
    setExpandedUnit((prev) => (prev === code ? null : code));
  };

  const startAllSessionForModule = (overview: ModulePinOverview) => {
    if (overview.allowedPinnedIds.length === 0) return;
    router.push({
      pathname: '/(tabs)/wiederholen/session',
      params: {
        phraseIds: JSON.stringify(overview.allowedPinnedIds),
        moduleCode: overview.code,
      },
    });
  };

  const startChapterSession = (moduleCode: ModuleCode, g: ChapterPinGroup) => {
    if (g.phraseIds.length === 0) return;
    router.push({
      pathname: '/(tabs)/wiederholen/session',
      params: {
        phraseIds: JSON.stringify(g.phraseIds),
        moduleCode,
      },
    });
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.screenBg }]}>
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
          {showEmpty ? (
            <View style={styles.pinnedEmptyWrap}>
              <Ionicons name="pin" size={40} color={colors.iconMuted} />
              <Text style={styles.pinnedEmptyTitle}>
                Noch keine Karten aus dem Stapel
              </Text>
              <Text style={styles.pinnedEmptySubtext}>
                Tippe die Stecknadel auf einer Karte im Home-Tab – gespeicherte
                Phrasen erscheinen hier nach Unit gruppiert. (Weitere Kapitel:
                nach Freischaltung.)
              </Text>
            </View>
          ) : (
            modulePinOverviews.map((overview) => {
              const n = overview.allowedPinnedIds.length;
              const open = expandedUnit === overview.code;
              return (
                <View key={overview.code} style={styles.accordionBlock}>
                  <Pressable
                    onPress={() => toggleUnitAccordion(overview.code)}
                    style={({ pressed }) => [
                      styles.accordionHeader,
                      pressed && { opacity: 0.94 },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: open }}
                    accessibilityLabel={`${overview.unitTitle}, ${kartenZuUbenLabel(n)}, ${open ? 'einklappen' : 'aufklappen'}`}
                  >
                    <View style={styles.accordionHeaderTextCol}>
                      <Text
                        style={styles.accordionHeaderTitleLine}
                        numberOfLines={2}
                      >
                        {overview.unitTitle}
                      </Text>
                      <Text style={styles.accordionHeaderSubtitleLine}>
                        {kartenZuUbenLabel(n)}
                      </Text>
                    </View>
                    <Ionicons
                      name={open ? 'chevron-up' : 'chevron-down'}
                      size={22}
                      color={colors.buttonOnAccent}
                    />
                  </Pressable>

                  {open ? (
                    <View style={styles.accordionBody}>
                      <Pressable
                        onPress={() => startAllSessionForModule(overview)}
                        style={({ pressed }) => [
                          styles.repeatAllOutlineBtn,
                          pressed && { opacity: 0.88 },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`Alle Karten aus ${overview.unitTitle} wiederholen`}
                      >
                        <Text style={styles.repeatAllOutlineBtnText}>
                          Alle Karten wiederholen · {n}{' '}
                          {n === 1 ? 'Karte' : 'Karten'}
                        </Text>
                      </Pressable>

                      {overview.groups.map((g) => (
                        <Pressable
                          key={`${overview.code}-${g.chapterId}`}
                          onPress={() =>
                            startChapterSession(overview.code, g)
                          }
                          style={({ pressed }) => [
                            styles.chapterTile,
                            pressed && { opacity: 0.88 },
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={`Kapitel ${g.chapterId} ${g.title}, ${g.count} Karten`}
                        >
                          <Text style={styles.chapterTileLine1}>
                            Kapitel {g.chapterId}
                          </Text>
                          <Text style={styles.chapterTileLine2} numberOfLines={2}>
                            {g.title}
                          </Text>
                          <Text style={styles.chapterTileLine3}>
                            {kartenZuUbenLabel(g.count)}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

function createRepeatOverviewStyles(c: AppPalette) {
  return StyleSheet.create({
    screen: {
      flex: 1,
    },
    header: {
      backgroundColor: c.headerBg,
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
      color: c.headerPrimaryText,
      fontSize: 26,
      fontWeight: '600',
      lineHeight: 32,
    },
    headerLine2: {
      color: c.headerSecondaryText,
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
      color: c.textPrimary,
    },
    pinnedEmptySubtext: {
      marginTop: 10,
      color: c.textSecondary,
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
    accordionBlock: {
      marginBottom: 10,
    },
    accordionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: c.accentRed,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 20,
      gap: 12,
    },
    accordionHeaderTextCol: {
      flex: 1,
      minWidth: 0,
    },
    accordionHeaderTitleLine: {
      color: c.buttonOnAccent,
      fontSize: 19,
      fontWeight: '700',
      lineHeight: 24,
    },
    accordionHeaderSubtitleLine: {
      marginTop: 4,
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 18,
      color: 'rgba(255,255,255,0.8)',
    },
    accordionBody: {
      marginTop: 10,
      gap: 10,
    },
    repeatAllOutlineBtn: {
      backgroundColor: c.outlineButtonBg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.outlineButtonBorder,
      paddingVertical: 16,
      paddingHorizontal: 16,
      alignItems: 'center',
    },
    repeatAllOutlineBtnText: {
      fontSize: 16,
      fontWeight: '600',
      color: c.outlineButtonText,
      textAlign: 'center',
    },
    chapterTile: {
      backgroundColor: c.scheme === 'dark' ? c.cardBg : c.screenBg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.chapterTileBorder,
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    chapterTileLine1: {
      fontSize: 12,
      fontWeight: '600',
      color: c.iconMuted,
      letterSpacing: 0.2,
    },
    chapterTileLine2: {
      fontSize: 17,
      fontWeight: '600',
      color: c.textPrimary,
      marginTop: 6,
      lineHeight: 22,
    },
    chapterTileLine3: {
      fontSize: 13,
      fontWeight: '500',
      color: c.iconMuted,
      marginTop: 8,
    },
  });
}
