import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { db } from '../../src/db/client';
import { topics, reviews } from '../../src/db/schema';
import { eq, lte } from 'drizzle-orm';

export default function Dashboard() {
  const [dueCount, setDueCount] = useState(0);
  const [totalTopics, setTotalTopics] = useState(0);
  const [studiedCount, setStudiedCount] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const now = Date.now();
    const allTopics = await db.select().from(topics).where(eq(topics.isArchived, 0));
    const dueReviews = await db.select().from(reviews).where(lte(reviews.dueAt, now));
    setTotalTopics(allTopics.length);
    setStudiedCount(allTopics.filter((t) => t.status !== 'not_studied').length);
    setDueCount(dueReviews.length);
  }

  const coveragePct = totalTopics > 0 ? Math.round((studiedCount / totalTopics) * 100) : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Dashboard</Text>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{dueCount}</Text>
          <Text style={styles.statLabel}>Reviews Due</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#27ae60' }]}>{coveragePct}%</Text>
          <Text style={styles.statLabel}>Coverage</Text>
        </View>
      </View>

      <Link href="/review" asChild>
        <Pressable style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Start Review</Text>
        </Pressable>
      </Link>

      <Link href="/registry" asChild>
        <Pressable style={styles.secondaryBtn}>
          <Text style={styles.secondaryBtnText}>Browse Topics (A-Z)</Text>
        </Pressable>
      </Link>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>No definitions stored</Text>
        <Text style={styles.infoText}>This app stores only your own summaries, recall questions, and jw.org URLs. No jw.org content is cached or copied.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  content: { padding: 20 },
  heading: { fontSize: 28, fontWeight: '700', color: '#1e3a5f', marginBottom: 20 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statBox: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 12, marginHorizontal: 4, alignItems: 'center' },
  statNumber: { fontSize: 32, fontWeight: '700', color: '#1e3a5f' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  primaryBtn: { backgroundColor: '#1e3a5f', padding: 16, borderRadius: 10, alignItems: 'center', marginBottom: 12 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryBtn: { backgroundColor: '#fff', padding: 16, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#1e3a5f', marginBottom: 20 },
  secondaryBtnText: { color: '#1e3a5f', fontSize: 16, fontWeight: '600' },
  infoBox: { backgroundColor: '#e8f4fd', padding: 16, borderRadius: 10 },
  infoTitle: { fontWeight: '600', color: '#1e3a5f', marginBottom: 6 },
  infoText: { color: '#34495e', fontSize: 13, lineHeight: 18 },
});
