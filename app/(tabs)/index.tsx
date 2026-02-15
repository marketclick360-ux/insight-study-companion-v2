import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { v4 as uuidv4 } from 'uuid';
import { and, eq, inArray, lte } from 'drizzle-orm';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { db } from '../../src/db/client';
import { reviews, studyEntries, topics } from '../../src/db/schema';

async function bootstrapReviewsFromStudyEntries(now: number) {
  const studied = await db.select({ topicId: studyEntries.topicId }).from(studyEntries);
  const studiedIds = Array.from(new Set(studied.map((r) => r.topicId).filter(Boolean)));
  if (!studiedIds.length) return;

  const activeTopics = await db
    .select({ id: topics.id, status: topics.status })
    .from(topics)
    .where(and(inArray(topics.id, studiedIds), eq(topics.isArchived, 0)));

  const activeIds = activeTopics.map((t) => t.id);
  if (!activeIds.length) return;

  const existing = await db
    .select({ topicId: reviews.topicId })
    .from(reviews)
    .where(inArray(reviews.topicId, activeIds));

  const existingSet = new Set(existing.map((r) => r.topicId));
  const missingIds = activeIds.filter((id) => !existingSet.has(id));
  if (!missingIds.length) return;

  await db.insert(reviews).values(
    missingIds.map((topicId) => ({
      id: uuidv4(),
      topicId,
      dueAt: now,
      updatedAt: now,
    }))
  );

  await db.update(topics).set({ nextDueAt: now, updatedAt: now }).where(inArray(topics.id, missingIds));
  await db.update(topics).set({ status: 'studied_once', updatedAt: now })
    .where(and(inArray(topics.id, missingIds), eq(topics.status, 'not_studied')));
}

export default function Dashboard() {
  const { colors } = useTheme();
  const [dueCount, setDueCount] = useState(0);
  const [totalTopics, setTotalTopics] = useState(0);
  const [studiedCount, setStudiedCount] = useState(0);

  useEffect(() => { loadStats(); }, []);

  async function loadStats() {
    const now = Date.now();
    await bootstrapReviewsFromStudyEntries(now);

    const allTopics = await db
      .select({ id: topics.id, status: topics.status })
      .from(topics)
      .where(eq(topics.isArchived, 0));

    const dueReviews = await db
      .select({ id: reviews.id })
      .from(reviews)
      .innerJoin(topics, eq(reviews.topicId, topics.id))
      .where(and(eq(topics.isArchived, 0), lte(reviews.dueAt, now)));

    setTotalTopics(allTopics.length);
    setStudiedCount(allTopics.filter((t) => t.status !== 'not_studied').length);
    setDueCount(dueReviews.length);
  }

  const coveragePct = totalTopics > 0 ? Math.round((studiedCount / totalTopics) * 100) : 0;

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20 },
    heading: { fontSize: 28, fontWeight: '700', color: colors.text, marginBottom: 20 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    statBox: {
      flex: 1, backgroundColor: colors.surface, padding: 16,
      borderRadius: 12, marginHorizontal: 4, alignItems: 'center',
    },
    statNumber: { fontSize: 32, fontWeight: '700', color: colors.primary },
    statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
    primaryBtn: {
      backgroundColor: colors.primary, padding: 16, borderRadius: 10,
      alignItems: 'center', marginBottom: 12,
    },
    primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    secondaryBtn: {
      backgroundColor: colors.surface, padding: 16, borderRadius: 10,
      alignItems: 'center', borderWidth: 1, borderColor: colors.primary, marginBottom: 20,
    },
    secondaryBtnText: { color: colors.primary, fontSize: 16, fontWeight: '600' },
    infoBox: {
      backgroundColor: colors.primaryLight, padding: 16, borderRadius: 10,
    },
    infoTitle: { fontWeight: '600', color: colors.primary, marginBottom: 6 },
    infoText: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.heading}>Dashboard</Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{dueCount}</Text>
            <Text style={styles.statLabel}>Reviews Due</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{coveragePct}%</Text>
            <Text style={styles.statLabel}>Coverage</Text>
          </View>
        </View>

        <Link href="/(tabs)/review" asChild>
          <Pressable style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Start Review</Text>
          </Pressable>
        </Link>

        <Link href="/(tabs)/study" asChild>
          <Pressable style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>Browse Topics (A-Z)</Text>
          </Pressable>
        </Link>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>No definitions stored</Text>
          <Text style={styles.infoText}>
            This app stores only your own summaries, recall questions, and jw.org URLs.
            No jw.org content is cached or copied.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
