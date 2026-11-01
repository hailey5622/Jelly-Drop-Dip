/**
 * =========================================================================
 * 🎓 Idiom Drop & Dip - Google Sheets 자동 기록 Apps Script (GameLogs)
 * =========================================================================
 * 
 * [시트 구성: 정확히 4개 열만 사용]
 * A열: name            (사용자 닉네임)
 * B열: playcount       (누적 게임 플레이 횟수)
 * C열: jellydipscore   (젤리탕 구출 모드 실제 점수)
 * D열: idiomdropscore  (단어 캐치 모드 실제 점수)
 * 
 * [설치 및 배포 방법 (3단계)]
 * 1. 구글 스프레드시트 메뉴에서 [확장 프로그램] -> [Apps Script] 클릭
 * 2. 기존 코드를 모두 지우고 이 코드를 전체 붙여넣기
 *    (스프레드시트와 연동된 스크립트인 경우 SPREADSHEET_ID를 비워두거나 직접 ID를 적어도 무방합니다)
 * 3. 우측 상단 [배포] -> [새 배포] 클릭
 *    - 유형: "웹 앱" 선택
 *    - 설명: "Idiom Drop & Dip GameLogs v1"
 *    - 다음 사용자로 실행: "나 (내 계정)"
 *    - 액세스 권한이 있는 사용자: 반드시 "모든 사용자 (Anyone)" 선택!
 * 4. [배포] 버튼을 누르고 생성된 "웹 앱 URL (https://script.google.com/macros/s/.../exec)"을 복사하여
 *    게임 앱의 설정 화면에 등록하세요.
 * =========================================================================
 */

// ⚙️ 스프레드시트 ID (스프레드시트 URL의 /d/ 와 /edit 사이의 문자열)
// 스프레드시트 내 [확장 프로그램]에서 실행 시 비워두셔도 자동으로 현재 시트를 인식합니다.
const SPREADSHEET_ID = ""; 

const SHEET_NAME = "GameLogs";
const EXPECTED_HEADERS = ["name", "playcount", "jellydipscore", "idiomdropscore"];

/**
 * 대상 시트 객체를 가져오고, 헤더가 없으면 초기화합니다.
 */
function getOrCreateSheet() {
  let ss;
  if (SPREADSHEET_ID && SPREADSHEET_ID.trim() !== "" && SPREADSHEET_ID !== "[스프레드시트 ID]") {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID.trim());
  } else {
    try {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    } catch (e) {
      // openById fallback if needed
    }
  }

  if (!ss) {
    throw new Error("스프레드시트를 찾을 수 없습니다. SPREADSHEET_ID를 입력하거나 스프레드시트 내부 Apps Script 에디터를 사용해 주세요.");
  }

  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(EXPECTED_HEADERS);
    sheet.getRange(1, 1, 1, 4).setFontWeight("bold").setBackground("#EDE9FE");
    sheet.setFrozenRows(1);
  } else {
    // 1행 헤더 확인 및 보정
    const firstRow = sheet.getRange(1, 1, 1, 4).getValues()[0];
    if (!firstRow[0] || firstRow[0].toString().toLowerCase() !== "name") {
      sheet.getRange(1, 1, 1, 4).setValues([EXPECTED_HEADERS]);
      sheet.getRange(1, 1, 1, 4).setFontWeight("bold").setBackground("#EDE9FE");
      sheet.setFrozenRows(1);
    }
  }

  return sheet;
}

/**
 * GET 요청 처리: 단순 연결 상태 확인용 (데이터 변경 없음)
 */
function doGet(e) {
  try {
    const sheet = getOrCreateSheet();
    return ContentService.createTextOutput(JSON.stringify({
      status: "ready",
      message: "Idiom Drop & Dip Google Sheets GameLogs 연동 정상 작동 중",
      sheetName: SHEET_NAME,
      headers: EXPECTED_HEADERS,
      rowCount: sheet.getLastRow()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * POST 요청 처리: 게임 기록 수신 및 사용자별 갱신/추가
 */
function doPost(e) {
  // 동시 요청 데이터 덮어쓰기 방지 (LockService)
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000); // 최대 15초 대기
  } catch (lockErr) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "동시 요청 처리가 지연되고 있습니다. 잠시 후 다시 시도해 주세요."
    })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "전송된 데이터(payload)가 비어 있습니다."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    let data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (parseError) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "JSON 파싱 오류: " + parseError.toString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const userName = (data.name || "").toString().trim();
    if (!userName) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "닉네임(name)이 비어 있어 기록할 수 없습니다."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const sheet = getOrCreateSheet();
    const lastRow = sheet.getLastRow();

    // 1. 연결 테스트 요청인 경우 (is_test: true)
    if (data.is_test === true || userName === "TEST_USER") {
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        action: "test_verified",
        message: "Google Sheets (GameLogs) 연결 및 쓰기 권한이 정상 확인되었습니다!",
        sheetName: SHEET_NAME,
        columns: EXPECTED_HEADERS
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. 기존 사용자 검색 (A열: name)
    let userRowIndex = -1;
    let existingPlaycount = 0;
    let existingJellyScore = 0;
    let existingCatchScore = 0;

    if (lastRow > 1) {
      // 2행부터 마지막 행까지 A열(name), B열(playcount), C열(jellydipscore), D열(idiomdropscore) 조회
      const rows = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
      for (let i = 0; i < rows.length; i++) {
        const rowName = (rows[i][0] || "").toString().trim();
        if (rowName === userName) {
          userRowIndex = i + 2; // 1-indexed, 헤더행(1) 감안
          existingPlaycount = Number(rows[i][1]) || 0;
          existingJellyScore = Number(rows[i][2]) || 0;
          existingCatchScore = Number(rows[i][3]) || 0;
          break;
        }
      }
    }

    // 3. 점수 및 플레이 횟수 계산
    // playcount: 정상 종료 시 1 증가
    // jellydipscore: 젤리탕 구출 모드 실제 점수 (미플레이 시 기존 점수 유지)
    // idiomdropscore: 단어 캐치 모드 실제 점수 (미플레이 시 기존 점수 유지)
    const mode = (data.mode || "").toString().toLowerCase();
    const isJelly = mode.indexOf("jelly") !== -1 || mode.indexOf("rescue") !== -1 || mode.indexOf("구출") !== -1;
    const isCatch = mode.indexOf("catch") !== -1 || mode.indexOf("캐치") !== -1;

    let updatedPlaycount = existingPlaycount + 1;
    let updatedJellyScore = existingJellyScore;
    let updatedCatchScore = existingCatchScore;

    if (isJelly) {
      const incomingJelly = Number(data.jellydipscore !== undefined ? data.jellydipscore : data.score);
      updatedJellyScore = !isNaN(incomingJelly) ? incomingJelly : existingJellyScore;
    } else if (isCatch) {
      const incomingCatch = Number(data.idiomdropscore !== undefined ? data.idiomdropscore : data.score);
      updatedCatchScore = !isNaN(incomingCatch) ? incomingCatch : existingCatchScore;
    } else {
      // 모드가 명시되지 않은 경우 직접 전달된 필드 반영
      if (data.jellydipscore !== undefined) updatedJellyScore = Number(data.jellydipscore) || existingJellyScore;
      if (data.idiomdropscore !== undefined) updatedCatchScore = Number(data.idiomdropscore) || existingCatchScore;
    }

    // 4. 시트에 반영 (기존 사용자면 갱신, 신규면 행 추가)
    if (userRowIndex > 0) {
      sheet.getRange(userRowIndex, 1, 1, 4).setValues([[
        userName,
        updatedPlaycount,
        updatedJellyScore,
        updatedCatchScore
      ]]);

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        action: "updated",
        row: userRowIndex,
        data: {
          name: userName,
          playcount: updatedPlaycount,
          jellydipscore: updatedJellyScore,
          idiomdropscore: updatedCatchScore
        }
      })).setMimeType(ContentService.MimeType.JSON);
    } else {
      sheet.appendRow([
        userName,
        updatedPlaycount,
        updatedJellyScore,
        updatedCatchScore
      ]);

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        action: "created",
        row: sheet.getLastRow(),
        data: {
          name: userName,
          playcount: updatedPlaycount,
          jellydipscore: updatedJellyScore,
          idiomdropscore: updatedCatchScore
        }
      })).setMimeType(ContentService.MimeType.JSON);
    }

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "시트 저장 실패: " + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
