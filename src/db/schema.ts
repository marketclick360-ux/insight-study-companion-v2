import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const topics = sqliteTable('topics', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  letter: text('letter').notNull(),
  jwUrl: text('jw_url').notNull(),
  status: text('status', {
    enum: ['not_studied', 'studied_once', 'in_review', 'mastered'],
  }).notNull().default('not_studied'),
  masteryScore: integer('mastery_score').notNull().default(0),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  lastReviewedAt: integer('last_reviewed_at'),
  nextDueAt: integer('next_due_at'),
  isArchived: integer('is_archived').notNull().default(0),
});

export const studyEntries = sqliteTable('study_entries', {
  id: text('id').primaryKey(),
  topicId: text('topic_id').notNull(),
  summary: text('summary').notNull(),
  recallQuestionsJson: text('recall_questions_json').notNull(),
  ministryApplication: text('ministry_application').notNull(),
  contrastNotes: text('contrast_notes'),
  createdAt: integer('created_at').notNull(),
});

export const reviews = sqliteTable('reviews', {
  id: text('id').primaryKey(),
  topicId: text('topic_id').notNull(),
  easeFactor: real('ease_factor').notNull().default(2.5),
  intervalDays: integer('interval_days').notNull().default(0),
  repetitions: integer('repetitions').notNull().default(0),
  dueAt: integer('due_at').notNull(),
  lastScore: integer('last_score'),
  confidenceRating: integer('confidence_rating'),
  lapses: integer('lapses').notNull().default(0),
  updatedAt: integer('updated_at').notNull(),
});

export const activityLog = sqliteTable('activity_log', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  timestamp: integer('timestamp').notNull(),
  topicId: text('topic_id'),
  payloadJson: text('payload_json'),
});

export type Topic = typeof topics.$inferSelect;
export type NewTopic = typeof topics.$inferInsert;
export type StudyEntry = typeof studyEntries.$inferSelect;
export type NewStudyEntry = typeof studyEntries.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
export type ActivityLogEntry = typeof activityLog.$inferSelect;
