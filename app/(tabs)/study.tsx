import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useSessionStore } from '../../src/store/sessionStore';
import { StudyCard } from '../../components/StudyCard';
import { EmptyState } from '../../components/EmptyState';

export default function StudyScreen() {
  const { colors } = useTheme();
  const { currentSession, startSession } = useSessionStore();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [
    { id: 'bible', label: 'Bible Reading', icon: 'book' as const },
    { id: 'watchtower', label: 'Watchtower', icon: 'newspaper' as const },
    { id: 'meeting', label: 'Meeting Prep', icon: 'people' as const },
    { id: 'ministry', label: 'Ministry', icon: 'megaphone' as const },
  ];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Refresh study materials
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleStartSession = (categoryId: string) => {
    startSession({
      type: 'study',
      categoryId,
      startedAt: new Date().toISOString(),
    });
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
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    categoriesContainer: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    categoryCard: {
      width: '48%',
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    categoryCardSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
    },
    categoryIcon: {
      marginBottom: 12,
    },
    categoryLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
    },
    sessionCard: {
      margin: 16,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
    },
    sessionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    sessionInfo: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 16,
    },
    startButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
    },
    startButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
  });

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Study Session</Text>
        <Text style={styles.subtitle}>
          Choose a category to begin your study
        </Text>
      </View>

      <View style={styles.categoriesContainer}>
        <View style={styles.categoryGrid}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryCard,
                selectedCategory === category.id && styles.categoryCardSelected,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Ionicons
                name={category.icon}
                size={32}
                color={selectedCategory === category.id ? colors.primary : colors.textSecondary}
                style={styles.categoryIcon}
              />
              <Text style={styles.categoryLabel}>{category.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {selectedCategory && (
        <View style={styles.sessionCard}>
          <Text style={styles.sessionTitle}>
            Ready to Study: {categories.find(c => c.id === selectedCategory)?.label}
          </Text>
          <Text style={styles.sessionInfo}>
            Your progress will be tracked and reviewed using spaced repetition.
          </Text>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => handleStartSession(selectedCategory)}
          >
            <Text style={styles.startButtonText}>Start Study Session</Text>
          </TouchableOpacity>
        </View>
      )}

      {!selectedCategory && (
        <EmptyState
          icon="book-outline"
          title="Select a Category"
          message="Choose a study category above to begin your session"
        />
      )}
    </ScrollView>
  );
}
