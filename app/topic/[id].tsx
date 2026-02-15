import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { eq } from 'drizzle-orm';

import { useTheme } from '../../context/ThemeContext';
import { db } from '../../src/db/client';
import { topics, studyEntries, reviews } from '../../src/db/schema';

export default function TopicDetailScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState<any>(null);
  const [entryCount, setEntryCount] = useState(0);
  const [review, setReview] = useState<any>(null);
  const [isDue, setIsDue] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const rows = await db.select().from(topics).where(eq(topics.id, id));
      if (!rows.length) { Alert.alert('Not found'); router.back(); return; }
      setTopic(rows[0]);

      const entries = await db.select().from(studyEntries).where(eq(studyEntries.topicId, id));
      setEntryCount(entries.length);

      const revRows = await db.select().from(reviews).where(eq(reviews.topicId, id));
      if (revRows.length) {
        setReview(revRows[0]);
        setIsDue(revRows[0].dueAt <= Date.now());
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const openJwOrg = async () => {
    if (topic?.jwUrl) await WebBrowser.openBrowserAsync(topic.jwUrl);
  };

  const handleArchive = () => {
    Alert.alert('Archive Topic', 'This will hide the topic from your list.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive', style: 'destructive',
        onPress: async () => {
          await db.update(topics).set({ isArchived: 1, updatedAt: Date.now() }).where(eq(topics.id, id!));
          router.back();
        },
      },
    ]);
  };

  const statusColor = (s: string) => {
    if (s === 'mastered') return '#10B981';
    if (s === 'in_review') return '#3B82F6';
    if (s === 'studied_once') return '#F59E0B';
    return colors.textSecondary;
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { padding: 20, paddingTop: 10 },
    backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    backText: { fontSize: 16, color: colors.primary, marginLeft: 4 },
    topicName: { fontSize: 28, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
    statusPill: {
      alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 6,
      borderRadius: 20, marginBottom: 16,
    },
    statusPillText: { fontSize: 13, fontWeight: '700', color: '#fff' },
    masteryCard: {
      backgroundColor: colors.surface, borderRadius: 16, padding: 20,
      marginHorizontal: 20, marginBottom: 16,
    },
    masteryLabel: { fontSize: 14, color: colors.textSecondary, marginBottom: 8 },
    masteryRow: { flexDirection: 'row', alignItems: 'flex-end' },
    masteryValue: { fontSize: 48, fontWeight: '700', color: colors.primary },
    masteryMax: { fontSize: 20, color: colors.textSecondary, marginBottom: 8, marginLeft: 4 },
    progressBarBg: {
      height: 8, backgroundColor: colors.border, borderRadius: 4,
      overflow: 'hidden', marginTop: 12,
    },
    progressBarFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
    infoCard: {
      backgroundColor: colors.surface, borderRadius: 16, padding: 20,
      marginHorizontal: 20, marginBottom: 16,
    },
    infoRow: {
      flexDirection: 'row', justifyContent: 'space-between',
      paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    infoLabel: { fontSize: 14, color: colors.textSecondary },
    infoValue: { fontSize: 14, fontWeight: '600', color: colors.text },
    btnPrimary: {
      backgroundColor: colors.primary, borderRadius: 12,
      padding: 16, alignItems: 'center', marginHorizontal: 20, marginBottom: 10,
    },
    btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    btnSecondary: {
      backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1,
      borderColor: colors.primary, padding: 16, alignItems: 'center',
      marginHorizontal: 20, marginBottom: 10,
    },
    btnSecondaryText: { color: colors.primary, fontSize: 16, fontWeight: '600' },
    btnDanger: {
      borderRadius: 12, borderWidth: 1, borderColor: '#EF4444',
      padding: 14, alignItems: 'center', marginHorizontal: 20, marginBottom: 30,
    },
    btnDangerText: { color: '#EF4444', fontSize: 14, fontWeight: '600' },
  }), [colors]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!topic) return null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
          <Text style={styles.backText}>Topics</Text>
        </TouchableOpacity>
        <Text style={styles.topicName}>{topic.name}</Text>
        <View style={[styles.statusPill, { backgroundColor: statusColor(topic.status) }]}>
          <Text style={styles.statusPillText}>{topic.status.replace('_', ' ').toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.masteryCard}>
        <Text style={styles.masteryLabel}>Mastery Score</Text>
        <View style={styles.masteryRow}>
          <Text style={styles.masteryValue}>{topic.masteryScore}</Text>
          <Text style={styles.masteryMax}>/100</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${Math.min(100, topic.masteryScore)}%` }]} />
        </View>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Study entries</Text>
          <Text style={styles.infoValue}>{entryCount}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Reviews completed</Text>
          <Text style={styles.infoValue}>{review?.repetitions ?? 0}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Ease factor</Text>
          <Text style={styles.infoValue}>{review?.easeFactor?.toFixed(2) ?? '2.50'}</Text>
        </View>
        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.infoLabel}>Next review</Text>
          <Text style={styles.infoValue}>
            {review?.dueAt ? (isDue ? 'Due now' : new Date(review.dueAt).toLocaleDateString()) : 'N/A'}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.btnPrimary} onPress={openJwOrg}>
        <Text style={styles.btnPrimaryText}>Open on jw.org</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.btnPrimary}
        onPress={() => router.push(`/topic/${id}/study`)}
      >
        <Text style={styles.btnPrimaryText}>Start Study Session</Text>
      </TouchableOpacity>

      {isDue && (
        <TouchableOpacity
          style={styles.btnSecondary}
          onPress={() => router.push('/(tabs)/review')}
        >
          <Text style={styles.btnSecondaryText}>Review Now (Due)</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.btnDanger} onPress={handleArchive}>
        <Text style={styles.btnDangerText}>Archive Topic</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
