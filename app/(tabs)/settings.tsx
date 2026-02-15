import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { db } from '../../src/db/client';
import { topics, studyEntries, reviews, activityLog } from '../../src/db/schema';
import { eq } from 'drizzle-orm';

interface SettingItemProps {
  icon: string; title: string; subtitle?: string;
  onPress?: () => void; rightElement?: React.ReactNode; colors: any;
}

const SettingItem = ({ icon, title, subtitle, onPress, rightElement, colors }: SettingItemProps) => (
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
      {subtitle && <Text style={[itemStyles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
    </View>
    {rightElement || (onPress && <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />)}
  </TouchableOpacity>
);

const itemStyles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, borderRadius: 12, marginBottom: 8,
  },
  iconContainer: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  content: { flex: 1 },
  title: { fontSize: 16, fontWeight: '500' },
  subtitle: { fontSize: 14, marginTop: 2 },
});

const EXPORT_VERSION = 1;

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const [notifications, setNotifications] = React.useState(true);
  const [dailyReminder, setDailyReminder] = React.useState(true);

  const handleExportData = async () => {
    try {
      const allTopics = await db.select().from(topics);
      const allEntries = await db.select().from(studyEntries);
      const allReviews = await db.select().from(reviews);
      const allLogs = await db.select().from(activityLog);

      const exportData = {
        version: EXPORT_VERSION,
        exportedAt: Date.now(),
        topics: allTopics,
        studyEntries: allEntries,
        reviews: allReviews,
        activityLog: allLogs,
      };

      const json = JSON.stringify(exportData, null, 2);
      const fileName = `insight-study-export-${new Date().toISOString().slice(0, 10)}.json`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, json, { encoding: FileSystem.EncodingType.UTF8 });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, { mimeType: 'application/json', dialogTitle: 'Export Study Data' });
      } else {
        Alert.alert('Export saved', `File saved to: ${filePath}`);
      }
    } catch (e: any) {
      Alert.alert('Export failed', e?.message);
    }
  };

  const handleImportData = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (result.canceled) return;

      const file = result.assets[0];
      const content = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.UTF8 });
      const data = JSON.parse(content);

      if (!data.version || !data.topics) {
        Alert.alert('Invalid file', 'This does not appear to be a valid export file.');
        return;
      }

      Alert.alert(
        'Import Data',
        `This will merge ${data.topics?.length ?? 0} topics, ${data.studyEntries?.length ?? 0} entries, and ${data.reviews?.length ?? 0} reviews into your local database. Existing data with matching IDs will be skipped.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Import',
            onPress: async () => {
              let imported = 0;
              for (const t of data.topics || []) {
                try { await db.insert(topics).values(t); imported++; } catch { /* skip duplicate */ }
              }
              for (const e of data.studyEntries || []) {
                try { await db.insert(studyEntries).values(e); } catch {}
              }
              for (const r of data.reviews || []) {
                try { await db.insert(reviews).values(r); } catch {}
              }
              for (const l of data.activityLog || []) {
                try { await db.insert(activityLog).values(l); } catch {}
              }
              Alert.alert('Import complete', `Merged ${imported} new topics.`);
            },
          },
        ]
      );
    } catch (e: any) {
      Alert.alert('Import failed', e?.message);
    }
  };

  const handleResetProgress = () => {
    Alert.alert(
      'Reset Progress',
      'This will delete ALL topics, study entries, reviews, and activity logs. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset', style: 'destructive',
          onPress: async () => {
            try {
              await db.delete(activityLog);
              await db.delete(reviews);
              await db.delete(studyEntries);
              await db.delete(topics);
              Alert.alert('Reset complete', 'All data has been cleared.');
            } catch (e: any) {
              Alert.alert('Reset failed', e?.message);
            }
          },
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { padding: 20, paddingTop: 10 },
    title: { fontSize: 28, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
    section: { marginBottom: 24, paddingHorizontal: 16 },
    sectionTitle: {
      fontSize: 14, fontWeight: '600', color: colors.textSecondary,
      marginBottom: 12, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5,
    },
    dangerButton: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#EF4444', marginTop: 8,
    },
    dangerButtonText: { color: '#EF4444', fontSize: 16, fontWeight: '600', marginLeft: 8 },
    versionText: {
      textAlign: 'center', color: colors.textSecondary, fontSize: 14,
      marginTop: 24, marginBottom: 40,
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
          icon="moon" title="Dark Mode" subtitle={isDark ? 'On' : 'Off'}
          rightElement={<Switch value={isDark} onValueChange={toggleTheme} />}
          colors={colors}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <SettingItem
          icon="notifications" title="Push Notifications"
          rightElement={<Switch value={notifications} onValueChange={setNotifications} />}
          colors={colors}
        />
        <SettingItem
          icon="alarm" title="Daily Reminder"
          rightElement={<Switch value={dailyReminder} onValueChange={setDailyReminder} />}
          colors={colors}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data</Text>
        <SettingItem
          icon="download-outline" title="Export Data"
          subtitle="Save all data as JSON file"
          onPress={handleExportData} colors={colors}
        />
        <SettingItem
          icon="cloud-upload-outline" title="Import Data"
          subtitle="Restore from a JSON export"
          onPress={handleImportData} colors={colors}
        />
        <TouchableOpacity style={styles.dangerButton} onPress={handleResetProgress}>
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
          <Text style={styles.dangerButtonText}>Reset All Progress</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <SettingItem icon="information-circle" title="Version" subtitle="2.0.0" colors={colors} />
        <SettingItem icon="shield-checkmark" title="Privacy"
          subtitle="No jw.org content stored" colors={colors} />
      </View>

      <Text style={styles.versionText}>Insight Study Companion v2.0.0</Text>
    </ScrollView>
  );
}
