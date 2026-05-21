import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  message?: string;
  visible: boolean;
  onDismiss?: () => void;
}

export default function WhatsAppNotification({ message, visible, onDismiss }: Props) {
  const translateY = useRef(new Animated.Value(-120)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(translateY, {
          toValue: -120,
          duration: 300,
          useNativeDriver: true,
        }).start(() => onDismiss?.());
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      translateY.setValue(-120);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name="logo-whatsapp" size={24} color="#fff" />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.appName}>Karigar AI</Text>
          <Text style={styles.message}>
            {message || 'آپ کی بکنگ تصدیق ہو گئی ✅'}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  card: {
    backgroundColor: '#075E54',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textWrap: { flex: 1 },
  appName: {
    color: '#25D366',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  message: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});
