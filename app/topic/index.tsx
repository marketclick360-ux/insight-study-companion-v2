import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Alert, SectionList, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { v4 as uuidv4 } from 'uuid';
import { eq, asc } from 'drizzle-orm';

import { useTheme } from '../../context/ThemeContext';
import { db } from '../../src/db/client';
import { topics } from '../../src/db/schema';
import { validateJwUrl } from '../../src/engine/validateJwUrl';
import { computeCoverageForLetter } from '../../src/engine/mastery';

type TopicRow = {
  id: string;
  name: string;
  letter: string;
  jwUrl: string;
  status: string;
  masteryScore: number;
  isArchived: number;
};

type Section = {
  title: string;
  data: TopicRow[];
  coverage: { total: number; studied: number; pct: number };
};

export default function TopicRegistryScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<Section[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [filterLetter, setFilterLetter] = useState<string | null>(null);

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const loadTopics = useCallback(async () => {
    try {
      const rows = await db
        .select()
        .from(topics)
        .where(eq(topics.isArchived, 0))
        .orderBy(asc(topics.name)) as TopicRow[];

      const byLetter = new Map<string, TopicRow[]>();
      for (const r of rows) {
        const l = r.letter.toUpperCase();
        if (!byLetter.has(l)) byLetter.set(l, []);
        byLetter.get(l)!.push(r);
      }

      const sects: Section[] = [];
      for (const letter of alphabet) {
        const items = byLetter.get(letter) || [];
        if (items.length === 0 && filterLetter && filterLetter !== letter) continue;
        if (filterLetter && filterLetter !== letter) continue;
        const coverage = computeCoverageForLetter(items);
        sects.push({ title: letter, data: items, coverage });
      }

      setSections(sects);
    } catch (e: any) {
      Alert.alert('Load failed', e?.message);
    } finally {
      setLoading(false);
    }
  }, [filterLetter]);

  useEffect(() => { loadTopics(); }, [loadTopics]);

  const handleAddTopic = useCallback(async () => {
    const trimName = newName.trim();
    if (!trimName) { Alert.alert('Name required'); return; }
    if (!newUrl.trim()) { Alert.alert('jw.org URL required'); return; }

    const urlCheck = validateJwUrl(newUrl.trim());
    if (!urlCheck.valid) { Alert.alert('Invalid URL', urlCheck.error); return; }

    setSaving(true);
    try {
      const now = Date.now();
      const letter = trimName.charAt(0).toUpperCase();
      await db.insert(topics).values({
        id: uuidv4(),
        name: trimName,
        letter,
        jwUrl: newUrl.trim(),
        status: 'not_studied',
        masteryScore: 0,
        createdAt: now,
        updatedAt: now,
        isArchived: 0,
      });
      setNewName('');
      setNewUrl('');
      setShowAddModal(false);
      loadTopics();
    } catch (e: any) {
      Alert.alert('Save failed', e?.message);
    } finally {
      setSaving(false);
    }
  }, [newName, newUrl, loadTopics]);

  const statusColor = (status: string) => {
    switch (status) {
      case 'mastered': return '#10B981';
      case 'in_review': return '#3B82F6';
      case 'studied_once': return '#F59E0B';
      default: return colors.textSecondary;
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { padding: 20, paddingTop: 10 },
    title: { fontSize: 28, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
    subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 12 },
    letterBar: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 8 },
    letterChip: {
      width: 32, height: 32, borderRadius: 8,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    },
    letterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    letterChipText: { fontSize: 12, fontWeight: '700', color: colors.text },
    letterChipTextActive: { color: '#fff' },
    addBtn: {
      backgroundColor: colors.primary, borderRadius: 12,
      padding: 14, alignItems: 'center', marginHorizontal: 20, marginBottom: 12,
    },
    addBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    sectionHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 20, paddingVertical: 10,
      backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    sectionLetter: { fontSize: 20, fontWeight: '700', color: colors.primary },
    sectionCoverage: { fontSize: 12, color: colors.textSecondary },
    topicRow: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.surface, marginHorizontal: 16, marginVertical: 4,
      padding: 14, borderRadius: 12,
    },
    topicInfo: { flex: 1 },
    topicName: { fontSize: 16, fontWeight: '500', color: colors.text },
    topicStatus: { fontSize: 12, marginTop: 2 },
    masteryBadge: {
      backgroundColor: colors.primaryLight, paddingHorizontal: 10,
      paddingVertical: 4, borderRadius: 12, marginRight: 8,
    },
    masteryText: { fontSize: 12, fontWeight: '700', color: colors.primary },
    emptySection: { padding: 20, alignItems: 'center' },
    emptySectionText: { color: colors.textSecondary, fontSize: 14 },
    modalOverlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.surface, borderTopLeftRadius: 24,
      borderTopRightRadius: 24, padding: 24, paddingBottom: 40,
    },
    modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 20 },
    input: {
      backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
      borderRadius: 12, padding: 14, fontSize: 16, color: colors.text, marginBottom: 14,
    },
    modalBtnRow: { flexDirection: 'row', gap: 12 },
    cancelBtn: {
      flex: 1, padding: 14, borderRadius: 12,
      borderWidth: 1, borderColor: colors.border, alignItems: 'center',
    },
    cancelBtnText: { color: colors.text, fontSize: 16, fontWeight: '600' },
    saveBtn: {
      flex: 1, padding: 14, borderRadius: 12,
      backgroundColor: colors.primary, alignItems: 'center',
    },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  }), [colors]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}><Text style={styles.title}>Topics A-Z</Text></View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Topics A-Z</Text>
        <Text style={styles.subtitle}>Tap a letter to filter, tap a topic to view details</Text>
        <View style={styles.letterBar}>
          {alphabet.map((l) => {
            const active = filterLetter === l;
            return (
              <TouchableOpacity
                key={l}
                style={[styles.letterChip, active && styles.letterChipActive]}
                onPress={() => setFilterLetter(active ? null : l)}
              >
                <Text style={[styles.letterChipText, active && styles.letterChipTextActive]}>{l}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
        <Text style={styles.addBtnText}>+ Add Topic</Text>
      </TouchableOpacity>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLetter}>{section.title}</Text>
            <Text style={styles.sectionCoverage}>
              {section.coverage.studied}/{section.coverage.total} studied ({section.coverage.pct}%)
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.topicRow}
            onPress={() => router.push(`/topic/${item.id}`)}
          >
            <View style={styles.topicInfo}>
              <Text style={styles.topicName}>{item.name}</Text>
              <Text style={[styles.topicStatus, { color: statusColor(item.status) }]}>
                {item.status.replace('_', ' ')}
              </Text>
            </View>
            <View style={styles.masteryBadge}>
              <Text style={styles.masteryText}>{item.masteryScore}%</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
        renderSectionFooter={({ section }) =>
          section.data.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>No topics for {section.title}</Text>
            </View>
          ) : null
        }
        stickySectionHeadersEnabled
      />

      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Topic</Text>
            <TextInput
              style={styles.input}
              placeholder="Topic name (e.g. Abrahamic Covenant)"
              placeholderTextColor={colors.textSecondary}
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
            <TextInput
              style={styles.input}
              placeholder="jw.org URL (https://www.jw.org/...)"
              placeholderTextColor={colors.textSecondary}
              value={newUrl}
              onChangeText={setNewUrl}
              keyboardType="url"
              autoCapitalize="none"
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddTopic} disabled={saving}>
                <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
