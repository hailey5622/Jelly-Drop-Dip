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
}

export interface GameSummary {
  mode: GameMode;
  category: IdiomCategory;
  score: number;
  maxScore: number;
  totalQuestions: number;
  results: QuestionResult[];
}

export interface MasteredIdiomRecord {
  idiomId: string;
  firstMasteredAt: string; // ISO string
  timesMastered: number;
}

