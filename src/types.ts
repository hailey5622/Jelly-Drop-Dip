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
  tapCount?: number;
}

export interface GameSummary {
  mode: GameMode;
  category: IdiomCategory;
  score: number;
  maxScore: number;
  totalQuestions: number;
  results: QuestionResult[];
  averageTaps?: number;
  totalTaps?: number;
}

export interface MasteredIdiomRecord {
  idiomId: string;
  firstMasteredAt: string;
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
  category1_score: number; // Word Catch score (idiomdropscore)
  category2_score: number; // Jelly Rescue score (jellydipscore)
  total_score: number;
  game_mode: string;
  total_taps: number;
  average_taps: number;
  sentence_taps: SentenceTapMetric[];
  sentence_taps_summary: string;
  syncedToGoogleSheet?: boolean;
  syncError?: string;
}

export interface StudentProfile {
  name: string; // User's Nickname
  studentId?: string;
  playCount: number;
  category1Score: number; // Word Catch actual score (idiomdropscore)
  category2Score: number; // Jelly Rescue actual score (jellydipscore)
  gasWebAppUrl?: string; // Google Apps Script Web App URL
}

/**
 * 4 required columns for Google Sheets 'GameLogs':
 * Column A: name
 * Column B: playcount
 * Column C: jellydipscore
 * Column D: idiomdropscore
 */
export interface SheetGamePayload {
  name: string;
  playcount: number;
  jellydipscore: number;
  idiomdropscore: number;
  mode: GameMode | 'test';
  score: number;
  game_id?: string;
  is_test?: boolean;
}
