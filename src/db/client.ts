import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

const DB_NAME = 'insight_companion.db';

export const expoDb = openDatabaseSync(DB_NAME);
export const db = drizzle(expoDb, { schema });

// SQL to create tables manually (used as fallback if Drizzle migrations unavailable)
export const CREATE_TABLES_SQL = [
  `CREATE TABLE IF NOT EXISTS topics (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL UNIQUE,
    letter TEXT NOT NULL,
    jw_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'not_studied',
    mastery_score INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    last_reviewed_at INTEGER,
    next_due_at INTEGER,
    is_archived INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS study_entries (
    id TEXT PRIMARY KEY NOT NULL,
    topic_id TEXT NOT NULL,
    summary TEXT NOT NULL,
    recall_questions_json TEXT NOT NULL,
    ministry_application TEXT NOT NULL,
    contrast_notes TEXT,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY NOT NULL,
    topic_id TEXT NOT NULL UNIQUE,
    ease_factor REAL NOT NULL DEFAULT 2.5,
    interval_days INTEGER NOT NULL DEFAULT 0,
    repetitions INTEGER NOT NULL DEFAULT 0,
    due_at INTEGER NOT NULL,
    last_score INTEGER,
    confidence_rating INTEGER,
    lapses INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS activity_log (
    id TEXT PRIMARY KEY NOT NULL,
    type TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    topic_id TEXT,
    payload_json TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS idx_topics_letter ON topics(letter)`,
  `CREATE INDEX IF NOT EXISTS idx_topics_status ON topics(status)`,
  `CREATE INDEX IF NOT EXISTS idx_reviews_due ON reviews(due_at)`,
  `CREATE INDEX IF NOT EXISTS idx_activity_ts ON activity_log(timestamp)`,
];

export function initializeDatabase() {
  for (const sql of CREATE_TABLES_SQL) {
    expoDb.execSync(sql);
  }
}
