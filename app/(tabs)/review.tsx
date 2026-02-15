import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { and, desc, eq, inArray, lte } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

import { useTheme } from '../../context/ThemeContext';
import { EmptyState } from '../../components/EmptyState';

import { db } from '../../src/db/client';
import { activityLog, reviews, studyEntries, topics } from '../../src/db/schema';

import { sm2Update, type Quality } from '../../src/engine/sm2';
import { computeMastery, deriveStatus } from '../../src/engine/mastery';

const DAY_MS = 24 * 60 * 60 * 1000;

type RecallQuestion = { id: string; q: string };

type DueRow = {
  reviewId: string;
  topicId: string;
  topicName: string;
  masteryScore: number;
  topicLastReviewedAt: number | null;

  dueAt: number;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
  lastScore: number | null;
  confidenceRating: number | null;
  reviewUpdatedAt: number;
};

type LatestEntry = {
  topicId: string;
  summary: string;
  recallQuestionsJson: string;
  ministryApplication: string;
  contrastNotes: string | null;
  createdAt: number;
};

type ReviewCardItem = {
  reviewId: string;
  topicId: string;
  topicName: string;

  question: string;
  questionIndex: number;
  questionCount: number;

  summary: string;
  ministryApplication: string;
  contrastNotes: string | null;

  masteryScore: number;
  topicLastReviewedAt: number | null;

  dueAt: number;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
  lastScore: number | null;
  confidenceRating: number | null;
  reviewUpdatedAt: number;
};

function safeParseRecallQuestions(json: string): RecallQuestion[] {
  try {
    const arr = JSON.parse(json);
    if (!Array.isArray(arr)) return [];
    return arr
      .map((x) => ({ id: String(x?.id ?? ''), q: String(x?.q ?? '') }))
      .filter((x) => x.id && x.q);
  } catch {
    return [];
  }
}

function computePriority(it: ReviewCardItem, now: number) {
  const overdueDays = Math.max(0, (now - it.dueAt) / DAY_MS);
  const weak = (100 - Math.max(0, Math.min(100, it.masteryScore))) / 100;
  const lapseBoost = Math.min(1, it.lapses / 5);
  const sinceSeenDays = it.topicLastReviewedAt
    ? Math.min(60, (now - it.topicLastReviewedAt) / DAY_MS)
    : 60;

  return (
    3.0 * Math.min(5, overdueDays) +
    2.0 * weak +
    1.0 * (sinceSeenDays / 60) +
    1.0 * lapseBoost
  );
}

export default function ReviewScreen() {
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [reviewItems, setReviewItems] = useState<ReviewCardItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);

  // 1..5 (UI), stored as 0-100 in DB (confidence_rating)
  const [confidence1to5, setConfidence1to5] = useState<number | null>(null);

  const currentItem = reviewItems[currentIndex] ?? null;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        header: { padding: 20, paddingTop: 10 },
        title: {
          fontSize: 28,
          fontWeight: 'bold',
          color: colors.text,
          marginBottom: 8,
        },
        progressText: { fontSize: 16, color: colors.textSecondary },

        cardContainer: { flex: 1, padding: 16 },
        reviewCard: {
          backgroundColor: colors.surface,
          borderRadius: 20,
          padding: 24,
          minHeight: 320,
          justifyContent: 'center',
        },

        badge: {
          backgroundColor: colors.primaryLight,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 20,
          alignSelf: 'flex-start',
          marginBottom: 16,
        },
        badgeText: { color: colors.primary, fontSize: 12, fontWeight: '600' },

        metaRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 10,
        },
        metaText: { color: colors.textSecondary, fontSize: 12 },

        questionText: {
          fontSize: 20,
          fontWeight: '600',
          color: colors.text,
          lineHeight: 28,
        },

        answerContainer: {
          marginTop: 18,
          paddingTop: 18,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          gap: 12,
        },
        answerLabel: {
          fontSize: 13,
          color: colors.textSecondary,
          marginBottom: 6,
        },
        answerText: { fontSize: 16, color: colors.text, lineHeight: 24 },

        showButton: {
          backgroundColor: colors.primary,
          borderRadius: 12,
          padding: 16,
          alignItems: 'center',
          marginTop: 24,
        },
        showButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },

        confidenceTitle: {
          marginTop: 18,
          fontSize: 14,
          fontWeight: '600',
          color: colors.text,
        },
        confidenceRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
        confidenceChip: {
          flex: 1,
          paddingVertical: 12,
          borderRadius: 12,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: 'transparent',
        },
        confidenceChipSelected: {
          borderColor: colors.primary,
          backgroundColor: colors.primaryLight,
        },
        confidenceChipText: { fontWeight: '700', color: colors.text },

        ratingContainer: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 18,
          gap: 8,
        },
        ratingButton: {
          flex: 1,
          padding: 14,
          borderRadius: 12,
          alignItems: 'center',
        },
        ratingText: { fontSize: 12, fontWeight: '600', marginTop: 4 },

        completeContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 40,
        },
        completeTitle: {
          fontSize: 24,
          fontWeight: 'bold',
          color: colors.text,
          marginBottom: 12,
        },
        completeText: {
          fontSize: 16,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: 32,
        },
        restartButton: {
          backgroundColor: colors.primary,
          borderRadius: 12,
          paddingHorizontal: 32,
          paddingVertical: 16,
        },
        restartButtonText: {
          color: '#FFFFFF',
          fontSize: 16,
          fontWeight: '600',
        },
      }),
    [colors]
  );

  const ratingOptions: Array<{ quality: Quality; label: string; color: string; icon: any }> = [
    { quality: 1, label: 'Again', color: '#EF4444', icon: 'close-circle' },
    { quality: 3, label: 'Hard', color: '#F59E0B', icon: 'remove-circle' },
    { quality: 4, label: 'Good', color: '#10B981', icon: 'checkmark-circle' },
    { quality: 5, label: 'Easy', color: '#3B82F6', icon: 'star' },
  ];

  const loadDue = useCallback(async () => {
    setLoading(true);
    try {
      const now = Date.now();

      const dueRows = (await db
        .select({
          reviewId: reviews.id,
          topicId: topics.id,
          topicName: topics.name,
          masteryScore: topics.masteryScore,
          topicLastReviewedAt: topics.lastReviewedAt,

          dueAt: reviews.dueAt,
          easeFactor: reviews.easeFactor,
          intervalDays: reviews.intervalDays,
          repetitions: reviews.repetitions,
          lapses: reviews.lapses,
          lastScore: reviews.lastScore,
          confidenceRating: reviews.confidenceRating,
          reviewUpdatedAt: reviews.updatedAt,
        })
        .from(reviews)
        .innerJoin(topics, eq(reviews.topicId, topics.id))
        .where(and(lte(reviews.dueAt, now), eq(topics.isArchived, 0)))
        .orderBy(reviews.dueAt)) as DueRow[];

      if (!dueRows.length) {
        setReviewItems([]);
        setCurrentIndex(0);
        setSessionComplete(false);
        setShowAnswer(false);
        setConfidence1to5(null);
        return;
      }

      const topicIds = dueRows.map((r) => r.topicId);

      const entryRows = (await db
        .select({
          topicId: studyEntries.topicId,
          summary: studyEntries.summary,
          recallQuestionsJson: studyEntries.recallQuestionsJson,
          ministryApplication: studyEntries.ministryApplication,
          contrastNotes: studyEntries.contrastNotes,
          createdAt: studyEntries.createdAt,
        })
        .from(studyEntries)
        .where(inArray(studyEntries.topicId, topicIds))
        .orderBy(desc(studyEntries.createdAt))) as LatestEntry[];

      const latestByTopic = new Map<string, LatestEntry>();
      for (const row of entryRows) {
        if (!latestByTopic.has(row.topicId)) latestByTopic.set(row.topicId, row);
      }

      const items: ReviewCardItem[] = [];
      for (const r of dueRows) {
        const entry = latestByTopic.get(r.topicId);
        if (!entry) continue;

        const questions = safeParseRecallQuestions(entry.recallQuestionsJson);
        if (!questions.length) continue;

        items.push({
          ...r,
          question: questions[0].q,
          questionIndex: 1,
          questionCount: questions.length,
          summary: entry.summary,
          ministryApplication: entry.ministryApplication,
          contrastNotes: entry.contrastNotes,
        });
      }

      const ordered = [...items].sort(
        (a, b) => computePriority(b, now) - computePriority(a, now)
      );

      setReviewItems(ordered);
      setCurrentIndex(0);
      setSessionComplete(false);
      setShowAnswer(false);
      setConfidence1to5(null);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Review load failed', e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDue();
  }, [loadDue]);

  const handleGrade = useCallback(
    async (quality: Quality) => {
      if (!currentItem || saving) return;

      if (confidence1to5 === null) {
        Alert.alert('Confidence required', 'Pick a confidence rating (1–5) before grading.');
        return;
      }

      setSaving(true);
      try {
        const now = Date.now();
        const overdueDays = Math.max(0, (now - currentItem.dueAt) / DAY_MS);

        const state = {
          easeFactor: currentItem.easeFactor,
          repetitions: currentItem.repetitions,
          intervalDays: currentItem.intervalDays,
          dueAt: currentItem.dueAt,
          lapses: currentItem.lapses,
        };

        const updated = sm2Update(state, quality, now);
        const confidenceRating0to100 = confidence1to5 * 20;

        const daysSinceLastReview = currentItem.topicLastReviewedAt
          ? Math.max(0, (now - currentItem.topicLastReviewedAt) / DAY_MS)
          : 999;

        const mastery = computeMastery({
          lastScore: quality,
          repetitions: updated.repetitions,
          easeFactor: updated.easeFactor,
          confidenceRating: confidenceRating0to100,
          daysSinceLastReview,
          hasStudyEntry: true,
        });

        const status = deriveStatus(true, updated.repetitions, mastery, overdueDays);

        await db
          .update(reviews)
          .set({
            dueAt: updated.dueAt,
            intervalDays: updated.intervalDays,
            easeFactor: updated.easeFactor,
            repetitions: updated.repetitions,
            lapses: updated.lapses,
            lastScore: quality,
            confidenceRating: confidenceRating0to100,
            updatedAt: now,
          })
          .where(eq(reviews.id, currentItem.reviewId));

        await db
          .update(topics)
          .set({
            masteryScore: mastery,
            status,
            lastReviewedAt: now,
            nextDueAt: updated.dueAt,
            updatedAt: now,
          })
          .where(eq(topics.id, currentItem.topicId));

        await db.insert(activityLog).values({
          id: uuidv4(),
          type: 'REVIEW_COMPLETED',
          timestamp: now,
          topicId: currentItem.topicId,
          payloadJson: JSON.stringify({
            quality,
            confidenceRating: confidenceRating0to100,
          }),
        });

        setShowAnswer(false);
        setConfidence1to5(null);

        if (currentIndex < reviewItems.length - 1) {
          setCurrentIndex((i) => i + 1);
        } else {
          setSessionComplete(true);
        }
      } catch (e: any) {
        console.error(e);
        Alert.alert('Save failed', e?.message ?? 'Unknown error');
      } finally {
        setSaving(false);
      }
    },
    [confidence1to5, currentIndex, currentItem, reviewItems.length, saving]
  );

  const resetSession = useCallback(() => {
    loadDue();
  }, [loadDue]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Review</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 12, color: colors.textSecondary }}>
            Loading due reviews…
          </Text>
        </View>
      </View>
    );
  }

  if (reviewItems.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Review</Text>
        </View>
        <EmptyState
          icon="checkmark-done-circle"
          title="All Caught Up!"
          message="You have no items due for review. Keep studying to build your review queue."
        />
      </View>
    );
  }

  if (sessionComplete) {
    return (
      <View style={styles.container}>
        <View style={styles.completeContainer}>
          <Ionicons name="trophy" size={80} color={colors.primary} />
          <Text style={styles.completeTitle}>Session Complete!</Text>
          <Text style={styles.completeText}>
            You reviewed {reviewItems.length} topic(s). Your progress has been saved.
          </Text>
          <TouchableOpacity
            style={styles.restartButton}
            onPress={resetSession}
            disabled={saving}
          >
            <Text style={styles.restartButtonText}>Reload Due Items</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!currentItem) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Review</Text>
        <Text style={styles.progressText}>
          Card {currentIndex + 1} of {reviewItems.length}
        </Text>
      </View>

      <View style={styles.cardContainer}>
        <View style={styles.reviewCard}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{currentItem.topicName}</Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              Mastery {Math.round(currentItem.masteryScore)} / 100
            </Text>
            <Text style={styles.metaText}>
              Q {currentItem.questionIndex} of {currentItem.questionCount}
            </Text>
          </View>

          <Text style={styles.questionText}>{currentItem.question}</Text>

          {showAnswer ? (
            <>
              <View style={styles.answerContainer}>
                <View>
                  <Text style={styles.answerLabel}>Your summary</Text>
                  <Text style={styles.answerText}>{currentItem.summary}</Text>
                </View>

                <View>
                  <Text style={styles.answerLabel}>Ministry application</Text>
                  <Text style={styles.answerText}>{currentItem.ministryApplication}</Text>
                </View>

                {!!currentItem.contrastNotes && (
                  <View>
                    <Text style={styles.answerLabel}>Contrast notes</Text>
                    <Text style={styles.answerText}>{currentItem.contrastNotes}</Text>
                  </View>
                )}
              </View>

              <Text style={styles.confidenceTitle}>Confidence (1–5)</Text>
              <View style={styles.confidenceRow}>
                {[1, 2, 3, 4, 5].map((n) => {
                  const selected = confidence1to5 === n;
                  return (
                    <TouchableOpacity
                      key={n}
                      style={[
                        styles.confidenceChip,
                        selected && styles.confidenceChipSelected,
                      ]}
                      onPress={() => setConfidence1to5(n)}
                      disabled={saving}
                    >
                      <Text style={styles.confidenceChipText}>{n}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.ratingContainer}>
                {ratingOptions.map((option) => {
                  const disabled = saving || confidence1to5 === null;
                  return (
                    <TouchableOpacity
                      key={option.quality}
                      style={[
                        styles.ratingButton,
                        {
                          backgroundColor: option.color + '20',
                          opacity: disabled ? 0.5 : 1,
                        },
                      ]}
                      onPress={() => handleGrade(option.quality)}
                      disabled={disabled}
                    >
                      <Ionicons name={option.icon} size={24} color={option.color} />
                      <Text style={[styles.ratingText, { color: option.color }]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          ) : (
            <TouchableOpacity
              style={styles.showButton}
              onPress={() => setShowAnswer(true)}
              disabled={saving}
            >
              <Text style={styles.showButtonText}>Show Answer</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}
