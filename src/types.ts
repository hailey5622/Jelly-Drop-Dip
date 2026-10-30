export type GameMode = 'catch' | 'jelly_rescue';

export type IdiomCategory = 'all' | 'daily' | 'business' | 'social';

export interface IdiomItem {
  id: string;
  idiom: string;
  meaning: string;
  literalMeaning: string;
  nuanceTip: string;
  exampleEn: string;
  exampleKo: string;
  category: 'daily' | 'business' | 'social';
  words: string[];
  distractors: string[];
}

export interface QuestionResult {
  idiom: IdiomItem;
  isCorrect: boolean;
  mistakes: number;
  timeSpentSec?: number;
  tapCount?: number; // 해당 문장 풀이 중 탭 횟수
}

export interface GameSummary {
  mode: GameMode;
  category: IdiomCategory;
  score: number;
  maxScore: number;
  totalQuestions: number;
  results: QuestionResult[];
  averageTaps?: number; // 문장당 평균 탭 수
  totalTaps?: number;
}

export interface MasteredIdiomRecord {
  idiomId: string;
  firstMasteredAt: string; // ISO string
  timesMastered: number;
}

export interface SentenceTapMetric {
  sentenceIndex: number;
  idiom: string;
  meaning: string;
  taps: number;
  isCorrect: boolean;
}

export interface GameLogRecord {
  id: string;
  timestamp: string;
  name: string;
  play_count: number;
  correct_count: number;
  wrong_count: number;
  category1_score: number; // Word Catch score
  category2_score: number; // Jelly Rescue score
  total_score: number;
  game_mode: string;
  // 각 문장별 탭 빈도 및 평균 필드
  total_taps: number;
  average_taps: number;
  sentence_taps: SentenceTapMetric[];
  sentence_taps_summary: string;
  syncedToGoogleSheet: boolean;
  syncError?: string;
}

export interface StudentProfile {
  name: string;
  studentId: string;
  playCount: number;
  category1Score: number; // Word Catch high/last score
  category2Score: number; // Jelly Rescue high/last score
  gasWebAppUrl: string;
}

