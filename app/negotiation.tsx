import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import NegotiationView from '../components/NegotiationView';

export default function NegotiationScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <View style={styles.titleWrap}>
          <Ionicons name="scale-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.headerTitle}>AI مذاکرات</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="information-circle-outline" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <NegotiationView 
          customerBudget={500} 
          providerBaseRate={800} 
          providerName="علی اے سی سروسز" 
        />

        <View style={styles.timelineCard}>
          <View style={styles.timelineLine} />
          
          <View style={styles.step}>
            <View style={[styles.dot, styles.dotSuccess]}>
              <Ionicons name="checkmark" size={14} color="#000" />
            </View>
            <Text style={styles.stepText}>کسٹمر کی درخواست موصول ہوئی — Rs500 بجٹ</Text>
          </View>
          
          <View style={styles.step}>
            <View style={[styles.dot, styles.dotSuccess]}>
              <Ionicons name="checkmark" size={14} color="#000" />
            </View>
            <Text style={styles.stepText}>مارکیٹ ریٹ چیک کیا گیا — Rs800 کم از کم</Text>
          </View>
          
          <View style={styles.step}>
            <View style={[styles.dot, styles.dotActive]}>
              <Ionicons name="flash" size={14} color="#fff" />
            </View>
            <Text style={[styles.stepText, styles.stepTextActive]}>AI درمیانی راستہ تلاش کر رہا ہے...</Text>
          </View>
          
          <View style={[styles.step, { opacity: 0.4 }]}>
            <View style={styles.dotPending} />
            <Text style={styles.stepTextPending}>دونوں فریقین کو تجویز</Text>
          </View>
          
          <View style={[styles.step, { opacity: 0.4 }]}>
            <View style={styles.dotPending} />
            <Text style={styles.stepTextPending}>معاہدہ</Text>
          </View>
        </View>

        <View style={styles.proposalCard}>
          <View style={styles.proposalHeader}>
            <Text style={styles.bestChoiceBadge}>بہترین انتخاب</Text>
            <Text style={styles.proposalTitle}>کی تجویز AI</Text>
          </View>
          
          <View style={styles.proposalBody}>
            <Text style={styles.proposalDesc}>
              شام <Text style={{fontFamily: theme.typography.english}}>6</Text> بجے کی سلاٹ کے لیے 
              <Text style={{color: theme.colors.accent, fontFamily: theme.typography.englishBold}}> Rs650</Text>
            </Text>
            <Text style={styles.proposalSub}>کم مانگ کی وجہ سے رعایت دی گئی ہے</Text>
          </View>
          
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.acceptBtn}>
              <Ionicons name="checkmark" size={18} color="#2f1400" />
              <Text style={styles.acceptBtnText}>قبول کریں</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.moreOptionsBtn}>
              <Text style={styles.moreOptionsText}>مزید اختیارات</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.chatSection}>
          <Text style={styles.chatTitle}>لائیو مذاکرات</Text>
          
          <View style={styles.providerMsgRow}>
            <View style={styles.msgAvatarWrap}>
              <Image source={{uri: 'https://via.placeholder.com/32'}} style={styles.msgAvatar} />
            </View>
            <View style={styles.providerMsgBubble}>
              <Text style={styles.msgText}>بھائی، Rs800 سے کم میں کام نہیں ہو سکے گا، گیس کے پیسے بھی پورے نہیں ہوتے۔</Text>
            </View>
          </View>
          
          <View style={styles.systemMsgWrap}>
            <View style={styles.systemMsgBadge}>
              <Text style={styles.systemMsgBadgeText}>Karigar AI نے صورتحال کا جائزہ لیا</Text>
            </View>
            <View style={styles.systemMsgBubble}>
              <Text style={styles.systemMsgText}>علی، اگر آپ شام 6 بجے کسٹمر کے قریب ہیں، تو Rs650 میں یہ کام آپ کے لیے موزوں رہے گا۔</Text>
            </View>
          </View>
          
          <View style={styles.customerMsgRow}>
            <View style={styles.msgAvatarWrap}>
              <Image source={{uri: 'https://via.placeholder.com/32'}} style={styles.msgAvatar} />
            </View>
            <View style={styles.customerMsgBubble}>
              <Text style={styles.msgText}>ٹھیک ہے، اگر Rs650 میں علی بھائی آسکتے ہیں تو مجھے منظور ہے۔</Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
  },
  iconBtn: {
    padding: 8,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: theme.typography.urdu,
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  content: {
    padding: theme.spacing.marginMobile,
    paddingBottom: 40,
  },
  timelineCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginVertical: 16,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 28,
    top: 24,
    bottom: 24,
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    position: 'relative',
    zIndex: 1,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dotSuccess: {
    backgroundColor: theme.colors.success,
  },
  dotActive: {
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: 'rgba(13, 115, 119, 0.4)',
  },
  dotPending: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceHigh,
    borderWidth: 1,
    borderColor: theme.colors.textSecondary,
    marginRight: 12,
  },
  stepText: {
    fontFamily: theme.typography.urdu,
    fontSize: 14,
    color: theme.colors.textMain,
    flex: 1,
    textAlign: 'right',
  },
  stepTextActive: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  stepTextPending: {
    fontFamily: theme.typography.urdu,
    fontSize: 14,
    color: theme.colors.textSecondary,
    flex: 1,
    textAlign: 'right',
  },
  proposalCard: {
    backgroundColor: 'rgba(13, 115, 119, 0.1)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(13, 115, 119, 0.2)',
    marginBottom: 24,
  },
  proposalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bestChoiceBadge: {
    fontFamily: theme.typography.urdu,
    backgroundColor: 'rgba(13, 115, 119, 0.2)',
    color: theme.colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
  },
  proposalTitle: {
    fontFamily: theme.typography.urdu,
    fontSize: 18,
    color: theme.colors.primaryLight,
  },
  proposalBody: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  proposalDesc: {
    fontFamily: theme.typography.urdu,
    fontSize: 20,
    color: theme.colors.textMain,
    textAlign: 'right',
  },
  proposalSub: {
    fontFamily: theme.typography.urdu,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  actionsRow: {
    flexDirection: 'row-reverse',
    gap: 16,
  },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    backgroundColor: theme.colors.accent,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  acceptBtnText: {
    fontFamily: theme.typography.urdu,
    color: '#2f1400',
    fontWeight: 'bold',
    fontSize: 16,
  },
  moreOptionsBtn: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderColor: 'rgba(13, 115, 119, 0.4)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreOptionsText: {
    fontFamily: theme.typography.urdu,
    color: theme.colors.primaryLight,
    fontSize: 16,
  },
  chatSection: {
    marginBottom: 16,
  },
  chatTitle: {
    fontFamily: theme.typography.urdu,
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'right',
    marginBottom: 12,
  },
  providerMsgRow: {
    flexDirection: 'row-reverse',
    marginBottom: 16,
    gap: 12,
  },
  msgAvatarWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  msgAvatar: {
    width: '100%',
    height: '100%',
  },
  providerMsgBubble: {
    backgroundColor: theme.colors.surfaceHigh,
    padding: 12,
    borderRadius: 12,
    borderTopRightRadius: 4,
    maxWidth: '80%',
  },
  msgText: {
    fontFamily: theme.typography.urdu,
    fontSize: 14,
    color: theme.colors.textMain,
  },
  systemMsgWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  systemMsgBadge: {
    backgroundColor: 'rgba(13, 115, 119, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(13, 115, 119, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  systemMsgBadgeText: {
    fontFamily: theme.typography.urdu,
    color: theme.colors.primaryLight,
    fontSize: 12,
  },
  systemMsgBubble: {
    backgroundColor: 'rgba(51, 52, 59, 0.5)',
    padding: 12,
    borderRadius: 12,
    maxWidth: '90%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  systemMsgText: {
    fontFamily: theme.typography.urdu,
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  customerMsgRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  customerMsgBubble: {
    backgroundColor: theme.colors.primary,
    padding: 12,
    borderRadius: 12,
    borderTopLeftRadius: 4,
    maxWidth: '80%',
  }
});
