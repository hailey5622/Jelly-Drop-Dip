import { GameLogRecord, StudentProfile } from '../types';

const PROFILE_KEY = 'idiom_university_student_profile';
const LOGS_KEY = 'idiom_game_play_logs';

// Read default Web App URL from environment variable (.env.local or process)
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
 * Transmits:
 * - 이름 (name)
 * - 플레이 횟수 (play_count)
 * - 정답 수 (correct_count)
 * - 오답 수 (wrong_count)
 * - 카테고리별 점수 (category1-score, category2-score)
 * - 총점 (total_score)
 * - 게임 모드 (game_mode)
 * - 평균 탭 수 (average_taps)
 * - 총 탭 수 (total_taps)
 * - 문장별 탭 빈도 (sentence_taps_summary)
 *
 * Checks real response and prevents false positive successes.
 */
export async function sendGameLogToGoogleSheet(
  log: GameLogRecord,
  customWebAppUrl?: string
): Promise<{ success: boolean; message: string; row?: number }> {
  const profile = getStudentProfile();
  const targetUrl = (customWebAppUrl || profile.gasWebAppUrl || DEFAULT_GOOGLE_SCRIPT_URL).trim();

  if (!targetUrl || !targetUrl.startsWith('http')) {
    const errorMsg = '구글 앱스 스크립트 웹 앱 URL이 올바르게 설정되지 않았습니다.';
    const failedRecord: GameLogRecord = {
      ...log,
      syncedToGoogleSheet: false,
      syncError: errorMsg,
    };
    saveGameLog(failedRecord);
    return {
      success: false,
      message: errorMsg,
    };
  }

  // Sentence tap breakdowns
  const sentenceFields: Record<string, any> = {};
  if (log.sentence_taps && log.sentence_taps.length > 0) {
    log.sentence_taps.forEach((st, idx) => {
      const num = idx + 1;
      sentenceFields[`sentence${num}_taps`] = st.taps;
      sentenceFields[`sentence${num}_text`] = st.idiom;
      sentenceFields[`sentence${num}_meaning`] = st.meaning;
    });
  }

  // 10 required items + additional mapping
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
    average_taps: log.average_taps,
    avg_taps: log.average_taps,
    total_taps: log.total_taps,
    sentence_taps_summary: log.sentence_taps_summary,
    sentence_taps: JSON.stringify(log.sentence_taps),
    ...sentenceFields,
  };

  try {
    // Send as CORS simple request (text/plain avoids OPTIONS preflight which GAS rejects)
    // redirect: 'follow' ensures browser follows 302 to script.googleusercontent.com
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });

    const responseText = await response.text();
    let resJson: any = null;
    try {
      resJson = JSON.parse(responseText);
    } catch {
      // Non-JSON response, inspect text
    }

    if (resJson && resJson.status === 'success') {
      const updatedRecord: GameLogRecord = {
        ...log,
        syncedToGoogleSheet: true,
        syncError: undefined,
      };
      saveGameLog(updatedRecord);

      return {
        success: true,
        message: resJson.message || '구글 스프레드시트에 성공적으로 기록되었습니다!',
        row: resJson.row,
      };
    }

    if (resJson && resJson.status === 'error') {
      const errorMsg = resJson.message || 'Apps Script 처리 중 오류가 반환되었습니다.';
      const failedRecord: GameLogRecord = {
        ...log,
        syncedToGoogleSheet: false,
        syncError: errorMsg,
      };
      saveGameLog(failedRecord);

      return {
        success: false,
        message: errorMsg,
      };
    }

    // Response arrived but was not valid success JSON
    let friendlyError = '구글 시트 저장 실패: Google Apps Script 응답이 올바르지 않습니다.';
    if (responseText.includes('스크リプト関数が見つかりません') || responseText.includes('doPost')) {
      friendlyError = 'Google Apps Script에 doPost 함수가 배포되지 않았습니다. Apps Script 에디터에 코드를 붙여넣고 [새 배포]를 진행해 주세요.';
    } else if (responseText.includes('ServiceLogin') || responseText.includes('accounts.google.com')) {
      friendlyError = 'Google Apps Script 웹 앱 권한 오류: 배포 시 액세스 권한을 [모든 사용자 (Anyone)]로 설정해야 합니다.';
    }

    const failedRecord: GameLogRecord = {
      ...log,
      syncedToGoogleSheet: false,
      syncError: friendlyError,
    };
    saveGameLog(failedRecord);

    return {
      success: false,
      message: friendlyError,
    };
  } catch (error) {
    console.error('Google Sheet POST request error:', error);
    const rawError = error instanceof Error ? error.message : String(error);
    
    // Provide diagnostic guidance for typical CORS/GAS deployment issues
    let userMsg = `구글 시트 저장 실패: Google Apps Script 웹 앱에 연결할 수 없습니다.`;
    if (rawError.includes('Failed to fetch') || rawError.includes('NetworkError') || rawError.includes('Load failed')) {
      userMsg = '구글 시트 저장 실패 (CORS / 권한 오류): Google Apps Script에서 [배포] → [새 배포]를 클릭하고 액세스 권한을 [모든 사용자 (Anyone)]로 설정했는지 확인해 주세요.';
    } else {
      userMsg = `구글 시트 저장 실패: ${rawError}`;
    }

    const failedRecord: GameLogRecord = {
      ...log,
      syncedToGoogleSheet: false,
      syncError: userMsg,
    };
    saveGameLog(failedRecord);

    return {
      success: false,
      message: userMsg,
    };
  }
}

/**
 * Test ping to verify Google Apps Script web app URL with real success verification
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
    const response = await fetch(cleanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(testPayload),
      redirect: 'follow',
    });

    const responseText = await response.text();
    let resJson: any = null;
    try {
      resJson = JSON.parse(responseText);
    } catch {
      // not JSON
    }

    if (resJson && resJson.status === 'success') {
      return {
        success: true,
        message: 'Google Apps Script 및 구글 스프레드시트 연동이 성공적으로 확인되었습니다!',
      };
    }

    if (resJson && resJson.status === 'error') {
      return {
        success: false,
        message: `Apps Script 오류: ${resJson.message}`,
      };
    }

    if (responseText.includes('스크リプト関数が見つかりません') || responseText.includes('doPost')) {
      return {
        success: false,
        message: 'Google Apps Script에 doPost 함수가 배포되지 않았습니다. 코드를 복사하여 [새 배포]를 진행해 주세요.',
      };
    }

    return {
      success: false,
      message: 'Google Apps Script에서 유효한 성공 응답을 받지 못했습니다. 배포 설정을 확인해 주세요.',
    };
  } catch (err) {
    const rawError = err instanceof Error ? err.message : String(err);
    if (rawError.includes('Failed to fetch') || rawError.includes('NetworkError')) {
      return {
        success: false,
        message: '연동 실패 (CORS / 권한 오류): Apps Script에서 [배포] → [새 배포] 시 액세스 권한이 [모든 사용자(Anyone)]로 설정되었는지 확인해 주세요.',
      };
    }
    return {
      success: false,
      message: `연결 테스트 실패: ${rawError}`,
    };
  }
}
