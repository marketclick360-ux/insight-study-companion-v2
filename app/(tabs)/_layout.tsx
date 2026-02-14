import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';

const TabIcon = ({ label, focused }: { label: string; focused: boolean }) => (
  <Text style={{ fontSize: 10, color: focused ? '#1e3a5f' : '#888', marginTop: 2 }}>{label}</Text>
);

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#f0f4f8' },
        headerTitleStyle: { color: '#1e3a5f', fontWeight: '600' },
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#e5e5e5', paddingTop: 4 },
        tabBarActiveTintColor: '#1e3a5f',
        tabBarInactiveTintColor: '#888',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarLabel: ({ focused }) => <TabIcon label="Dashboard" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="registry"
        options={{
          title: 'Registry',
          tabBarLabel: ({ focused }) => <TabIcon label="Registry" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="review"
        options={{
          title: 'Review',
          tabBarLabel: ({ focused }) => <TabIcon label="Review" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarLabel: ({ focused }) => <TabIcon label="Settings" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
