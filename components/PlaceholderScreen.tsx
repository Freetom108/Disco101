import { StyleSheet, Text, View } from 'react-native';
import { SCREEN_BG } from '../constants/theme';

export default function PlaceholderScreen({ name }: { name: string }) {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    backgroundColor: SCREEN_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1B3A20',
  },
});
