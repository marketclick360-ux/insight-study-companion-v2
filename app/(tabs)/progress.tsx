import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { ProgressChart } from '../../components/ProgressChart';

const { width } = Dimensions.get('window');

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  color: string;
  colors: any;
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
    width: (width - 48) / 2,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default function ProgressScreen() {
  const { colors } = useTheme();

  // Mock data - replace with actual data from database
  const stats = useMemo(() => ({
    totalStudied: 156,
    streak: 12,
    retention: 87,
    reviewsDue: 8,
    completedToday: 15,
    totalMinutes: 245,
  }), []);

  const weeklyData = useMemo(() => [
    { day: 'Mon', count: 12 },
    { day: 'Tue', count: 8 },
    { day: 'Wed', count: 15 },
    { day: 'Thu', count: 10 },
    { day: 'Fri', count: 20 },
    { day: 'Sat', count: 5 },
    { day: 'Sun', count: 18 },
  ], []);

  const maxCount = Math.max(...weeklyData.map(d => d.count));

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
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 16,
    },
    chartContainer: {
      marginHorizontal: 16,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
    },
    chartTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 20,
    },
    barsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      height: 120,
    },
    barWrapper: {
      alignItems: 'center',
      flex: 1,
    },
    bar: {
      width: 24,
      borderRadius: 12,
      marginBottom: 8,
    },
    dayLabel: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    streakCard: {
      margin: 16,
      backgroundColor: colors.primary,
      borderRadius: 16,
      padding: 20,
      flexDirection: 'row',
      alignItems: 'center',
    },
    streakIcon: {
      marginRight: 16,
    },
    streakContent: {
      flex: 1,
    },
    streakTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: 4,
    },
    streakText: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.8)',
    },
    retentionSection: {
      margin: 16,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
    },
    retentionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    retentionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    retentionValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.primary,
    },
    progressBar: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 4,
    },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Progress</Text>
        <Text style={styles.subtitle}>Track your mastery journey</Text>
      </View>

      <View style={styles.streakCard}>
        <Ionicons name="flame" size={40} color="#FFFFFF" style={styles.streakIcon} />
        <View style={styles.streakContent}>
          <Text style={styles.streakTitle}>{stats.streak} Day Streak!</Text>
          <Text style={styles.streakText}>Keep it up! Study today to maintain your streak.</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          icon="book"
          label="Items Studied"
          value={stats.totalStudied}
          color="#3B82F6"
          colors={colors}
        />
        <StatCard
          icon="checkmark-circle"
          label="Completed Today"
          value={stats.completedToday}
          color="#10B981"
          colors={colors}
        />
        <StatCard
          icon="time"
          label="Minutes Studied"
          value={stats.totalMinutes}
          color="#8B5CF6"
          colors={colors}
        />
        <StatCard
          icon="notifications"
          label="Reviews Due"
          value={stats.reviewsDue}
          color="#F59E0B"
          colors={colors}
        />
      </View>

      <View style={styles.retentionSection}>
        <View style={styles.retentionHeader}>
          <Text style={styles.retentionTitle}>Retention Rate</Text>
          <Text style={styles.retentionValue}>{stats.retention}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${stats.retention}%` }]} />
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
                    height: (item.count / maxCount) * 100,
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
