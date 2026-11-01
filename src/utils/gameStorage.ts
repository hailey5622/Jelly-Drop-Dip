import { GameLogRecord, StudentProfile } from '../types';

const PROFILE_KEY = 'idiom_university_student_profile';
const LOGS_KEY = 'idiom_game_play_logs';

/**
 * Retrieves the student profile from local storage.
 * Returns nickname (name), play count, category1Score (idiomdropscore), category2Score (jellydipscore),
 * and custom gasWebAppUrl.
 */
export function getStudentProfile(): StudentProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        // If name was default '대학생', treat as needing nickname prompt or keep if user chose it
        name: typeof parsed.name === 'string' ? parsed.name.trim() : '',
        studentId: parsed.studentId || '',
        playCount: typeof parsed.playCount === 'number' ? parsed.playCount : 0,
        category1Score: typeof parsed.category1Score === 'number' ? parsed.category1Score : 0,
        category2Score: typeof parsed.category2Score === 'number' ? parsed.category2Score : 0,
        gasWebAppUrl: typeof parsed.gasWebAppUrl === 'string' ? parsed.gasWebAppUrl.trim() : '',
      };
    }
  } catch (e) {
    console.error('Failed to load student profile from localStorage', e);
  }

  return {
    name: '',
    studentId: '',
    playCount: 0,
    category1Score: 0,
    category2Score: 0,
    gasWebAppUrl: '',
  };
}

/**
 * Saves or updates student profile in local storage.
 */
export function saveStudentProfile(updates: Partial<StudentProfile>): StudentProfile {
  const current = getStudentProfile();
  const next: StudentProfile = {
    ...current,
    ...updates,
  };
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
  } catch (e) {
    console.error('Failed to save student profile to localStorage', e);
  }
  return next;
}

/**
 * Retrieves all stored game logs from local storage.
 */
export function getGameLogs(): GameLogRecord[] {
  try {
    const raw = localStorage.getItem(LOGS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load game logs from localStorage', e);
  }
  return [];
}

/**
 * Saves a game log record to local storage (persists up to last 50 games).
 */
export function saveGameLog(record: GameLogRecord): void {
  try {
    const current = getGameLogs();
    const existingIndex = current.findIndex((item) => item.id === record.id);
    let next: GameLogRecord[];
    if (existingIndex >= 0) {
      next = [...current];
      next[existingIndex] = record;
    } else {
      next = [record, ...current].slice(0, 50);
    }
    localStorage.setItem(LOGS_KEY, JSON.stringify(next));
  } catch (e) {
    console.error('Failed to save game log to localStorage', e);
  }
}

/**
 * Formats current timestamp as "YYYY-MM-DD HH:mm:ss" in local time.
 */
export function formatLocalTimestamp(date = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
}
