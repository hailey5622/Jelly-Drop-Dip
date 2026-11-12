import { SheetGamePayload } from '../types';
import { getStudentProfile, saveStudentProfile } from './gameStorage';

// In-memory cache of successfully synced game IDs to prevent duplicate incrementing
const syncedGameIds = new Set<string>();

/**
 * The official current Google Apps Script Web App executable URL
 */
export const OFFICIAL_GOOGLE_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbyVKZVBkWPmjjBkOlk-3huNEly9Ia2KhnLig1xAY2C3BDroPVuBXpDY6yeFuJhKhWpd/exec';

/**
 * Default fallback URL from environment variables (.env.local or process)
 */
export function getDefaultScriptUrl(): string {
  const envUrl =
    (import.meta.env.VITE_GOOGLE_SCRIPT_URL as string) ||
    (import.meta.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL as string) ||
    OFFICIAL_GOOGLE_SCRIPT_URL;
  return envUrl.trim() || OFFICIAL_GOOGLE_SCRIPT_URL;
}

/**
 * Checks whether a URL is a valid Google Apps Script Web App executable endpoint.
 */
export function isValidGoogleScriptUrl(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (trimmed.includes('googleusercontent.com') || trimmed.includes('/echo')) {
    return false;
  }
  return /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec\/?(\?.*)?$/.test(trimmed);
}

/**
 * Resolves the effective Google Apps Script Web App URL to use.
 * Checks custom URL first, then student profile in localStorage, then env variables.
 * Automatically purges deprecated old URLs from earlier versions (e.g. AKfycbyla...).
 */
export function getEffectiveWebAppUrl(customUrl?: string | null): string {
  if (customUrl && isValidGoogleScriptUrl(customUrl)) {
    return customUrl.trim();
  }

  const profile = getStudentProfile();
  if (profile.gasWebAppUrl) {
    const trimmed = profile.gasWebAppUrl.trim();
    // If stored URL is an old deprecated URL from earlier tests, auto-migrate to the official new URL
    if (
      trimmed.includes('AKfycbyla9vWSjAlWlB9diqnTYJ-RPrkEZC4aZBlcvk4SqXsO86EoVSkcGKxudgT5U8LPLv9') ||
      trimmed.includes('AKfycbyfH8ExlXGo') ||
      trimmed.includes('googleusercontent.com') ||
      trimmed.includes('/echo') ||
      !isValidGoogleScriptUrl(trimmed)
    ) {
      console.warn('⚠️ [GoogleSheet] 로컬 저장소에 남아있던 구버전 Apps Script URL을 최신 공식 URL로 자동 마이그레이션합니다.');
      saveStudentProfile({ gasWebAppUrl: OFFICIAL_GOOGLE_SCRIPT_URL });
      return OFFICIAL_GOOGLE_SCRIPT_URL;
    }
    return trimmed;
  }

  return getDefaultScriptUrl();
}

/**
 * Sends a game log to the Google Apps Script Web App URL.
 * Exactly 4 columns managed on the sheet:
 * A: name
 * B: playcount
 * C: jellydipscore
 * D: idiomdropscore
 */
export async function sendGameRecordToSheet(
  record: SheetGamePayload,
  customWebAppUrl?: string
): Promise<{ success: boolean; message: string; row?: number; data?: any }> {
  // Prevent duplicate transmission of the same completed game session
  if (record.game_id && syncedGameIds.has(record.game_id)) {
    console.log('ℹ️ [GoogleSheet] 이미 전송 완료된 게임 ID:', record.game_id);
    return {
      success: true,
      message: '이미 Google Sheets에 전송이 완료된 게임 기록입니다.',
    };
  }

  const targetUrl = getEffectiveWebAppUrl(customWebAppUrl);

  if (!targetUrl) {
    return {
      success: false,
      message: 'Google Apps Script 웹 앱 URL이 설정되지 않았습니다. 설정 화면에서 URL을 등록해 주세요.',
    };
  }

  if (!isValidGoogleScriptUrl(targetUrl)) {
    return {
      success: false,
      message: '올바른 Apps Script 웹 앱 URL 형식이 아닙니다 (https://script.google.com/macros/s/배포ID/exec).',
    };
  }

  if (!record.name || !record.name.trim()) {
    return {
      success: false,
      message: '사용자 닉네임이 비어 있어 기록을 전송할 수 없습니다.',
    };
  }

  const payload = {
    name: record.name.trim(),
    playcount: record.playcount,
    jellydipscore: record.jellydipscore,
    idiomdropscore: record.idiomdropscore,
    mode: record.mode,
    score: record.score,
    game_id: record.game_id,
    is_test: false,
  };

  console.log('📡 [GoogleSheet] GameLogs 전송 시작! 대상 URL:', targetUrl);
  console.log('📡 [GoogleSheet] 전송 데이터(Payload):', payload);

  try {
    // Send as CORS simple request (text/plain avoids OPTIONS preflight which GAS rejects)
    // credentials: 'omit' ensures compliance with wildcard Access-Control-Allow-Origin
    const response = await fetch(targetUrl, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
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
      // Non-JSON response, inspect text below
    }

    console.log('📥 [GoogleSheet] HTTP 응답 상태:', response.status, response.statusText);
    console.log('📥 [GoogleSheet] 서버 수신 본문(Text):', responseText);

    const isSuccess =
      resJson &&
      (resJson.status === 'success' ||
        resJson.action === 'updated' ||
        resJson.action === 'created' ||
        (typeof resJson.row === 'number' && resJson.row > 0));

    if (isSuccess) {
      if (record.game_id) {
        syncedGameIds.add(record.game_id);
      }
      console.log('✅ [GoogleSheet] GameLogs 저장 성공! 결과:', resJson);
      return {
        success: true,
        message: `Google Sheets GameLogs에 기록이 ${resJson.action === 'updated' ? '갱신' : '저장'}되었습니다.`,
        row: resJson.row,
        data: resJson.data,
      };
    }

    if (resJson && resJson.status === 'error') {
      console.error('❌ [GoogleSheet] Apps Script 에러 반환:', resJson.message);
      return {
        success: false,
        message: `Apps Script 오류: ${resJson.message}`,
      };
    }

    // Diagnostic fallback
    let friendlyError = 'Google Sheets 저장 실패: 올바른 응답을 받지 못했습니다.';
    if (responseText.includes('ServiceLogin') || responseText.includes('accounts.google.com')) {
      friendlyError =
        '권한 오류: Google Apps Script [새 배포] 시 "액세스 권한이 있는 사용자"를 [모든 사용자(Anyone)]로 설정해야 합니다.';
    } else if (responseText.includes('doPost') || responseText.includes('스크リプト関数が見つかりません')) {
      friendlyError = 'Apps Script 오류: 웹 앱에 doPost 함수가 배포되지 않았습니다. 새 버전을 배포해 주세요.';
    }

    return {
      success: false,
      message: friendlyError,
    };
  } catch (error) {
    console.error('❌ [GoogleSheet] 전송 네트워크 오류:', error);
    const rawError = error instanceof Error ? error.message : String(error);
    let msg = `Google Sheets 연결 실패: ${rawError}`;
    if (rawError.includes('Failed to fetch') || rawError.includes('NetworkError')) {
      msg =
        'Google Sheets 연결 실패 (CORS / 권한 오류): Apps Script 웹 앱 배포 시 액세스 권한이 [모든 사용자(Anyone)]인지 확인하세요.';
    }
    return {
      success: false,
      message: msg,
    };
  }
}

/**
 * Performs a real connection test to Google Apps Script.
 * Uses TEST_USER and is_test: true to avoid contaminating real student records.
 */
export async function testGoogleSheetConnection(
  customUrl?: string
): Promise<{ success: boolean; message: string; row?: number }> {
  const targetUrl = getEffectiveWebAppUrl(customUrl);

  console.log('🧪 [GoogleSheet Test] 연결 테스트 대상 URL:', targetUrl);

  if (!targetUrl) {
    return {
      success: false,
      message: 'Google Apps Script 웹 앱 URL을 먼저 입력해 주세요.',
    };
  }

  if (!isValidGoogleScriptUrl(targetUrl)) {
    return {
      success: false,
      message:
        '올바른 구글 앱스 스크립트 실행 URL 형식이 아닙니다 (https://script.google.com/macros/s/배포ID/exec).',
    };
  }

  const testPayload = {
    is_test: true,
    name: 'TEST_USER',
    playcount: 1,
    jellydipscore: 10,
    idiomdropscore: 10,
    mode: 'test',
    score: 10,
  };

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
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

    console.log('🧪 [GoogleSheet Test] 응답 수신 상태:', response.status, responseText);

    if (resJson && resJson.status === 'success') {
      return {
        success: true,
        message: resJson.message || 'GameLogs 시트 연결 및 쓰기 권한이 정상 확인되었습니다!',
        row: resJson.row,
      };
    }

    if (resJson && resJson.status === 'error') {
      return {
        success: false,
        message: `Apps Script 오류: ${resJson.message}`,
      };
    }

    if (responseText.includes('ServiceLogin') || responseText.includes('accounts.google.com')) {
      return {
        success: false,
        message:
          '권한 오류: Apps Script [배포] → [새 배포] 시 "액세스 권한이 있는 사용자"를 [모든 사용자(Anyone)]로 설정해야 로그인 없이 기록할 수 있습니다.',
      };
    }

    if (responseText.includes('doPost') || responseText.includes('스크リプト関数が見つかりません')) {
      return {
        success: false,
        message: 'Apps Script 오류: 배포된 웹 앱에 doPost 함수가 없습니다. 코드를 저장하고 [새 버전]을 배포해 주세요.',
      };
    }

    return {
      success: false,
      message: `Google Apps Script에서 비정상 응답이 반환되었습니다 (${responseText.slice(0, 80)}).`,
    };
  } catch (err) {
    const rawError = err instanceof Error ? err.message : String(err);
    console.error('🧪 [GoogleSheet Test] 연결 실패:', err);
    if (rawError.includes('Failed to fetch') || rawError.includes('NetworkError')) {
      return {
        success: false,
        message:
          '연결 실패 (CORS / 권한 오류): Apps Script에서 액세스 권한이 [모든 사용자(Anyone)]로 설정되었는지 확인해 주세요.',
      };
    }
    return {
      success: false,
      message: `연결 테스트 실패: ${rawError}`,
    };
  }
}
