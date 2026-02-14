// Mastery scoring: 0-100
// Components: recall accuracy, streak, ease, confidence, time freshness

type MasteryInput = {
  lastScore: number | null; // 0-5
  repetitions: number;
  easeFactor: number;
  confidenceRating: number | null; // 0-100
  daysSinceLastReview: number;
  hasStudyEntry: boolean;
};

const TAU = 10; // Time decay constant in days

export function computeMastery(input: MasteryInput): number {
  if (!input.hasStudyEntry) return 0;

  // R = recall accuracy (0-1)
  const R = input.lastScore !== null ? input.lastScore / 5 : 0;

  // S = streak factor (0-1)
  const S = Math.min(input.repetitions, 10) / 10;

  // E = ease factor normalized (0-1)
  const E = Math.max(0, Math.min(1, (input.easeFactor - 1.3) / (2.8 - 1.3)));

  // C = explanation confidence (0-1)
  const C = input.confidenceRating !== null ? input.confidenceRating / 100 : 0;

  // T = time freshness (0-1), exponential decay
  const T = Math.exp(-input.daysSinceLastReview / TAU);

  // Weighted sum
  const raw = 0.35 * R + 0.20 * C + 0.15 * S + 0.15 * E + 0.15 * T;

  return Math.round(Math.max(0, Math.min(100, raw * 100)));
}

export type TopicStatus = 'not_studied' | 'studied_once' | 'in_review' | 'mastered';

export function deriveStatus(
  hasStudyEntry: boolean,
  repetitions: number,
  masteryScore: number,
  overdueDays: number
): TopicStatus {
  if (!hasStudyEntry) return 'not_studied';
  if (repetitions === 0) return 'studied_once';
  if (masteryScore >= 85 && repetitions >= 8 && overdueDays <= 3) return 'mastered';
  return 'in_review';
}

export function computeCoverageForLetter(
  topics: { status: string }[]
): { total: number; studied: number; mastered: number; pct: number } {
  const total = topics.length;
  const studied = topics.filter((t) => t.status !== 'not_studied').length;
  const mastered = topics.filter((t) => t.status === 'mastered').length;
  return {
    total,
    studied,
    mastered,
    pct: total > 0 ? Math.round((studied / total) * 100) : 0,
  };
}
