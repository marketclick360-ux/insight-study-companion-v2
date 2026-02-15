import React, { useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import type { Quality } from '../src/engine/sm2';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const SWIPE_OUT_DURATION = 250;

// ── Types ────────────────────────────────────────────────────────
export type CardItem = {
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
  dueAt: number;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
  lastScore: number | null;
  confidenceRating: number | null;
  reviewUpdatedAt: number;
  topicLastReviewedAt: number | null;
};

type Props = {
  items: CardItem[];
  currentIndex: number;
  showAnswer: boolean;
  confidence: number | null;
  saving: boolean;
  feedLabel: string;
  feedIcon: string;
  onReveal: () => void;
  onConfidence: (n: number) => void;
  onGrade: (q: Quality) => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
};

// ── Rating options ───────────────────────────────────────────────
const RATINGS: Array<{ quality: Quality; label: string; color: string; icon: string }> = [
  { quality: 1, label: 'Again', color: '#EF4444', icon: 'close-circle' },
  { quality: 3, label: 'Hard', color: '#F59E0B', icon: 'remove-circle' },
  { quality: 4, label: 'Good', color: '#10B981', icon: 'checkmark-circle' },
  { quality: 5, label: 'Easy', color: '#3B82F6', icon: 'star' },
];

export function ReviewCarousel({
  items,
  currentIndex,
  showAnswer,
  confidence,
  saving,
  feedLabel,
  feedIcon,
  onReveal,
  onConfidence,
  onGrade,
  onSwipeLeft,
  onSwipeRight,
}: Props) {
  const { colors } = useTheme();
  const pan = useRef(new Animated.ValueXY()).current;

  // Reset position when card changes
  useEffect(() => {
    pan.setValue({ x: 0, y: 0 });
  }, [currentIndex, pan]);

  const resetPosition = useCallback(() => {
    Animated.spring(pan, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
    }).start();
  }, [pan]);

  const forceSwipe = useCallback(
    (direction: 'left' | 'right') => {
      const x = direction === 'right' ? SCREEN_WIDTH + 100 : -SCREEN_WIDTH - 100;
      Animated.timing(pan, {
        toValue: { x, y: 0 },
        duration: SWIPE_OUT_DURATION,
        useNativeDriver: false,
      }).start(() => {
        pan.setValue({ x: 0, y: 0 });
        if (direction === 'right') onSwipeRight();
        else onSwipeLeft();
      });
    },
    [pan, onSwipeLeft, onSwipeRight]
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 10,
      onPanResponderMove: Animated.event([null, { dx: pan.x }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gs) => {
        if (gs.dx > SWIPE_THRESHOLD) forceSwipe('right');
        else if (gs.dx < -SWIPE_THRESHOLD) forceSwipe('left');
        else resetPosition();
      },
    })
  ).current;

  const item = items[currentIndex];
  if (!item) return null;

  const rotate = pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: ['-8deg', '0deg', '8deg'],
  });

  const cardStyle = {
    transform: [{ translateX: pan.x }, { rotate }],
  };

  const s = StyleSheet.create({
    wrapper: { flex: 1, padding: 16 },
    feedRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: 12,
      gap: 6,
    },
    feedLabel: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: colors.primary,
    },
    progressDots: {
      flexDirection: 'row' as const,
      justifyContent: 'center' as const,
      gap: 6,
      marginBottom: 12,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 24,
      minHeight: 340,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
    },
    badge: {
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      alignSelf: 'flex-start' as const,
      marginBottom: 16,
    },
    badgeText: { color: colors.primary, fontSize: 12, fontWeight: '600' as const },
    metaRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      marginBottom: 10,
    },
    metaText: { color: colors.textSecondary, fontSize: 12 },
    questionText: {
      fontSize: 20,
      fontWeight: '600' as const,
      color: colors.text,
      lineHeight: 28,
    },
    answerWrap: {
      marginTop: 18,
      paddingTop: 18,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 12,
    },
    answerLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
    answerText: { fontSize: 16, color: colors.text, lineHeight: 24 },
    showBtn: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center' as const,
      marginTop: 24,
    },
    showBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' as const },
    confTitle: { marginTop: 18, fontSize: 14, fontWeight: '600' as const, color: colors.text },
    confRow: { flexDirection: 'row' as const, gap: 8, marginTop: 10 },
    confChip: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center' as const,
      borderWidth: 1,
      borderColor: colors.border,
    },
    confChipSel: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    confChipText: { fontWeight: '700' as const, color: colors.text },
    ratingRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      marginTop: 18,
      gap: 8,
    },
    ratingBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' as const },
    ratingLabel: { fontSize: 12, fontWeight: '600' as const, marginTop: 4 },
    swipeHint: {
      flexDirection: 'row' as const,
      justifyContent: 'center' as const,
      gap: 16,
      marginTop: 14,
    },
    swipeHintText: { fontSize: 11, color: colors.textSecondary },
  });

  return (
    <View style={s.wrapper}>
      {/* Feed mode label */}
      <View style={s.feedRow}>
        <Ionicons name={feedIcon as any} size={16} color={colors.primary} />
        <Text style={s.feedLabel}>{feedLabel}</Text>
      </View>

      {/* Progress dots (max 12 visible) */}
      <View style={s.progressDots}>
        {items.slice(0, 12).map((_, i) => (
          <View
            key={i}
            style={[
              s.dot,
              {
                backgroundColor:
                  i < currentIndex
                    ? colors.primary
                    : i === currentIndex
                    ? colors.text
                    : colors.border,
              },
            ]}
          />
        ))}
        {items.length > 12 && (
          <Text style={{ fontSize: 11, color: colors.textSecondary }}>+{items.length - 12}</Text>
        )}
      </View>

      {/* Swipeable card */}
      <Animated.View style={cardStyle} {...panResponder.panHandlers}>
        <View style={s.card}>
          <View style={s.badge}>
            <Text style={s.badgeText}>{item.topicName}</Text>
          </View>

          <View style={s.metaRow}>
            <Text style={s.metaText}>Mastery {Math.round(item.masteryScore)}/100</Text>
            <Text style={s.metaText}>
              Q {item.questionIndex} of {item.questionCount}
            </Text>
          </View>

          <Text style={s.questionText}>{item.question}</Text>

          {showAnswer ? (
            <>
              <View style={s.answerWrap}>
                <View>
                  <Text style={s.answerLabel}>Your summary</Text>
                  <Text style={s.answerText}>{item.summary}</Text>
                </View>
                <View>
                  <Text style={s.answerLabel}>Ministry application</Text>
                  <Text style={s.answerText}>{item.ministryApplication}</Text>
                </View>
                {!!item.contrastNotes && (
                  <View>
                    <Text style={s.answerLabel}>Contrast notes</Text>
                    <Text style={s.answerText}>{item.contrastNotes}</Text>
                  </View>
                )}
              </View>

              {/* Confidence 1-5 */}
              <Text style={s.confTitle}>Confidence (1\u20135)</Text>
              <View style={s.confRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <TouchableOpacity
                    key={n}
                    style={[s.confChip, confidence === n && s.confChipSel]}
                    onPress={() => onConfidence(n)}
                    disabled={saving}
                  >
                    <Text style={s.confChipText}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* SM-2 rating buttons */}
              <View style={s.ratingRow}>
                {RATINGS.map((opt) => {
                  const disabled = saving || confidence === null;
                  return (
                    <TouchableOpacity
                      key={opt.quality}
                      style={[s.ratingBtn, { backgroundColor: opt.color + '20', opacity: disabled ? 0.5 : 1 }]}
                      onPress={() => onGrade(opt.quality)}
                      disabled={disabled}
                    >
                      <Ionicons name={opt.icon as any} size={24} color={opt.color} />
                      <Text style={[s.ratingLabel, { color: opt.color }]}>{opt.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          ) : (
            <TouchableOpacity style={s.showBtn} onPress={onReveal} disabled={saving}>
              <Text style={s.showBtnText}>Show Answer</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* Swipe hints */}
      {!showAnswer && (
        <View style={s.swipeHint}>
          <Text style={s.swipeHintText}>\u2190 Skip</Text>
          <Text style={s.swipeHintText}>Reveal \u2192</Text>
        </View>
      )}
    </View>
  );
}
