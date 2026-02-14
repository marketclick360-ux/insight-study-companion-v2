import { create } from 'zustand';

type SessionState = {
  reviewQueueIds: string[];
  reviewIndex: number;
  dbReady: boolean;
  setDbReady: (ready: boolean) => void;
  startReview: (ids: string[]) => void;
  next: () => void;
  reset: () => void;
  currentTopicId: string | null;
  setCurrentTopicId: (id: string | null) => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  reviewQueueIds: [],
  reviewIndex: 0,
  dbReady: false,
  currentTopicId: null,
  setDbReady: (ready) => set({ dbReady: ready }),
  startReview: (ids) => set({ reviewQueueIds: ids, reviewIndex: 0 }),
  next: () => set((s) => ({ reviewIndex: s.reviewIndex + 1 })),
  reset: () => set({ reviewQueueIds: [], reviewIndex: 0 }),
  setCurrentTopicId: (id) => set({ currentTopicId: id }),
}));
