/**
 * =========================================================================
 * 🎓 대학생 영어 숙어 게임 (Idiom Drop & Dip) - 구글 시트 자동 기록 스크립트
 * =========================================================================
 * 스프레드시트 URL: 
 * https://docs.google.com/spreadsheets/d/1Xqi-30h5j-UpikfA0WYnYornKGCcCEyuy5KYqsaH_CE/edit?usp=sharing
 * 
 * [스프레드시트 열 구성]
 * timestamp | name | play_count | correct_count | wrong_count | category1-score | category2-score | total_score | game_mode | average_taps | total_taps | sentence_taps_summary
 *
 * [배포 방법 3단계 (초간단)]
 * 1. 구글 스프레드시트 메뉴에서 [확장 프로그램] -> [Apps Script] 클릭
 * 2. 기존 코드를 모두 지우고 본 스크립트 코드를 붙여넣은 뒤 [저장(Ctrl+S / Cmd+S)]
 * 3. 우측 상단 [배포] -> [새 배포] 클릭
 *    - 유형 선택: [웹 앱] (톱니바퀴 아이콘 클릭 후 웹 앱 선택)
 *    - 설명: 영어 숙어 게임 기록 (문장별 탭 빈도 및 평균 포함)
 *    - 다음 사용자 권한으로 실행: [나 (내 계정)]
 *    - 액세스 권한이 있는 사용자: [모든 사용자 (Anyone)] ★필수★
 *    - [배포] 클릭 후 승인 절차를 완료하고, 생성된 웹 앱 URL(https://script.google.com/macros/s/.../exec)을
 *      .env.local 파일의 NEXT_PUBLIC_GOOGLE_SCRIPT_URL 키 값으로 사용합니다.
 */

const SPREADSHEET_ID = "1Xqi-30h5j-UpikfA0WYnYornKGCcCEyuy5KYqsaH_CE";
const SHEET_NAME = "GameLogs";

function doPost(e) {
  try {
    let data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    const ss = SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.getSheets()[0] || ss.insertSheet(SHEET_NAME);
    }

    // 기본 헤더 정의 (각 문장별 탭 빈도 및 평균 열 포함)
    const defaultHeaders = [
      "timestamp",
      "name",
      "play_count",
      "correct_count",
      "wrong_count",
      "category1-score",
      "category2-score",
      "total_score",
      "game_mode",
      "average_taps",
      "total_taps",
      "sentence_taps_summary"
    ];

    // 시트가 비어있는 경우 헤더 행 자동 생성 및 스타일 적용
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(defaultHeaders);
      const headerRange = sheet.getRange(1, 1, 1, defaultHeaders.length);
      headerRange.setBackground("#4C1D95"); // 다크 바이올렛
      headerRange.setFontColor("#FFFFFF");
      headerRange.setFontWeight("bold");
      headerRange.setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }

    // 현재 시트의 헤더 읽기 (열 순서가 바뀌어도 안전하게 매핑)
    const currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
      .map(function(h) { return String(h).trim().toLowerCase(); });

    // 데이터 값 추출 및 기본값 지정
    const timestamp = data.timestamp || Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");
    const name = data.name || data.student_name || "대학생";
    const playCount = Number(data.play_count !== undefined ? data.play_count : (data["play-count"] !== undefined ? data["play-count"] : 1));
    const correctCount = Number(data.correct_count !== undefined ? data.correct_count : 0);
    const wrongCount = Number(data.wrong_count !== undefined ? data.wrong_count : 0);
    const cat1Score = Number(data["category1-score"] !== undefined ? data["category1-score"] : (data.category1_score || 0));
    const cat2Score = Number(data["category2-score"] !== undefined ? data["category2-score"] : (data.category2_score || 0));
    const totalScore = Number(data.total_score !== undefined ? data.total_score : (data.score || (cat1Score + cat2Score)));
    const gameMode = data.game_mode || data.mode || "단어 캐치";
    const avgTaps = Number(data.average_taps !== undefined ? data.average_taps : (data.avg_taps || 0));
    const totalTaps = Number(data.total_taps !== undefined ? data.total_taps : 0);
    const sentenceSummary = data.sentence_taps_summary || "";

    // 헤더 순서에 따라 행 데이터 배열 생성
    const rowData = currentHeaders.map(function(col) {
      switch (col) {
        case "timestamp":
        case "일시":
        case "날짜":
          return timestamp;
        case "name":
        case "이름":
        case "학생":
        case "학번":
          return name;
        case "play_count":
        case "play-count":
        case "플레이횟수":
          return playCount;
        case "correct_count":
        case "정답수":
          return correctCount;
        case "wrong_count":
        case "오답수":
          return wrongCount;
        case "category1-score":
        case "category1_score":
        case "단어캐치점수":
          return cat1Score;
        case "category2-score":
        case "category2_score":
        case "젤리구출점수":
          return cat2Score;
        case "total_score":
        case "score":
        case "총점":
          return totalScore;
        case "game_mode":
        case "mode":
        case "게임모드":
          return gameMode;
        case "average_taps":
        case "avg_taps":
        case "평균탭수":
        case "평균탭빈도":
          return avgTaps;
        case "total_taps":
        case "총탭수":
          return totalTaps;
        case "sentence_taps_summary":
        case "문장별탭수":
        case "문장별탭빈도":
          return sentenceSummary;
        default:
          return data[col] !== undefined ? data[col] : "";
      }
    });

    sheet.appendRow(rowData);

    // 마지막 추가된 행 중앙 정렬
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 1, 1, rowData.length).setHorizontalAlignment("center");

    const result = {
      status: "success",
      message: "각 문장별 탭 빈도 및 게임 기록이 구글 시트에 성공적으로 저장되었습니다!",
      row: lastRow,
      data: {
        timestamp: timestamp,
        name: name,
        play_count: playCount,
        correct_count: correctCount,
        wrong_count: wrongCount,
        category1_score: cat1Score,
        category2_score: cat2Score,
        average_taps: avgTaps,
        total_taps: totalTaps,
        sentence_taps_summary: sentenceSummary
      }
    };

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    const errorResult = {
      status: "error",
      message: error.toString()
    };
    return ContentService.createTextOutput(JSON.stringify(errorResult))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  if (!e || !e.parameter || Object.keys(e.parameter).length === 0) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "ready",
      message: "대학생 영어 숙어 게임 구글 시트 연동 웹 앱이 정상 동작 중입니다.",
      spreadsheet_id: SPREADSHEET_ID
    })).setMimeType(ContentService.MimeType.JSON);
  }
  return doPost(e);
}
