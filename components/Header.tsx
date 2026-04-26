import { Image, StyleSheet, Text, View } from 'react-native';
import { HEADER_DARK, HEADER_TEXT_SUB, INACTIVE } from '../constants/theme';

export default function Header() {
  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <View style={styles.headerTextCol}>
          <Text style={styles.headerLine1}>{"Hello, let's learn!"}</Text>
          <Text style={styles.headerLine2}>
            Bereit für die nächste Phrase?
          </Text>
        </View>
        <View style={styles.headerLogoMask}>
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    width: 72,
    height: 72,
    flexShrink: 0,
  },
  headerLogo: {
    width: '100%',
    height: '100%',
  },
});
