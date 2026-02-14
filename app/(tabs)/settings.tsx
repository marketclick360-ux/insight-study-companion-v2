import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface SettingItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  colors: any;
}

const SettingItem = ({
  icon,
  title,
  subtitle,
  onPress,
  rightElement,
  colors,
}: SettingItemProps) => (
  <TouchableOpacity
    style={[itemStyles.container, { backgroundColor: colors.surface }]}
    onPress={onPress}
    disabled={!onPress && !rightElement}
  >
    <View style={[itemStyles.iconContainer, { backgroundColor: colors.primaryLight }]}>
      <Ionicons name={icon as any} size={20} color={colors.primary} />
    </View>
    <View style={itemStyles.content}>
      <Text style={[itemStyles.title, { color: colors.text }]}>{title}</Text>
      {subtitle && (
        <Text style={[itemStyles.subtitle, { color: colors.textSecondary }]}>
          {subtitle}
        </Text>
      )}
    </View>
    {rightElement || (
      onPress && <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    )}
  </TouchableOpacity>
);

const itemStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
});

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const [notifications, setNotifications] = React.useState(true);
  const [dailyReminder, setDailyReminder] = React.useState(true);

  const handleResetProgress = () => {
    Alert.alert(
      'Reset Progress',
      'Are you sure you want to reset all your study progress? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            // Reset progress logic
            Alert.alert('Progress Reset', 'Your progress has been reset.');
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert('Export Data', 'Your study data will be exported as a JSON file.');
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
    section: {
      marginBottom: 24,
      paddingHorizontal: 16,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 12,
      marginLeft: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    dangerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#EF4444',
      marginTop: 8,
    },
    dangerButtonText: {
      color: '#EF4444',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    versionText: {
      textAlign: 'center',
      color: colors.textSecondary,
      fontSize: 14,
      marginTop: 24,
      marginBottom: 40,
    },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <SettingItem
          icon="moon"
          title="Dark Mode"
          subtitle={isDark ? 'On' : 'Off'}
          colors={colors}
          rightElement={
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          }
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <SettingItem
          icon="notifications"
          title="Push Notifications"
          subtitle="Receive review reminders"
          colors={colors}
          rightElement={
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          }
        />
        <SettingItem
          icon="alarm"
          title="Daily Reminder"
          subtitle="9:00 AM"
          colors={colors}
          rightElement={
            <Switch
              value={dailyReminder}
              onValueChange={setDailyReminder}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          }
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Study Preferences</Text>
        <SettingItem
          icon="timer"
          title="Session Length"
          subtitle="25 minutes"
          colors={colors}
          onPress={() => {}}
        />
        <SettingItem
          icon="calendar"
          title="Review Schedule"
          subtitle="SM-2 Algorithm"
          colors={colors}
          onPress={() => {}}
        />
        <SettingItem
          icon="layers"
          title="Cards Per Session"
          subtitle="20 cards"
          colors={colors}
          onPress={() => {}}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data</Text>
        <SettingItem
          icon="cloud-download"
          title="Export Data"
          subtitle="Download your study data"
          colors={colors}
          onPress={handleExportData}
        />
        <TouchableOpacity style={styles.dangerButton} onPress={handleResetProgress}>
          <Ionicons name="trash" size={20} color="#EF4444" />
          <Text style={styles.dangerButtonText}>Reset All Progress</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <SettingItem
          icon="information-circle"
          title="About"
          subtitle="Version 2.0.0"
          colors={colors}
          onPress={() => {}}
        />
        <SettingItem
          icon="document-text"
          title="Terms of Service"
          colors={colors}
          onPress={() => {}}
        />
        <SettingItem
          icon="shield-checkmark"
          title="Privacy Policy"
          colors={colors}
          onPress={() => {}}
        />
      </View>

      <Text style={styles.versionText}>
        Insight Study Companion v2.0.0
      </Text>
    </ScrollView>
  );
}
