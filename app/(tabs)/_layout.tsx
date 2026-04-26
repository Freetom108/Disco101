import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { ACTIVE, HEADER_DARK } from '../../constants/theme';

const styles = StyleSheet.create({
  wiederholenIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wiederholenLock: {
    marginLeft: 3,
    opacity: 0.9,
  },
});

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: HEADER_DARK,
          borderTopWidth: 0,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          marginHorizontal: 12,
          marginBottom: 20,
          borderRadius: 20,
          position: 'absolute',
          elevation: 8,
        },
        tabBarActiveTintColor: '#00247D',
        tabBarInactiveTintColor: 'rgba(0,0,0,0.28)',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
        tabBarItemStyle: {
          paddingHorizontal: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="lernen"
        options={{
          title: 'Learn',
          tabBarLabel: 'Learn',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wiederholen"
        options={{
          title: 'Repeat',
          tabBarLabel: 'Repeat',
          tabBarIcon: ({ color, size }) => (
            <View style={styles.wiederholenIconRow}>
              <Ionicons name="repeat" size={size} color={color} />
              <Ionicons
                name="lock-closed"
                size={11}
                color={ACTIVE}
                style={styles.wiederholenLock}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-sharp" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
