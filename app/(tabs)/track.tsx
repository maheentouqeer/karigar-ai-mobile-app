import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import MapView, { Marker, Polyline } from 'react-native-maps';

export default function TrackScreen() {
  const [carCoordinate, setCarCoordinate] = useState({ latitude: 33.6844, longitude: 73.0479 }); // Mock Islamabad roughly
  const homeCoordinate = { latitude: 33.7294, longitude: 73.0931 }; // Home location

  useEffect(() => {
    let progress = 0;
    const timer = setInterval(() => {
      progress += 0.05;
      if (progress > 1) {
        clearInterval(timer);
        return;
      }
      setCarCoordinate({
        latitude: 33.6844 + (33.7294 - 33.6844) * progress,
        longitude: 73.0479 + (73.0931 - 73.0479) * progress,
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="arrow-forward" size={24} color={theme.colors.primaryLight} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>ٹریکنگ</Text>
          <Text style={styles.headerSub}>شام 6 بجے کی بکنگ</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="notifications-outline" size={24} color={theme.colors.primaryLight} />
        </TouchableOpacity>
      </View>

      <View style={styles.mapArea}>
        <MapView 
          style={styles.mapView}
          initialRegion={{
            latitude: 33.7000,
            longitude: 73.0700,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          }}
        >
          <Marker coordinate={homeCoordinate}>
            <View style={styles.homeMarker}>
              <View style={styles.homeIconWrap}>
                <Ionicons name="home" size={16} color="#000" />
              </View>
            </View>
          </Marker>

          <Marker coordinate={carCoordinate}>
            <View style={styles.carMarker}>
              <View style={styles.carIconWrap}>
                <Ionicons name="car" size={16} color="#000" />
              </View>
              <View style={styles.carLabelWrap}>
                <Text style={styles.carLabel}>Tariq</Text>
              </View>
            </View>
          </Marker>
          <Polyline 
            coordinates={[carCoordinate, homeCoordinate]}
            strokeColor={theme.colors.primary}
            strokeWidth={3}
            strokeDasharray={[8, 8]}
          />
        </MapView>
        
        {/* Mock Map Elements */}
        <View style={styles.etaChip}>
          <Text style={styles.etaText}>⏱ 12 منٹ میں پہنچیں گے</Text>
        </View>
        
        <View style={styles.homeMarker}>
          <View style={styles.homeIconWrap}>
            <Ionicons name="home" size={16} color="#000" />
          </View>
        </View>

        <View style={styles.carMarker}>
          <View style={styles.carIconWrap}>
            <Ionicons name="car" size={16} color="#000" />
          </View>
          <View style={styles.carLabelWrap}>
            <Text style={styles.carLabel}>Tariq</Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomSheet}>
        <View style={styles.dragHandle} />
        
        <View style={styles.providerRow}>
          <View style={styles.providerRowInner}>
            <View style={styles.avatarWrap}>
              <Text style={styles.avatarText}>TA</Text>
            </View>
            <View>
              <Text style={styles.providerName}>Tariq AC Services</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={12} color={theme.colors.warning} />
                <Text style={styles.ratingText}>4.7</Text>
                <View style={styles.dot} />
                <Text style={styles.verifiedText}>ویریفائیڈ کاریگر</Text>
              </View>
            </View>
          </View>
          <View style={styles.enRouteBadge}>
            <Text style={styles.enRouteText}>🚗 راستے میں</Text>
          </View>
        </View>

        <View style={styles.progressTimeline}>
          <View style={styles.progressBgLine} />
          <View style={styles.progressActiveLine} />
          
          <View style={styles.progressStep}>
            <View style={styles.stepDotCompleted}>
              <Ionicons name="checkmark" size={14} color="#000" />
            </View>
            <Text style={styles.stepLabel}>بکنگ تصدیق</Text>
          </View>

          <View style={styles.progressStep}>
            <View style={styles.stepDotCompleted}>
              <Ionicons name="checkmark" size={14} color="#000" />
            </View>
            <Text style={styles.stepLabel}>روانہ</Text>
          </View>

          <View style={styles.progressStep}>
            <View style={styles.stepDotActive}>
              <Ionicons name="hourglass-outline" size={16} color="#000" />
            </View>
            <Text style={styles.stepLabelActive}>راستے میں</Text>
          </View>

          <View style={styles.progressStep}>
            <View style={styles.stepDotPending}>
              <Ionicons name="location-outline" size={14} color={theme.colors.textSecondary} />
            </View>
            <Text style={styles.stepLabelPending}>پہنچ گئے</Text>
          </View>

          <View style={styles.progressStep}>
            <View style={styles.stepDotPending}>
              <Ionicons name="checkmark-circle-outline" size={14} color={theme.colors.textSecondary} />
            </View>
            <Text style={styles.stepLabelPending}>مکمل</Text>
          </View>
        </View>

        <View style={styles.liveUpdatesBox}>
          <View style={styles.updateHeaderRow}>
            <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.updateTitle}>لائیو اپ ڈیٹس</Text>
          </View>
          
          <View style={styles.updateList}>
            <View style={styles.updateRow}>
              <View style={styles.updateLineActive} />
              <Text style={styles.updateText}>6:22 بجے: F-10 سے گزر رہے ہیں</Text>
            </View>
            <View style={styles.updateRow}>
              <View style={styles.updateLinePending} />
              <Text style={styles.updateTextPending}>6:15 بجے: Tariq روانہ ہو گئے</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionBtnsRow}>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="call-outline" size={20} color={theme.colors.primaryLight} />
            <Text style={styles.actionBtnText}>کال کریں</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="chatbubble-outline" size={20} color={theme.colors.primaryLight} />
            <Text style={styles.actionBtnText}>پیغام</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.aiNote}>
          <Ionicons name="sparkles" size={14} color={theme.colors.primaryLight} />
          <Text style={styles.aiNoteText}>آج کا ٹریفک معمول کے مطابق ہے</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 64,
    backgroundColor: 'rgba(30,31,38,0.8)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: theme.typography.urdu,
    fontSize: 20,
    color: theme.colors.primaryLight,
  },
  headerSub: {
    fontFamily: theme.typography.urdu,
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: -4,
  },
  iconBtn: {
    padding: 8,
  },
  mapArea: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#0c0e14',
  },
  mapImage: {
    width: '100%',
    height: '100%',
    opacity: 0.5,
  },
  mapView: {
    width: '100%',
    height: '100%',
  },
  etaChip: {
    position: 'absolute',
    top: 80,
    alignSelf: 'center',
    backgroundColor: 'rgba(28, 31, 38, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  etaText: {
    fontFamily: theme.typography.urdu,
    color: theme.colors.primaryLight,
    fontWeight: 'bold',
  },
  homeMarker: {
    alignItems: 'center',
  },
  homeIconWrap: {
    width: 32,
    height: 32,
    backgroundColor: theme.colors.accent,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  carMarker: {
    alignItems: 'center',
  },
  carIconWrap: {
    width: 32,
    height: 32,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  carLabelWrap: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  carLabel: {
    color: '#fff',
    fontSize: 10,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '55%',
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 16,
    paddingTop: 8,
    zIndex: 20,
  },
  dragHandle: {
    width: 48,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  providerRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  providerRowInner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 16,
  },
  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(13, 115, 119, 0.2)',
  },
  avatarText: {
    color: '#000',
    fontSize: 20,
    fontWeight: 'bold',
  },
  providerName: {
    fontFamily: theme.typography.englishBold,
    fontSize: 18,
    color: theme.colors.textMain,
    textAlign: 'right',
  },
  ratingRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ratingText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.textSecondary,
    marginHorizontal: 4,
  },
  verifiedText: {
    fontFamily: theme.typography.urdu,
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  enRouteBadge: {
    backgroundColor: 'rgba(244, 162, 97, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(244, 162, 97, 0.3)',
  },
  enRouteText: {
    fontFamily: theme.typography.urdu,
    color: theme.colors.accent,
    fontWeight: 'bold',
    fontSize: 12,
  },
  progressTimeline: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    position: 'relative',
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  progressBgLine: {
    position: 'absolute',
    top: 12,
    left: 20,
    right: 20,
    height: 4,
    backgroundColor: theme.colors.surfaceHigh,
    borderRadius: 2,
    zIndex: 0,
  },
  progressActiveLine: {
    position: 'absolute',
    top: 12,
    right: 20,
    width: '50%',
    height: 4,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: 2,
    zIndex: 0,
  },
  progressStep: {
    alignItems: 'center',
    zIndex: 1,
  },
  stepDotCompleted: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primaryLight,
    borderWidth: 2,
    borderColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.accent,
    borderWidth: 2,
    borderColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -4,
  },
  stepDotPending: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceHigh,
    borderWidth: 2,
    borderColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    fontFamily: theme.typography.urdu,
    color: theme.colors.textSecondary,
    fontSize: 10,
    marginTop: 8,
  },
  stepLabelActive: {
    fontFamily: theme.typography.urdu,
    color: theme.colors.accent,
    fontWeight: 'bold',
    fontSize: 10,
    marginTop: 4,
  },
  stepLabelPending: {
    fontFamily: theme.typography.urdu,
    color: theme.colors.textSecondary,
    fontSize: 10,
    marginTop: 8,
    opacity: 0.6,
  },
  liveUpdatesBox: {
    backgroundColor: 'rgba(30,31,38,0.3)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 24,
  },
  updateHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  updateTitle: {
    fontFamily: theme.typography.urdu,
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  updateList: {
    paddingRight: 8,
  },
  updateRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 16,
  },
  updateLineActive: {
    position: 'absolute',
    right: -2,
    width: 2,
    height: '150%',
    backgroundColor: theme.colors.primaryLight,
  },
  updateLinePending: {
    position: 'absolute',
    right: -2,
    width: 2,
    height: '150%',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  updateText: {
    fontFamily: theme.typography.urdu,
    color: theme.colors.textMain,
    fontSize: 14,
    marginRight: 16,
  },
  updateTextPending: {
    fontFamily: theme.typography.urdu,
    color: theme.colors.textMain,
    fontSize: 14,
    marginRight: 16,
    opacity: 0.7,
  },
  actionBtnsRow: {
    flexDirection: 'row-reverse',
    gap: 16,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    borderRadius: 12,
  },
  actionBtnText: {
    fontFamily: theme.typography.urdu,
    color: theme.colors.primaryLight,
    fontWeight: 'bold',
  },
  aiNote: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 12,
  },
  aiNoteText: {
    fontFamily: theme.typography.urdu,
    color: theme.colors.primaryLight,
    fontSize: 12,
    opacity: 0.8,
  }
});
