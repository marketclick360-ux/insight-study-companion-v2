import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

type Props = {
  streak: number;
  dailyLimit: number;
  completedToday: number;
  missedYesterday: boolean;
};

export function FeedBadge({ streak, dailyLimit, completedToday, missedYesterday }: Props) {
  const { colors } = useTheme();

  const streakColor =
    streak >= 14 ? '#10B981' : streak >= 7 ? '#3B82F6' : streak >= 3 ? '#F59E0B' : colors.textSecondary;

  const streakIcon =
    streak >= 14 ? 'flame' : streak >= 7 ? 'flash' : streak >= 3 ? 'trending-up' : 'time-outline';

  const intensityLabel =
    dailyLimit >= 10 ? 'Deep' : dailyLimit >= 7 ? 'Steady' : dailyLimit >= 5 ? 'Warm-up' : 'Light';

  const s = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginHorizontal: 16,
      marginBottom: 8,
    },
    left: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    streakText: {
      fontSize: 15,
      fontWeight: '700',
      color: streakColor,
    },
    dayLabel: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    center: { alignItems: 'center' },
    intensityLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
    },
    progressText: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
    },
    right: { alignItems: 'flex-end' },
    missedText: {
      fontSize: 11,
      color: '#F59E0B',
      fontWeight: '500',
    },
  });

  return (
    <View style={s.container}>
      <View style={s.left}>
        <Ionicons name={streakIcon as any} size={20} color={streakColor} />
        <View>
          <Text style={s.streakText}>
            {streak} day{streak !== 1 ? 's' : ''}
          </Text>
          <Text style={s.dayLabel}>Streak</Text>
        </View>
      </View>

      <View style={s.center}>
        <Text style={s.intensityLabel}>{intensityLabel}</Text>
        <Text style={s.progressText}>
          {completedToday} / {dailyLimit} today
        </Text>
      </View>

      <View style={s.right}>
        {missedYesterday ? (
          <Text style={s.missedText}>Soft reset</Text>
        ) : streak >= 3 ? (
          <Ionicons name="checkmark-circle" size={18} color="#10B981" />
        ) : null}
      </View>
    </View>
  );
}
