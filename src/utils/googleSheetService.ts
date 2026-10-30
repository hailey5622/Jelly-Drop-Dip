import { GameLogRecord, StudentProfile } from '../types';
import { GOOGLE_SPREADSHEET_URL } from '../data/googleAppsScriptCode';

const PROFILE_KEY = 'idiom_university_student_profile';
const LOGS_KEY = 'idiom_game_play_logs';

// Read default Web App URL from environment variable (.env.local)
export const DEFAULT_GOOGLE_SCRIPT_URL =
  (import.meta.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL as string) ||
  (import.meta.env.VITE_GOOGLE_SCRIPT_URL as string) ||
  'https://script.google.com/macros/s/AKfycbyla9vWSjAlWlB9diqnTYJ-RPrkEZC4aZBlcvk4SqXsO86EoVSkcGKxudgT5U8LPLv9/exec';

export function getStudentProfile(): StudentProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        name: parsed.name || '대학생',
        studentId: parsed.studentId || '',
        playCount: typeof parsed.playCount === 'number' ? parsed.playCount : 0,
        category1Score: typeof parsed.category1Score === 'number' ? parsed.category1Score : 0,
        category2Score: typeof parsed.category2Score === 'number' ? parsed.category2Score : 0,
        gasWebAppUrl: parsed.gasWebAppUrl || DEFAULT_GOOGLE_SCRIPT_URL,
      };
    }
  } catch {
    // fallback
  }

  return {
    name: '대학생',
    studentId: '',
    playCount: 0,
    category1Score: 0,
    category2Score: 0,
    gasWebAppUrl: DEFAULT_GOOGLE_SCRIPT_URL,
  };
}

export function saveStudentProfile(updates: Partial<StudentProfile>): StudentProfile {
  const current = getStudentProfile();
  const next: StudentProfile = {
    ...current,
    ...updates,
  };
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
  } catch (e) {
    console.error('Failed to save student profile', e);
  }
  return next;
}

export function getGameLogs(): GameLogRecord[] {
  try {
    const raw = localStorage.getItem(LOGS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return [];
}

export function saveGameLog(record: GameLogRecord): void {
  try {
    const current = getGameLogs();
    const existingIndex = current.findIndex((item) => item.id === record.id);
    let next: GameLogRecord[];
    if (existingIndex >= 0) {
      next = [...current];
      next[existingIndex] = record;
    } else {
      next = [record, ...current].slice(0, 50); // keep last 50 logs
    }
    localStorage.setItem(LOGS_KEY, JSON.stringify(next));
  } catch (e) {
    console.error('Failed to save game log', e);
  }
}

/**
 * Format current timestamp as "YYYY-MM-DD HH:mm:ss" in local/KST time
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

/**
 * Sends a game log to the Google Apps Script Web App URL.
 * Automatically transmits tap frequency per sentence and average taps to Google Sheets!
 */
export async function sendGameLogToGoogleSheet(
  log: GameLogRecord,
  customWebAppUrl?: string
): Promise<{ success: boolean; message: string; row?: number }> {
  const profile = getStudentProfile();
  const targetUrl = (customWebAppUrl || profile.gasWebAppUrl || DEFAULT_GOOGLE_SCRIPT_URL).trim();

  if (!targetUrl) {
    return {
      success: false,
      message: '구글 앱스 스크립트 웹 앱 URL이 설정되지 않았습니다.',
    };
  }

  // Construct sentence tap breakdowns
  const sentenceFields: Record<string, any> = {};
  if (log.sentence_taps && log.sentence_taps.length > 0) {
    log.sentence_taps.forEach((st, idx) => {
      const num = idx + 1;
      sentenceFields[`sentence${num}_taps`] = st.taps;
      sentenceFields[`sentence${num}_text`] = st.idiom;
      sentenceFields[`sentence${num}_meaning`] = st.meaning;
    });
  }

  const payload = {
    timestamp: log.timestamp,
    name: log.name,
    play_count: log.play_count,
    correct_count: log.correct_count,
    wrong_count: log.wrong_count,
    'category1-score': log.category1_score,
    'category2-score': log.category2_score,
    category1_score: log.category1_score,
    category2_score: log.category2_score,
    total_score: log.total_score,
    game_mode: log.game_mode,
    // 각 문장별 탭 빈도 및 평균 필드 (User requested tap frequency per sentence & average)
    total_taps: log.total_taps,
    average_taps: log.average_taps,
    avg_taps: log.average_taps,
    sentence_taps_summary: log.sentence_taps_summary,
    sentence_taps: JSON.stringify(log.sentence_taps),
    ...sentenceFields,
  };

  try {
    // Attempt fetch with mode: 'no-cors' so browser security headers don't block GAS redirects
    await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
      mode: 'no-cors',
    });

    const updatedRecord: GameLogRecord = {
      ...log,
      syncedToGoogleSheet: true,
      syncError: undefined,
    };
    saveGameLog(updatedRecord);

    return {
      success: true,
      message: '각 문장별 탭 빈도와 평균이 구글 시트에 성공적으로 저장되었습니다!',
    };
  } catch (error) {
    console.error('Google Sheet transmission failed:', error);
    const errMessage = error instanceof Error ? error.message : '전송 중 네트워크 오류가 발생했습니다.';
    const failedRecord: GameLogRecord = {
      ...log,
      syncedToGoogleSheet: false,
      syncError: errMessage,
    };
    saveGameLog(failedRecord);

    return {
      success: false,
      message: errMessage,
    };
  }
}

/**
 * Test ping to verify Google Apps Script web app URL
 */
export async function testGoogleSheetConnection(
  webAppUrl: string
): Promise<{ success: boolean; message: string }> {
  const cleanUrl = (webAppUrl || DEFAULT_GOOGLE_SCRIPT_URL).trim();
  if (!cleanUrl) {
    return { success: false, message: '웹 앱 URL을 입력해 주세요.' };
  }
  if (!cleanUrl.includes('script.google.com')) {
    return {
      success: false,
      message: '올바른 구글 앱스 스크립트 URL 형식이 아닙니다 (https://script.google.com/...)',
    };
  }

  const testPayload = {
    timestamp: formatLocalTimestamp(),
    name: '테스트_학생',
    play_count: 0,
    correct_count: 5,
    wrong_count: 0,
    'category1-score': 50,
    'category2-score': 50,
    category1_score: 50,
    category2_score: 50,
    total_score: 50,
    game_mode: '연동 테스트',
    total_taps: 24,
    average_taps: 4.8,
    avg_taps: 4.8,
    sentence_taps_summary: '문장1(4회), 문장2(6회), 문장3(3회), 문장4(5회), 문장5(6회)',
  };

  try {
    await fetch(cleanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(testPayload),
      mode: 'no-cors',
    });

    return {
      success: true,
      message: '구글 스프레드시트로 탭 빈도 및 평균 테스트 데이터가 성공적으로 전송되었습니다!',
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : '연결 테스트 실패',
    };
  }
}
