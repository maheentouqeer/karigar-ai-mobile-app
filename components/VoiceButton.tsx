import React, { useEffect } from 'react';
import { TouchableOpacity, StyleSheet, View, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withDelay } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

export default function VoiceButton({ onPress }: { onPress?: () => void }) {
  const ring1 = useSharedValue(1);
  const ring2 = useSharedValue(1);

  useEffect(() => {
    ring1.value = withRepeat(withTiming(1.6, { duration: 2000, easing: Easing.out(Easing.ease) }), -1, false);
    ring2.value = withDelay(1000, withRepeat(withTiming(1.6, { duration: 2000, easing: Easing.out(Easing.ease) }), -1, false));
  }, []);

  const animatedStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: ring1.value }],
    opacity: 1 - (ring1.value - 1) / 0.6,
  }));

  const animatedStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: ring2.value }],
    opacity: 1 - (ring2.value - 1) / 0.6,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.ring, animatedStyle1]} />
      <Animated.View style={[styles.ring, animatedStyle2]} />
      <TouchableOpacity activeOpacity={0.8} style={styles.button} onPress={onPress}>
        <Ionicons name="mic" size={40} color={theme.colors.primaryLight} />
      </TouchableOpacity>
      <Text style={styles.label}>بولیں</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: theme.spacing.xl,
  },
  ring: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: 'rgba(13, 115, 119, 0.4)',
    top: 0,
  },
  button: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: theme.colors.primaryLight,
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  label: {
    fontFamily: theme.typography.urdu,
    color: theme.colors.primaryLight,
    fontSize: 18,
    marginTop: theme.spacing.md,
    fontWeight: 'bold',
  }
});
