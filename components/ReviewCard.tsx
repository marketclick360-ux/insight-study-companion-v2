import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface ReviewCardProps {
  question: string;
  category: string;
  dueDate: string;
  difficulty: number;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  question,
  category,
  dueDate,
  difficulty,
}) => {
  const { colors } = useTheme();

  const getDifficultyColor = (diff: number): string => {
    if (diff <= 2) return '#10B981';
    if (diff <= 3) return '#F59E0B';
    return '#EF4444';
  };

  const getDifficultyLabel = (diff: number): string => {
    if (diff <= 2) return 'Easy';
    if (diff <= 3) return 'Medium';
    return 'Hard';
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    categoryBadge: {
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    categoryText: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '600',
    },
    difficultyBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    difficultyText: {
      fontSize: 12,
      fontWeight: '600',
    },
    question: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      lineHeight: 24,
      marginBottom: 12,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    dueText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: 6,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{category}</Text>
        </View>
        <View
          style={[
            styles.difficultyBadge,
            { backgroundColor: getDifficultyColor(difficulty) + '20' },
          ]}
        >
          <Text style={[styles.difficultyText, { color: getDifficultyColor(difficulty) }]}>
            {getDifficultyLabel(difficulty)}
          </Text>
        </View>
      </View>
      <Text style={styles.question} numberOfLines={2}>
        {question}
      </Text>
      <View style={styles.footer}>
        <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.dueText}>Due: {new Date(dueDate).toLocaleDateString()}</Text>
      </View>
    </View>
  );
};
