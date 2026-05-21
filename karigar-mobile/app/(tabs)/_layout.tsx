import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store';

export default function TabLayout() {
  const { role, isAuthenticated } = useStore();
  const isProviderMode = role === 'provider';

  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0A0F', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0D7377" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#12121A',
          borderTopColor: 'rgba(255,255,255,0.05)',
          height: 65,
          paddingBottom: 10,
          paddingTop: 5,
        },
        tabBarActiveTintColor: '#0D7377',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.35)',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      {/* 1. CUSTOMER HOME (Hidden for providers) */}
      <Tabs.Screen
        name="index"
        options={{
          href: isProviderMode ? null : '/',
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      {/* 2. PROVIDER REAL-TIME HOME (Visible only for providers) */}
      <Tabs.Screen
        name="provider-home"
        options={{
          href: !isProviderMode ? null : '/provider-home',
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="flash" size={size} color={color} />
          ),
        }}
      />
      
      {/* 3. DASHBOARD / STATS */}
      <Tabs.Screen
        name="provider"
        options={{
          href: !isProviderMode ? null : '/provider',
          title: 'Stats',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart" size={size} color={color} />
          ),
        }}
      />

      {/* 4. CHATS / ASSISTANCE (Customer Only) */}
      <Tabs.Screen
        name="chats"
        options={{
          href: isProviderMode ? null : '/chats',
          title: 'Assistance',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }}
      />

      {/* 5. HISTORY / JOBS (Shared) */}
      <Tabs.Screen
        name="bookings"
        options={{
          title: isProviderMode ? 'My Jobs' : 'History',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-clear" size={size} color={color} />
          ),
        }}
      />

      {/* 6. TRACK (Customer Only) */}
      <Tabs.Screen
        name="track"
        options={{
          href: isProviderMode ? null : '/track',
          title: 'Track',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="location" size={size} color={color} />
          ),
        }}
      />

      {/* 7. PROFILE (Shared) */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />

      {/* Hide redundant tabs */}
      <Tabs.Screen name="provider-jobs" options={{ href: null }} />
    </Tabs>
  );
}
