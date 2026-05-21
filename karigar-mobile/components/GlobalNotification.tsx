import React from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';

export default function GlobalNotification() {
  const { globalNotification, dismissNotification, theme } = useStore();
  const [opacity] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    if (globalNotification) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [globalNotification]);

  if (!globalNotification) return null;

  const isDark = theme === 'dark';
  const getIcon = () => {
    switch (globalNotification.type) {
      case 'success': return 'checkmark-circle';
      case 'warning': return 'warning';
      default: return 'notifications';
    }
  };
  
  const getColor = () => {
    switch (globalNotification.type) {
      case 'success': return '#2ECC71';
      case 'warning': return '#F39C12';
      default: return '#3498DB';
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity, backgroundColor: isDark ? '#1E1E24' : '#fff', borderLeftColor: getColor() }]}>
      <View style={styles.content}>
        <Ionicons name={getIcon()} size={24} color={getColor()} />
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: isDark ? '#fff' : '#111' }]}>{globalNotification.title}</Text>
          <Text style={[styles.body, { color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }]}>{globalNotification.body}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={dismissNotification} style={styles.closeBtn}>
        <Ionicons name="close" size={20} color={isDark ? 'rgba(255,255,255,0.4)' : '#888'} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderLeftWidth: 4,
    zIndex: 9999,
  },
  content: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  textContainer: { marginLeft: 12, flex: 1 },
  title: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  body: { fontSize: 13 },
  closeBtn: { padding: 4 },
});
