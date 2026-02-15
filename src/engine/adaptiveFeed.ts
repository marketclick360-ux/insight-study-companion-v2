// Adaptive Feed Engine
// Streak-based daily training intensity with soft reset on missed days
// Option C: missed day keeps streak but reduces daily limit

import { type Topic, type Review } from '../db/schema';

const DAY_MS = 24 * 60 * 60 * 1000;

// ── Types ────────────────────────────────────────────────────────────

export type FeedMode = 'review' | 'strengthen' | 'new';

export type FeedCard = {
  topicId: string;
  topicName: string;
  mode: FeedMode;
  priority: number;
  badge: string;
  encouragement: string;
  masteryScore: number;
};

export type IntensityLevel = {
  dailyLimit: number;
  label: string;
  description: string;
};

export type FeedResult = {
  cards: FeedCard[];
  intensity: IntensityLevel;
  streak: number;
  missedYesterday: boolean;
  feedExhausted: boolean;
};

// ── Intensity table ──────────────────────────────────────────────────

function getIntensity(streak: number, missedYesterday: boolean): IntensityLevel {
  // Option C: missed day keeps streak but reduces daily limit by 2
  const penalty = missedYesterday ? 2 : 0;

  let base: IntensityLevel;
  if (streak === 0) {
    base = { dailyLimit: 3, label: 'Warm-up', description: 'Ease in with a few reviews' };
  } else if (streak <= 3) {
    base = { dailyLimit: 5, label: 'Building', description: 'Review + Strengthen' };
  } else if (streak <= 7) {
    base = { dailyLimit: 7, label: 'Balanced', description: 'Full training mix' };
  } else if (streak <= 14) {
    base = { dailyLimit: 9, label: 'Strong', description: 'Add new meditations' };
  } else {
    base = { dailyLimit: 12, label: 'Advanced', description: 'Deep comprehensive training' };
  }

  return {
    ...base,
    dailyLimit: Math.max(2, base.dailyLimit - penalty),
  };
}

// ── Streak calculator ────────────────────────────────────────────────

export function computeStreak(activityTimestamps: number[], now?: number): {
  streak: number;
  missedYesterday: boolean;
} {
  const currentTime = now ?? Date.now();
  const today = new Date(currentTime).toISOString().slice(0, 10);
  const yesterday = new Date(currentTime - DAY_MS).toISOString().slice(0, 10);

  const daySet = new Set(
    activityTimestamps.map((ts) => new Date(ts).toISOString().slice(0, 10))
  );

  // Check if yesterday was missed
  const missedYesterday = !daySet.has(yesterday) && !daySet.has(today);

  // Count consecutive days backwards from today (or yesterday if today has no activity)
  let streak = 0;
  const startDate = new Date(currentTime);
  for (let i = 0; i < 365; i++) {
    const d = new Date(startDate.getTime() - i * DAY_MS);
    const key = d.toISOString().slice(0, 10);
    if (daySet.has(key)) {
      streak++;
    } else if (i === 0) {
      // Today hasn't been completed yet, skip but don't break
      continue;
    } else {
      break;
    }
  }

  return { streak, missedYesterday };
}

// ── Badge & encouragement text ───────────────────────────────────────

function getBadge(mode: FeedMode): string {
  switch (mode) {
    case 'review': return 'Due for Review';
    case 'strengthen': return 'Strengthen Understanding';
    case 'new': return 'New Meditation';
  }
}

function getEncouragement(mode: FeedMode): string {
  switch (mode) {
    case 'review': return 'Explain this clearly.';
    case 'strengthen': return 'Deepen your grasp.';
    case 'new': return 'Begin meditation.';
  }
}

// ── Main adaptive feed generator ─────────────────────────────────────

export type AdaptiveFeedInput = {
  topics: Array<{
    id: string;
    name: string;
    status: string;
    masteryScore: number;
    nextDueAt: number | null;
    isArchived: number;
  }>;
  reviews: Array<{
    topicId: string;
    dueAt: number;
    repetitions: number;
    lastScore: number | null;
    confidenceRating: number | null;
  }>;
  activityTimestamps: number[];
  now?: number;
};

export function getDailyFeed(params: AdaptiveFeedInput): FeedResult {
  const now = params.now ?? Date.now();
  const { streak, missedYesterday } = computeStreak(params.activityTimestamps, now);
  const intensity = getIntensity(streak, missedYesterday);

  const feed: FeedCard[] = [];
  const usedIds = new Set<string>();

  // Build review map for quick lookup
  const reviewMap = new Map<string, (typeof params.reviews)[0]>();
  for (const r of params.reviews) {
    reviewMap.set(r.topicId, r);
  }

  // Active non-archived topics only
  const active = params.topics.filter((t) => t.isArchived === 0);

  // ── Priority 1: Overdue reviews ─────────────────────────────────
  const overdue = active
    .filter((t) => {
      const rev = reviewMap.get(t.id);
      return rev && rev.dueAt <= now;
    })
    .sort((a, b) => {
      const ra = reviewMap.get(a.id)!;
      const rb = reviewMap.get(b.id)!;
      return ra.dueAt - rb.dueAt; // oldest due first
    });

  for (const t of overdue) {
    if (feed.length >= intensity.dailyLimit) break;
    if (usedIds.has(t.id)) continue;
    usedIds.add(t.id);
    feed.push({
      topicId: t.id,
      topicName: t.name,
      mode: 'review',
      priority: 3,
      badge: getBadge('review'),
      encouragement: getEncouragement('review'),
      masteryScore: t.masteryScore,
    });
  }

  // ── Priority 2: Weak topics (mastery < 50, not already overdue) ─
  const weak = active
    .filter((t) => t.masteryScore < 50 && t.status !== 'not_studied' && !usedIds.has(t.id))
    .sort((a, b) => a.masteryScore - b.masteryScore); // weakest first

  for (const t of weak) {
    if (feed.length >= intensity.dailyLimit) break;
    if (usedIds.has(t.id)) continue;
    usedIds.add(t.id);
    feed.push({
      topicId: t.id,
      topicName: t.name,
      mode: 'strengthen',
      priority: 2,
      badge: getBadge('strengthen'),
      encouragement: getEncouragement('strengthen'),
      masteryScore: t.masteryScore,
    });
  }

  // ── Priority 3: New (not_studied) topics ────────────────────────
  const newTopics = active
    .filter((t) => t.status === 'not_studied' && !usedIds.has(t.id))
    .sort((a, b) => a.name.localeCompare(b.name)); // alphabetical

  for (const t of newTopics) {
    if (feed.length >= intensity.dailyLimit) break;
    if (usedIds.has(t.id)) continue;
    usedIds.add(t.id);
    feed.push({
      topicId: t.id,
      topicName: t.name,
      mode: 'new',
      priority: 1,
      badge: getBadge('new'),
      encouragement: getEncouragement('new'),
      masteryScore: t.masteryScore,
    });
  }

  return {
    cards: feed.slice(0, intensity.dailyLimit),
    intensity,
    streak,
    missedYesterday,
    feedExhausted: feed.length === 0,
  };
}

// ── Completion message ───────────────────────────────────────────────

export function getCompletionMessage(streak: number): {
  title: string;
  message: string;
  scripture: string;
} {
  if (streak >= 15) {
    return {
      title: 'Exceptional Discipline',
      message: `${streak}-day streak! Your depth of understanding grows.`,
      scripture: '"Make your advancement manifest." \u2014 1 Tim. 4:15',
    };
  }
  if (streak >= 8) {
    return {
      title: 'Strong Consistency',
      message: `${streak} days running. You\'re building real mastery.`,
      scripture: '"Buy out the opportune time." \u2014 Eph. 5:16',
    };
  }
  if (streak >= 4) {
    return {
      title: 'Gaining Momentum',
      message: `${streak}-day streak! Keep pressing forward.`,
      scripture: '"Let us not give up." \u2014 Gal. 6:9',
    };
  }
  if (streak >= 1) {
    return {
      title: 'Building the Habit',
      message: `${streak} day${streak > 1 ? 's' : ''} in. Come back tomorrow.`,
      scripture: '"The plans of the diligent surely lead to success." \u2014 Prov. 21:5',
    };
  }
  return {
    title: 'Today\'s Training Complete',
    message: 'Great start. Return tomorrow to begin your streak.',
    scripture: '"Make your advancement manifest." \u2014 1 Tim. 4:15',
  };
}

// ── Missed-day soft message ──────────────────────────────────────────

export function getMissedDayMessage(): {
  title: string;
  message: string;
} {
  return {
    title: 'Welcome Back',
    message: 'Missed yesterday? No worries \u2014 your streak is preserved, but today\'s load is lighter to help you ease back in.',
  };
}
