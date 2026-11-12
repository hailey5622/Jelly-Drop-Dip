import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StudentProfile } from '../types';
import {
  X,
  User,
  Settings,
  Edit2,
  Plug,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Code2,
  FileSpreadsheet,
} from 'lucide-react';
import {
  getEffectiveWebAppUrl,
  isValidGoogleScriptUrl,
  testGoogleSheetConnection,
  getDefaultScriptUrl,
  OFFICIAL_GOOGLE_SCRIPT_URL,
} from '../utils/googleSheetService';
import { saveStudentProfile } from '../utils/gameStorage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentProfile: StudentProfile;
  onOpenNicknameModal: () => void;
  onProfileUpdated: (profile: StudentProfile) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  studentProfile,
  onOpenNicknameModal,
  onProfileUpdated,
}) => {
  // If stored URL is an old deprecated URL, auto-initialize with official URL
  const initialUrl = React.useMemo(() => {
    const raw = studentProfile.gasWebAppUrl?.trim();
    if (!raw || raw.includes('AKfycbyla') || raw.includes('AKfycbyf') || !isValidGoogleScriptUrl(raw)) {
      return OFFICIAL_GOOGLE_SCRIPT_URL;
    }
    return raw;
  }, [studentProfile.gasWebAppUrl]);

  const [webAppUrlInput, setWebAppUrlInput] = useState(initialUrl);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showCode, setShowCode] = useState(false);

  React.useEffect(() => {
    setWebAppUrlInput(initialUrl);
  }, [initialUrl]);

  if (!isOpen) return null;

  const handleSaveUrl = () => {
    const trimmed = webAppUrlInput.trim() || OFFICIAL_GOOGLE_SCRIPT_URL;
    const updated = saveStudentProfile({ gasWebAppUrl: trimmed });
    onProfileUpdated(updated);
    setTestResult(null);
  };

  const handleResetDefaultUrl = () => {
    setWebAppUrlInput(OFFICIAL_GOOGLE_SCRIPT_URL);
    const updated = saveStudentProfile({ gasWebAppUrl: OFFICIAL_GOOGLE_SCRIPT_URL });
    onProfileUpdated(updated);
    setTestResult(null);
  };

  const handleRunTest = async () => {
    const target = webAppUrlInput.trim() || OFFICIAL_GOOGLE_SCRIPT_URL;
    // Auto-save target before test
    const updated = saveStudentProfile({ gasWebAppUrl: target });
    onProfileUpdated(updated);

    setIsTesting(true);
    setTestResult(null);
    const result = await testGoogleSheetConnection(target);
    setIsTesting(false);
    setTestResult(result);
  };

  const appsScriptCodeSnippet = `// Google Apps Script (GameLogs - 4개 열 자동 갱신)
// A열: name | B열: playcount | C열: jellydipscore | D열: idiomdropscore
// 상세 전체 코드는 프로젝트 루트의 google_apps_script.js에 보관되어 있습니다.`;

  const handleCopyCode = async () => {
    try {
      // Fetch the full script from google_apps_script.js if available, or fetch
      const res = await fetch('/google_apps_script.js');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      await navigator.clipboard.writeText(appsScriptCodeSnippet);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl w-full max-w-md max-h-[90dvh] flex flex-col shadow-2xl border border-purple-100 overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-purple-50/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">설정 및 프로필</h3>
                <p className="text-[10px] text-slate-500 font-medium">닉네임 관리 & Google Sheets 연동</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-xs">
            {/* 1. Profile Section */}
            <div className="bg-linear-to-br from-purple-50 to-indigo-50/40 rounded-2xl p-3.5 border border-purple-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 font-extrabold text-slate-800">
                  <User className="w-4 h-4 text-purple-600" />
                  <span>사용자 닉네임</span>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onOpenNicknameModal();
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-purple-200 text-purple-700 hover:bg-purple-100 font-bold text-[11px] shadow-2xs active:scale-95 transition-all"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>닉네임 변경</span>
                </button>
              </div>

              <div className="bg-white rounded-xl p-2.5 border border-purple-100/80 flex items-center justify-between">
                <div>
                  <div className="text-base font-black text-slate-900">
                    {studentProfile.name ? studentProfile.name : '(닉네임 미설정)'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    누적 플레이 횟수: <b className="text-purple-600">{studentProfile.playCount}회</b>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-slate-500">
                    단어 캐치 모드: <b className="text-amber-600">{studentProfile.category1Score}점</b>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    젤리탕 구출 모드: <b className="text-violet-600">{studentProfile.category2Score}점</b>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Google Sheets Section */}
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-extrabold text-slate-900">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Google Sheets (GameLogs) 자동 기록</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                  4열 전용 시트
                </span>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed">
                배포한 Google Apps Script의 <b>웹 앱 URL (/exec)</b>을 등록하면 게임 종료 시 4개 열(name, playcount, jellydipscore, idiomdropscore)에 실시간 자동 기록 및 갱신됩니다.
              </p>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Apps Script 웹 앱 URL
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={webAppUrlInput}
                    onChange={(e) => setWebAppUrlInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono outline-none focus:border-purple-600 bg-white"
                  />
                  <button
                    onClick={handleSaveUrl}
                    className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shrink-0 cursor-pointer active:scale-95 transition-all"
                  >
                    저장
                  </button>
                </div>
                <div className="flex justify-end mt-1">
                  <button
                    onClick={handleResetDefaultUrl}
                    className="text-[10px] text-purple-600 hover:text-purple-800 underline font-semibold cursor-pointer"
                  >
                    기본 공식 URL로 초기화
                  </button>
                </div>
              </div>

              {/* Connection Test Button (Requirement 7) */}
              <div className="pt-1">
                <button
                  onClick={handleRunTest}
                  disabled={isTesting || !webAppUrlInput.trim()}
                  className={`w-full py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all ${
                    isTesting || !webAppUrlInput.trim()
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-98'
                  }`}
                >
                  <Plug className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? '연결 테스트 중...' : 'Google Sheets 연결 테스트'}</span>
                </button>
              </div>

              {/* Test Result Display */}
              {testResult && (
                <div
                  className={`p-2.5 rounded-xl border text-[11px] flex items-start gap-2 ${
                    testResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="leading-snug font-medium break-keep">
                    {testResult.message}
                  </div>
                </div>
              )}

              {/* Sheet Columns Info Card */}
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-[10px] space-y-1 text-slate-600">
                <div className="font-bold text-slate-800">구글 시트 열 구성 (GameLogs 시트):</div>
                <div className="grid grid-cols-2 gap-1 text-[9.5px]">
                  <div className="bg-slate-50 p-1 rounded border border-slate-100">
                    <b className="text-purple-600">A열 name:</b> 닉네임
                  </div>
                  <div className="bg-slate-50 p-1 rounded border border-slate-100">
                    <b className="text-purple-600">B열 playcount:</b> 플레이 횟수
                  </div>
                  <div className="bg-slate-50 p-1 rounded border border-slate-100">
                    <b className="text-purple-600">C열 jellydipscore:</b> 젤리탕 점수
                  </div>
                  <div className="bg-slate-50 p-1 rounded border border-slate-100">
                    <b className="text-purple-600">D열 idiomdropscore:</b> 단어캐치 점수
                  </div>
                </div>
              </div>

              {/* Copy Script Code Button */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => setShowCode(!showCode)}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>{showCode ? '스크립트 안내 접기' : 'Apps Script 코드 확인'}</span>
                </button>

                <button
                  onClick={handleCopyCode}
                  className="px-2.5 py-1 rounded-lg bg-slate-200/80 hover:bg-slate-300 text-slate-800 font-bold text-[10px] flex items-center gap-1 active:scale-95 transition-all"
                >
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode ? '복사됨!' : '스크립트 복사'}</span>
                </button>
              </div>

              {showCode && (
                <div className="bg-slate-900 text-slate-100 p-2.5 rounded-xl text-[10px] font-mono overflow-x-auto max-h-36 custom-scrollbar">
                  <pre>{`// Apps Script 에디터에 붙여넣을 코드 위치:
// 프로젝트 루트의 google_apps_script.js 파일을 복사하세요.
// 1. 스프레드시트 -> [확장 프로그램] -> [Apps Script]
// 2. 코드 붙여넣기 후 [새 배포]
// 3. '모든 사용자(Anyone)' 권한으로 배포`}</pre>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-100 bg-slate-50 text-right">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs active:scale-95 transition-all"
            >
              닫기
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
