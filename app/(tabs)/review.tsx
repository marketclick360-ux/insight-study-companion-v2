import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { ReviewCard } from '../../components/ReviewCard';
import { EmptyState } from '../../components/EmptyState';

interface ReviewItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  dueDate: string;
  difficulty: number;
}

export default function ReviewScreen() {
  const { colors } = useTheme();
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);

  // Mock data - replace with actual data from database
  useEffect(() => {
    const mockItems: ReviewItem[] = [
      {
        id: '1',
        question: 'What is the significance of the year 1914 in Bible prophecy?',
        answer: 'It marks the beginning of the last days and Christ\'s invisible presence as King.',
        category: 'Bible Study',
        dueDate: new Date().toISOString(),
        difficulty: 3,
      },
      {
        id: '2',
        question: 'Name the four living creatures mentioned in Revelation 4:7',
        answer: 'Lion, bull, man, and eagle',
        category: 'Bible Reading',
        dueDate: new Date().toISOString(),
        difficulty: 2,
      },
    ];
    setReviewItems(mockItems);
  }, []);

  const currentItem = reviewItems[currentIndex];

  const handleResponse = (quality: number) => {
    // SM-2 algorithm would update the item here
    setShowAnswer(false);
    if (currentIndex < reviewItems.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setSessionComplete(true);
    }
  };

  const resetSession = () => {
    setCurrentIndex(0);
    setShowAnswer(false);
    setSessionComplete(false);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: 20,
      paddingTop: 10,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    progressText: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    cardContainer: {
      flex: 1,
      padding: 16,
    },
    reviewCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 24,
      minHeight: 300,
      justifyContent: 'center',
    },
    categoryBadge: {
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      alignSelf: 'flex-start',
      marginBottom: 16,
    },
    categoryText: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '600',
    },
    questionText: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      lineHeight: 28,
    },
    answerContainer: {
      marginTop: 24,
      paddingTop: 24,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    answerLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    answerText: {
      fontSize: 18,
      color: colors.text,
      lineHeight: 26,
    },
    showButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      marginTop: 24,
    },
    showButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    ratingContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 24,
      gap: 8,
    },
    ratingButton: {
      flex: 1,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    ratingText: {
      fontSize: 12,
      fontWeight: '600',
      marginTop: 4,
    },
    completeContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    completeIcon: {
      marginBottom: 24,
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
  });

  const ratingOptions = [
    { quality: 1, label: 'Again', color: '#EF4444', icon: 'close-circle' },
    { quality: 3, label: 'Hard', color: '#F59E0B', icon: 'remove-circle' },
    { quality: 4, label: 'Good', color: '#10B981', icon: 'checkmark-circle' },
    { quality: 5, label: 'Easy', color: '#3B82F6', icon: 'star' },
  ];

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
          <Ionicons
            name="trophy"
            size={80}
            color={colors.primary}
            style={styles.completeIcon}
          />
          <Text style={styles.completeTitle}>Session Complete!</Text>
          <Text style={styles.completeText}>
            Great work! You reviewed {reviewItems.length} items. Your progress has been saved.
          </Text>
          <TouchableOpacity style={styles.restartButton} onPress={resetSession}>
            <Text style={styles.restartButtonText}>Review Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{currentItem.category}</Text>
          </View>
          <Text style={styles.questionText}>{currentItem.question}</Text>

          {showAnswer ? (
            <>
              <View style={styles.answerContainer}>
                <Text style={styles.answerLabel}>Answer:</Text>
                <Text style={styles.answerText}>{currentItem.answer}</Text>
              </View>
              <View style={styles.ratingContainer}>
                {ratingOptions.map((option) => (
                  <TouchableOpacity
                    key={option.quality}
                    style={[styles.ratingButton, { backgroundColor: option.color + '20' }]}
                    onPress={() => handleResponse(option.quality)}
                  >
                    <Ionicons name={option.icon as any} size={24} color={option.color} />
                    <Text style={[styles.ratingText, { color: option.color }]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : (
            <TouchableOpacity
              style={styles.showButton}
              onPress={() => setShowAnswer(true)}
            >
              <Text style={styles.showButtonText}>Show Answer</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}
