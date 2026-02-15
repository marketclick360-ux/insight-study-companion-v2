import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';

import { useTheme } from '../../../context/ThemeContext';
import { db } from '../../../src/db/client';
import { topics, studyEntries, reviews, activityLog } from '../../../src/db/schema';
import { createInitialSm2State } from '../../../src/engine/sm2';

type RecallQ = { id: string; q: string };

export default function StudySessionScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [summary, setSummary] = useState('');
  const [questions, setQuestions] = useState<RecallQ[]>([
    { id: uuidv4(), q: '' },
    { id: uuidv4(), q: '' },
  ]);
  const [ministryApp, setMinistryApp] = useState('');
  const [contrastNotes, setContrastNotes] = useState('');

  useEffect(() => {
    if (!id) return;
    (async () => {
      const rows = await db.select().from(topics).where(eq(topics.id, id));
      if (rows.length) setTopic(rows[0]);
      setLoading(false);
    })();
  }, [id]);

  const addQuestion = () => setQuestions((prev) => [...prev, { id: uuidv4(), q: '' }]);

  const updateQuestion = (qId: string, text: string) =>
    setQuestions((prev) => prev.map((q) => (q.id === qId ? { ...q, q: text } : q)));

  const removeQuestion = (qId: string) => {
    if (questions.length <= 2) { Alert.alert('Minimum 2 questions required'); return; }
    setQuestions((prev) => prev.filter((q) => q.id !== qId));
  };

  const handleSave = useCallback(async () => {
    if (!summary.trim()) { Alert.alert('Summary required', 'Write a summary of what you studied.'); return; }
    const validQs = questions.filter((q) => q.q.trim());
    if (validQs.length < 2) { Alert.alert('Questions required', 'Enter at least 2 recall questions.'); return; }
    if (!ministryApp.trim()) { Alert.alert('Ministry application required', 'How would you explain this in the ministry?'); return; }

    setSaving(true);
    try {
      const now = Date.now();
      const entryId = uuidv4();

      // Save study entry
      await db.insert(studyEntries).values({
        id: entryId,
        topicId: id!,
        summary: summary.trim(),
        recallQuestionsJson: JSON.stringify(validQs.map((q) => ({ id: q.id, q: q.q.trim() }))),
        ministryApplication: ministryApp.trim(),
        contrastNotes: contrastNotes.trim() || null,
        createdAt: now,
      });

      // Upsert review row (create if not exists)
      const existing = await db.select().from(reviews).where(eq(reviews.topicId, id!));
      if (!existing.length) {
        const initial = createInitialSm2State(now);
        await db.insert(reviews).values({
          id: uuidv4(),
          topicId: id!,
          easeFactor: initial.easeFactor,
          intervalDays: initial.intervalDays,
          repetitions: initial.repetitions,
          dueAt: now,
          lapses: initial.lapses,
          updatedAt: now,
        });
      }

      // Update topic status
      const currentTopic = (await db.select().from(topics).where(eq(topics.id, id!)))[0];
      const newStatus = currentTopic?.status === 'not_studied' ? 'studied_once' : currentTopic?.status;
      await db.update(topics).set({
        status: newStatus,
        nextDueAt: now,
        updatedAt: now,
      }).where(eq(topics.id, id!));

      // Activity log
      await db.insert(activityLog).values({
        id: uuidv4(),
        type: 'STUDY_ENTRY_CREATED',
        timestamp: now,
        topicId: id!,
        payloadJson: JSON.stringify({ entryId }),
      });

      Alert.alert('Saved!', 'Study entry recorded. This topic will now appear in your review queue.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Save failed', e?.message);
    } finally {
      setSaving(false);
    }
  }, [id, summary, questions, ministryApp, contrastNotes, router]);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { padding: 20, paddingTop: 10 },
    backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    backText: { fontSize: 16, color: colors.primary, marginLeft: 4 },
    title: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
    subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 8 },
    jwBtn: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryLight,
      borderRadius: 10, padding: 12, marginBottom: 12,
    },
    jwBtnText: { color: colors.primary, fontSize: 14, fontWeight: '600', marginLeft: 8 },
    formSection: { paddingHorizontal: 20, marginBottom: 20 },
    label: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 8 },
    required: { color: '#EF4444' },
    input: {
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
      borderRadius: 12, padding: 14, fontSize: 15, color: colors.text,
      minHeight: 80, textAlignVertical: 'top',
    },
    inputSmall: { minHeight: 44 },
    qRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    qInput: { flex: 1 },
    qRemoveBtn: { marginLeft: 8, padding: 4 },
    addQBtn: {
      flexDirection: 'row', alignItems: 'center', paddingVertical: 8,
    },
    addQText: { color: colors.primary, fontSize: 14, fontWeight: '600', marginLeft: 4 },
    saveBtn: {
      backgroundColor: colors.primary, borderRadius: 12,
      padding: 16, alignItems: 'center', marginHorizontal: 20, marginBottom: 40,
    },
    saveBtnDisabled: { opacity: 0.5 },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  }), [colors]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Study: {topic?.name}</Text>
          <Text style={styles.subtitle}>
            Read the jw.org article, then fill in your own study notes below.
          </Text>
          <TouchableOpacity
            style={styles.jwBtn}
            onPress={() => topic?.jwUrl && WebBrowser.openBrowserAsync(topic.jwUrl)}
          >
            <Ionicons name="open-outline" size={18} color={colors.primary} />
            <Text style={styles.jwBtnText}>Open article on jw.org</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Summary <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Write a concise summary of what you learned..."
            placeholderTextColor={colors.textSecondary}
            value={summary}
            onChangeText={setSummary}
            multiline
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>
            Recall Questions (min 2) <Text style={styles.required}>*</Text>
          </Text>
          {questions.map((q, i) => (
            <View key={q.id} style={styles.qRow}>
              <TextInput
                style={[styles.input, styles.inputSmall, styles.qInput]}
                placeholder={`Question ${i + 1}`}
                placeholderTextColor={colors.textSecondary}
                value={q.q}
                onChangeText={(t) => updateQuestion(q.id, t)}
              />
              {questions.length > 2 && (
                <TouchableOpacity style={styles.qRemoveBtn} onPress={() => removeQuestion(q.id)}>
                  <Ionicons name="close-circle" size={24} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity style={styles.addQBtn} onPress={addQuestion}>
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.addQText}>Add question</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>
            Ministry Application <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="How would you explain this topic to someone in the ministry?"
            placeholderTextColor={colors.textSecondary}
            value={ministryApp}
            onChangeText={setMinistryApp}
            multiline
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Contrast Notes (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="How does this differ from common misconceptions or other viewpoints?"
            placeholderTextColor={colors.textSecondary}
            value={contrastNotes}
            onChangeText={setContrastNotes}
            multiline
          />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Study Entry'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
