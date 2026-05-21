import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import GlobalNotification from '../components/GlobalNotification';
export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <GlobalNotification />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0A0A0F' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="chat" />
        <Stack.Screen name="trace" />
        <Stack.Screen name="providers" />
        <Stack.Screen name="negotiation" />
        <Stack.Screen name="confirm" />
        <Stack.Screen name="recovery" />
        <Stack.Screen name="pricing" />
        <Stack.Screen name="feedback" />
        <Stack.Screen name="orchestration" />
        <Stack.Screen name="provider-job-active" />
        <Stack.Screen name="provider-customer-chat" />
      </Stack>
    </>
  );
}
