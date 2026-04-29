import { Image, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CARD_BG,
  CARD_DE,
  HEADER_DARK,
  HEADER_TEXT_SUB,
  INACTIVE,
  SCREEN_BG,
} from '../../constants/theme';

export default function MoreScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { backgroundColor: SCREEN_BG }]}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextCol}>
            <Text style={styles.headerLine1}>More</Text>
            <Text style={styles.headerLine2}>Erweitere dein Englisch</Text>
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
        <View style={styles.tile}>
          <Text style={styles.tileTitle}>🔒 Disco 102</Text>
          <Text style={styles.tileBody}>
            Erweiterter Wortschatz für deinen Urlaub – 101 weitere Phrasen in 7
            Kapiteln
          </Text>
        </View>

        <View style={styles.tile}>
          <Text style={styles.tileTitle}>🔒 Disco 103 – Business</Text>
          <Text style={styles.tileBody}>
            101 Phrasen für Geschäftsreisen und berufliche Situationen
          </Text>
        </View>

        <View style={styles.tile}>
          <Text style={styles.tileTitle}>🔒 Disco 104 – Expats</Text>
          <Text style={styles.tileBody}>
            101 Phrasen für Behörden, Arzt und das Leben im Ausland
          </Text>
        </View>

        <Text style={styles.footerHint}>Weitere Inhalte folgen in Kürze</Text>
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
  tile: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    ...Platform.select({
      android: { elevation: 2 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
      },
    }),
  },
  tileTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  tileBody: {
    fontSize: 15,
    lineHeight: 22,
    color: CARD_DE,
  },
  footerHint: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    color: '#A0A0A0',
    textAlign: 'center',
  },
});
