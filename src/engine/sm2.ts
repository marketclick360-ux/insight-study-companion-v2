// SM-2 Spaced Repetition Algorithm
// Ease factor minimum clamped to 1.3 per standard SM-2

export type Sm2State = {
  easeFactor: number;
  repetitions: number;
  intervalDays: number;
  dueAt: number;
  lapses: number;
};

export type Quality = 0 | 1 | 2 | 3 | 4 | 5;

// Maps UI buttons to SM-2 quality scores
export const QUALITY_MAP = {
  again: 1 as Quality,
  hard: 3 as Quality,
  good: 4 as Quality,
  easy: 5 as Quality,
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function sm2Update(
  state: Sm2State,
  q: Quality,
  nowMs: number
): Sm2State {
  // Update ease factor: EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
  let ef = state.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  ef = Math.max(1.3, ef); // Clamp minimum

  let reps = state.repetitions;
  let interval = state.intervalDays;
  let lapses = state.lapses;

  if (q < 3) {
    // Failed recall: reset
    reps = 0;
    interval = 1;
    lapses += 1;
  } else {
    // Successful recall
    reps += 1;
    if (reps === 1) interval = 1;
    else if (reps === 2) interval = 6;
    else interval = Math.round(interval * ef);
  }

  const dueAt = nowMs + interval * DAY_MS;

  return {
    easeFactor: Math.round(ef * 100) / 100,
    repetitions: reps,
    intervalDays: interval,
    dueAt,
    lapses,
  };
}

export function createInitialSm2State(nowMs: number): Sm2State {
  return {
    easeFactor: 2.5,
    repetitions: 0,
    intervalDays: 0,
    dueAt: nowMs,
    lapses: 0,
  };
}
