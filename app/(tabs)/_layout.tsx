import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { STRINGS } from '../../constants/strings';
import { useAppTheme } from '../../context/AppThemeContext';

export default function TabLayout() {
  const { colors } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBarBg,
          borderTopWidth: 0,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          marginHorizontal: 12,
          marginBottom: 20,
          borderRadius: 20,
          position: 'absolute',
          elevation: 8,
          ...Platform.select({
            ios: {
              shadowColor: colors.shadowColor,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: colors.scheme === 'dark' ? 0.35 : 0.12,
              shadowRadius: 8,
            },
          }),
        },
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
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
          title: STRINGS.tabHome,
          tabBarLabel: STRINGS.tabHome,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="lernen"
        options={{
          title: STRINGS.tabLearn,
          tabBarLabel: STRINGS.tabLearn,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wiederholen"
        options={{
          title: STRINGS.tabRepeat,
          tabBarLabel: STRINGS.tabRepeat,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="repeat" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: STRINGS.tabMore,
          tabBarLabel: STRINGS.tabMore,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="lock-closed-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: STRINGS.tabSettings,
          tabBarLabel: STRINGS.tabSettings,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-sharp" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
