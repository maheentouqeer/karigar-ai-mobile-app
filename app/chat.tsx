import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import AgentThinkingCard from '../components/AgentThinkingCard';

export default function ChatScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.title}>Karigar AI</Text>
          <Text style={styles.subtitle}>آپ کی درخواست پر کام ہو رہا ہے</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.chatArea}>
        <View style={styles.userMessageWrap}>
          <View style={styles.userMessageBubble}>
            <Text style={styles.userMessageText}>
              AC bilkul thand nahi kar raha, urgent hai, budget 500 hai
            </Text>
          </View>
        </View>

        <AgentThinkingCard />

        <View style={styles.aiMessageCard}>
          <View style={styles.tagsRow}>
            <View style={styles.tag}><Text style={styles.tagTextUrdu}>AC مرمت</Text></View>
            <View style={styles.tag}><Text style={styles.tagTextUrdu}>G-13</Text></View>
            <View style={[styles.tag, styles.tagUrgent]}><Text style={styles.tagTextUrgent}>فوری</Text></View>
            <View style={[styles.tag, styles.tagBudget]}><Text style={styles.tagTextBudget}>محدود بجٹ</Text></View>
          </View>
          
          <Text style={styles.aiSummary}>
            3 ماہر ملے۔ آپ کے بجٹ کے لیے بہترین حل تلاش کر رہے ہیں...
          </Text>
          
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.primaryBtn}>
              <Ionicons name="list" size={18} color={theme.colors.primaryLight} />
              <Text style={styles.primaryBtnText}>View Options</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.callBtn}>
              <Ionicons name="call" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.inputArea}>
        <View style={styles.waveformWrap}>
          <View style={styles.waveBar} />
          <View style={[styles.waveBar, {height: 12}]} />
          <View style={[styles.waveBar, {height: 18}]} />
          <View style={[styles.waveBar, {height: 8}]} />
          <View style={styles.waveBar} />
        </View>
        <TouchableOpacity style={styles.sendBtn}>
          <Ionicons name="send" size={20} color={theme.colors.textMain} />
        </TouchableOpacity>
      </View>
      <Text style={styles.stopRecording}>Tap to stop recording</Text>
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
    padding: theme.spacing.md,
    backgroundColor: 'rgba(30,31,38,0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backBtn: {
    padding: 8,
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  subtitle: {
    fontFamily: theme.typography.urdu,
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: -4,
  },
  chatArea: {
    flex: 1,
    padding: theme.spacing.marginMobile,
  },
  userMessageWrap: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  userMessageBubble: {
    backgroundColor: theme.colors.accent,
    padding: 12,
    borderRadius: 16,
    borderTopRightRadius: 4,
    maxWidth: '85%',
  },
  userMessageText: {
    color: '#2f1400',
    fontSize: 14,
  },
  aiMessageCard: {
    backgroundColor: 'rgba(30,31,38,0.6)',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: 'rgba(13, 115, 119, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(13, 115, 119, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagTextUrdu: {
    fontFamily: theme.typography.urdu,
    color: theme.colors.primaryLight,
    fontSize: 12,
  },
  tagUrgent: {
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    borderColor: 'rgba(231, 76, 60, 0.3)',
  },
  tagTextUrgent: {
    fontFamily: theme.typography.urdu,
    color: theme.colors.error,
    fontSize: 12,
  },
  tagBudget: {
    backgroundColor: 'rgba(243, 156, 18, 0.2)',
    borderColor: 'rgba(243, 156, 18, 0.3)',
  },
  tagTextBudget: {
    fontFamily: theme.typography.urdu,
    color: theme.colors.warning,
    fontSize: 12,
  },
  aiSummary: {
    fontFamily: theme.typography.urdu,
    color: theme.colors.textMain,
    textAlign: 'right',
    fontSize: 16,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: theme.colors.primaryLight,
    fontSize: 14,
    fontWeight: '500',
  },
  callBtn: {
    width: 48,
    height: 40,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(51, 52, 59, 0.3)',
    margin: 16,
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  waveformWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 32,
  },
  waveBar: {
    width: 4,
    height: 4,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: 2,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopRecording: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginBottom: 16,
  }
});
