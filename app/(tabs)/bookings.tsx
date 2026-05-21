import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

export default function BookingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Bookings Screen (Placeholder)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' },
  text: { color: theme.colors.textMain }
});
