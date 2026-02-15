import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { eq, lte, gte, and, count, avg } from 'drizzle-orm';
import { db } from '../../src/db/client';
import { topics, reviews, activityLog } from '../../src/db/schema';

const { width } = Dimensions.get('window');
const DAY_MS = 24 * 60 * 60 * 1000;

interface StatCardProps {
  icon: string; label: string; value: string | number; color: string; colors: any;
}

const StatCard = ({ icon, label, value, color, colors }: StatCardProps) => (
  <View style={[cardStyles.statCard, { backgroundColor: colors.surface }]}>
    <View style={[cardStyles.iconContainer, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon as any} size={24} color={color} />
    </View>
    <Text style={[cardStyles.statValue, { color: colors.text }]}>{value}</Text>
    <Text style={[cardStyles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
  </View>
);

const cardStyles = StyleSheet.create({
  statCard: {
    width: (width - 48) / 2, padding: 16, borderRadius: 16,
    alignItems: 'center', marginBottom: 16,
  },
  iconContainer: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  statValue: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { fontSize: 12, textAlign: 'center' },
});

export default function ProgressScreen() {
  const { colors } = useTheme();

  const [totalStudied, setTotalStudied] = useState(0);
  const [mastered, setMastered] = useState(0);
  const [dueCount, setDueCount] = useState(0);
  const [avgMastery, setAvgMastery] = useState(0);
  const [streak, setStreak] = useState(0);
  const [retention, setRetention] = useState(0);
  const [weeklyData, setWeeklyData] = useState<{ day: string; count: number }[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const now = Date.now();

    // Total studied (not 'not_studied')
    const allTopics = await db.select().from(topics).where(eq(topics.isArchived, 0));
    const studied = allTopics.filter((t) => t.status !== 'not_studied');
    setTotalStudied(studied.length);
    setMastered(allTopics.filter((t) => t.status === 'mastered').length);

    // Average mastery
    if (studied.length > 0) {
      const sum = studied.reduce((acc, t) => acc + (t.masteryScore ?? 0), 0);
      setAvgMastery(Math.round(sum / studied.length));
    }

    // Due count
    const due = await db.select().from(reviews)
      .innerJoin(topics, eq(reviews.topicId, topics.id))
      .where(and(eq(topics.isArchived, 0), lte(reviews.dueAt, now)));
    setDueCount(due.length);

    // Retention rate (from reviews with lastScore)
    const allReviews = await db.select().from(reviews);
    const scored = allReviews.filter((r) => r.lastScore !== null);
    if (scored.length > 0) {
      const passed = scored.filter((r) => (r.lastScore ?? 0) >= 3).length;
      setRetention(Math.round((passed / scored.length) * 100));
    }

    // Streak: consecutive days with activity
    const logs = await db.select().from(activityLog)
      .where(eq(activityLog.type, 'REVIEW_COMPLETED'));
    const daySet = new Set(logs.map((l) =>
      new Date(l.timestamp).toISOString().slice(0, 10)
    ));
    let s = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today.getTime() - i * DAY_MS);
      const key = d.toISOString().slice(0, 10);
      if (daySet.has(key)) s++;
      else break;
    }
    setStreak(s);

    // Weekly activity (last 7 days)
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekly: { day: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * DAY_MS);
      const key = d.toISOString().slice(0, 10);
      const dayLogs = logs.filter((l) =>
        new Date(l.timestamp).toISOString().slice(0, 10) === key
      );
      weekly.push({ day: dayNames[d.getDay()], count: dayLogs.length });
    }
    setWeeklyData(weekly);
  }

  const maxCount = Math.max(1, ...weeklyData.map((d) => d.count));

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { padding: 20, paddingTop: 10 },
    title: { fontSize: 28, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
    subtitle: { fontSize: 16, color: colors.textSecondary },
    statsGrid: {
      flexDirection: 'row', flexWrap: 'wrap',
      justifyContent: 'space-between', paddingHorizontal: 16,
    },
    sectionTitle: {
      fontSize: 20, fontWeight: '600', color: colors.text,
      paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16,
    },
    chartContainer: {
      marginHorizontal: 16, backgroundColor: colors.surface,
      borderRadius: 16, padding: 20,
    },
    chartTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 20 },
    barsContainer: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'flex-end', height: 120,
    },
    barWrapper: { alignItems: 'center', flex: 1 },
    bar: { width: 24, borderRadius: 12, marginBottom: 8 },
    dayLabel: { fontSize: 12, color: colors.textSecondary },
    streakCard: {
      margin: 16, backgroundColor: colors.primary, borderRadius: 16,
      padding: 20, flexDirection: 'row', alignItems: 'center',
    },
    streakContent: { flex: 1, marginLeft: 16 },
    streakTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
    streakText: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
    retentionSection: {
      margin: 16, backgroundColor: colors.surface,
      borderRadius: 16, padding: 20,
    },
    retentionHeader: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', marginBottom: 16,
    },
    retentionTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
    retentionValue: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
    progressBar: {
      height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden',
    },
    progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  }), [colors]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Progress</Text>
        <Text style={styles.subtitle}>Track your mastery journey</Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard icon="book" label="Topics Studied" value={totalStudied} color="#3B82F6" colors={colors} />
        <StatCard icon="trophy" label="Mastered" value={mastered} color="#10B981" colors={colors} />
        <StatCard icon="time" label="Reviews Due" value={dueCount} color="#F59E0B" colors={colors} />
        <StatCard icon="stats-chart" label="Avg Mastery" value={`${avgMastery}%`} color="#8B5CF6" colors={colors} />
      </View>

      <View style={styles.streakCard}>
        <Ionicons name="flame" size={48} color="#FCD34D" />
        <View style={styles.streakContent}>
          <Text style={styles.streakTitle}>{streak} Day Streak!</Text>
          <Text style={styles.streakText}>
            {streak > 0 ? 'Keep it up! Study today to maintain your streak.' : 'Complete a review to start your streak!'}
          </Text>
        </View>
      </View>

      <View style={styles.retentionSection}>
        <View style={styles.retentionHeader}>
          <Text style={styles.retentionTitle}>Retention Rate</Text>
          <Text style={styles.retentionValue}>{retention}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${retention}%` }]} />
        </View>
      </View>

      <Text style={styles.sectionTitle}>This Week</Text>
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Daily Activity</Text>
        <View style={styles.barsContainer}>
          {weeklyData.map((item, index) => (
            <View key={index} style={styles.barWrapper}>
              <View
                style={[
                  styles.bar,
                  {
                    height: Math.max(4, (item.count / maxCount) * 100),
                    backgroundColor: item.count > 0 ? colors.primary : colors.border,
                  },
                ]}
              />
              <Text style={styles.dayLabel}>{item.day}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
