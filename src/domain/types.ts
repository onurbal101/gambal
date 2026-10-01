export const DECKS = ["A", "B", "C", "D"] as const;
export type DeckId = (typeof DECKS)[number];
export type Language = "tr" | "en";
export type Theme = "light" | "dark";
export type Card = { gain: number; loss: number };
export type DeckSchedule = Record<DeckId, Card[]>;
export interface TaskDefinition {
  id: string;
  revision: number;
  title: Record<Language, string>;
  verification: "legacy-preserved" | "verified" | "unavailable";
  reason?: Record<Language, string>;
  sources: string[];
  decks: DeckSchedule;
  deckChecksum: string | null;
  procedure: {
    startingBalance: number;
    trialsPerStage: number;
    stages: number;
    exhaustion: "disable";
    resetBetweenStages: boolean;
    breakMs: number;
    feedbackMs?: number;
  };
  presentation: { id: string; feedbackMs: number };
  instructions: Record<Language, string>;
}
export interface Participant {
  code: string;
  name?: string;
  age?: number;
  sex?: string;
  education?: number;
  researcher?: string;
}
export interface Trial {
  id: string;
  sessionId: string;
  sequence: number;
  stage: number;
  stageSequence: number;
  deck: DeckId;
  deckPosition: number;
  gain: number;
  loss: number;
  balance: number;
  selectedAt: string;
  responseTimeMs: number | null;
  afterInterruption: boolean;
}
export interface Interruption {
  id: string;
  sessionId: string;
  type:
    "recovery" | "hidden" | "visible" | "help" | "storage-error" | "lease-lost";
  at: string;
}
export interface Session {
  id: string;
  schemaVersion: 2;
  task: TaskDefinition;
  participant: Participant;
  mode: "self" | "research";
  language: Language;
  theme: Theme;
  status: "active" | "break" | "completed" | "stopped";
  createdAt: string;
  updatedAt: string;
  endedAt: string | null;
  stage: number;
  trialCount: number;
  stageTrialCount: number;
  balance: number;
  positions: Record<DeckId, number>;
  revision: number;
  feedbackUntil: number;
  stageAvailableAt: number;
}
export interface SessionRecord {
  session: Session;
  trials: Trial[];
  interruptions: Interruption[];
}
export interface ScoreSegment {
  from: number;
  to: number;
  count: number;
  counts: Record<DeckId, number>;
  score: number;
  range: [number, number];
  rescaledScore: number | null;
  advantageousPercent: number | null;
  advantageousChoiceRate: number | null;
  disadvantageousChoiceRate: number | null;
  gains: number;
  losses: number;
}
export interface SessionReport {
  total: ScoreSegment;
  stages: {
    stage: number;
    blocks: ScoreSegment[];
    firstHalf: ScoreSegment;
    secondHalf: ScoreSegment;
    total: ScoreSegment;
  }[];
  finalBalance: number;
  incomplete: boolean;
}
export type ChoiceCommand = {
  id: string;
  deck: DeckId;
  selectedAt: string;
  responseTimeMs: number | null;
  afterInterruption: boolean;
};
export const emptyPositions = (): Record<DeckId, number> => ({
  A: 0,
  B: 0,
  C: 0,
  D: 0,
});
