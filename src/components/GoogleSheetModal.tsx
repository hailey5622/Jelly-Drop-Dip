import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  FileSpreadsheet,
  Code2,
  Copy,
  Check,
  ExternalLink,
  Send,
  User,
  History,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import {
  GOOGLE_SPREADSHEET_URL,
  GOOGLE_SPREADSHEET_ID,
  GOOGLE_APPS_SCRIPT_CODE,
} from '../data/googleAppsScriptCode';
import {
  getStudentProfile,
  saveStudentProfile,
  getGameLogs,
  sendGameLogToGoogleSheet,
  testGoogleSheetConnection,
} from '../utils/googleSheetService';
import { StudentProfile, GameLogRecord } from '../types';

interface GoogleSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: (profile: StudentProfile) => void;
}

export const GoogleSheetModal: React.FC<GoogleSheetModalProps> = ({
  isOpen,
  onClose,
  onProfileUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'code' | 'logs'>('settings');
  const [profile, setProfile] = useState<StudentProfile>(() => getStudentProfile());
  const [webAppUrlInput, setWebAppUrlInput] = useState(profile.gasWebAppUrl);
  const [studentNameInput, setStudentNameInput] = useState(profile.name);
  const [studentIdInput, setStudentIdInput] = useState(profile.studentId);
  const [isCopied, setIsCopied] = useState(false);
  const [testStatus, setTestStatus] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
  }>({ loading: false });
  const [logs, setLogs] = useState<GameLogRecord[]>(() => getGameLogs());
  const [resendingId, setResendingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveProfile = () => {
    const updated = saveStudentProfile({
      name: studentNameInput.trim() || '대학생',
      studentId: studentIdInput.trim(),
      gasWebAppUrl: webAppUrlInput.trim(),
    });
    setProfile(updated);
    if (onProfileUpdated) onProfileUpdated(updated);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      // fallback
      const textarea = document.createElement('textarea');
      textarea.value = GOOGLE_APPS_SCRIPT_CODE;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const handleTestConnection = async () => {
    handleSaveProfile();
    setTestStatus({ loading: true, message: '구글 스프레드시트로 테스트 전송 중...' });
    const res = await testGoogleSheetConnection(webAppUrlInput);
    setTestStatus({
      loading: false,
      success: res.success,
      message: res.message,
    });
  };

  const handleResendLog = async (log: GameLogRecord) => {
    setResendingId(log.id);
    await sendGameLogToGoogleSheet(log, webAppUrlInput);
    setLogs(getGameLogs());
    setResendingId(null);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-purple-100 flex flex-col max-h-[92dvh] overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 pt-4 pb-3 border-b border-slate-100 flex items-center justify-between bg-linear-to-r from-purple-50 via-white to-amber-50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                  <span>구글 시트 기록 연동</span>
                  <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded-full">
                    대학생 과제용
                  </span>
                </h3>
                <p className="text-[10px] text-slate-500">
                  플레이 횟수 • 정답 수 • Category 1/2 점수 실시간 기록
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Nav Tabs */}
          <div className="flex items-center border-b border-slate-100 px-3 bg-slate-50/50 text-xs font-bold">
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-2.5 px-2.5 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'border-purple-600 text-purple-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>학생 & 시트 설정</span>
            </button>

            <button
              onClick={() => setActiveTab('code')}
              className={`py-2.5 px-2.5 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'code'
                  ? 'border-purple-600 text-purple-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Apps Script 코드</span>
            </button>

            <button
              onClick={() => {
                setLogs(getGameLogs());
                setActiveTab('logs');
              }}
              className={`py-2.5 px-2.5 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'logs'
                  ? 'border-purple-600 text-purple-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>기록 로그 ({logs.length})</span>
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs text-slate-700 custom-scrollbar">
            {/* TAB 1: SETTINGS */}
            {activeTab === 'settings' && (
              <div className="space-y-3.5">
                {/* Google Sheet Target Link Card */}
                <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block mb-0.5">
                        연동 대상 구글 스프레드시트
                      </span>
                      <p className="text-xs font-bold text-slate-800 truncate max-w-[240px]">
                        Idiom Drop & Dip 기록 시트
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        ID: {GOOGLE_SPREADSHEET_ID.substring(0, 16)}...
                      </p>
                    </div>

                    <a
                      href={GOOGLE_SPREADSHEET_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] flex items-center gap-1 shadow-xs transition-colors shrink-0"
                    >
                      <span>시트 열기</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Target Column Badges */}
                  <div className="mt-2.5 pt-2 border-t border-emerald-100">
                    <span className="text-[10px] font-bold text-emerald-900 block mb-1">
                      저장 대상 열 (Columns):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {[
                        'timestamp',
                        'name',
                        'play_count',
                        'correct_count',
                        'wrong_count',
                        'category1-score',
                        'category2-score',
                      ].map((col) => (
                        <span
                          key={col}
                          className="bg-white text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold"
                        >
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* University Student Profile Fields */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-purple-600" />
                      <span>대학생 프로필 (제출자 정보)</span>
                    </label>
                    <span className="text-[10px] text-slate-400">시트의 'name' 열에 기록</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 block mb-1">이름</span>
                      <input
                        type="text"
                        value={studentNameInput}
                        onChange={(e) => setStudentNameInput(e.target.value)}
                        placeholder="예: 홍길동"
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-purple-500"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 block mb-1">학번 (선택)</span>
                      <input
                        type="text"
                        value={studentIdInput}
                        onChange={(e) => setStudentIdInput(e.target.value)}
                        placeholder="예: 20241001"
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-purple-500"
                      />
                    </div>
                  </div>

                  {/* Summary of current student stats */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1 text-center">
                    <div className="bg-white p-2 rounded-xl border border-slate-200">
                      <div className="text-[10px] text-slate-400 font-bold">플레이 횟수</div>
                      <div className="text-sm font-black text-purple-600">{profile.playCount}회</div>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200">
                      <div className="text-[10px] text-slate-400 font-bold">Cat 1 (캐치)</div>
                      <div className="text-sm font-black text-amber-600">{profile.category1Score}점</div>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200">
                      <div className="text-[10px] text-slate-400 font-bold">Cat 2 (구출)</div>
                      <div className="text-sm font-black text-violet-600">{profile.category2Score}점</div>
                    </div>
                  </div>
                </div>

                {/* Google Apps Script Web App URL Input */}
                <div className="bg-purple-50/70 p-3 rounded-2xl border border-purple-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-purple-900 flex items-center gap-1">
                      <Code2 className="w-3.5 h-3.5 text-purple-600" />
                      <span>구글 앱스 스크립트 웹 앱 URL</span>
                    </label>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-full">
                      .env.local 연동
                    </span>
                  </div>
                  <p className="text-[10px] text-purple-800">
                    환경 변수 <code className="bg-purple-100 px-1 py-0.2 rounded font-mono font-bold">NEXT_PUBLIC_GOOGLE_SCRIPT_URL</code> 값이 기본 적용되어 각 문장별 탭 빈도 및 평균이 자동 저장됩니다.
                  </p>

                  <input
                    type="url"
                    value={webAppUrlInput}
                    onChange={(e) => setWebAppUrlInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full bg-white border border-purple-200 rounded-xl px-2.5 py-2 text-xs font-mono text-slate-800 focus:outline-purple-600"
                  />

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      onClick={handleSaveProfile}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors cursor-pointer"
                    >
                      설정 저장
                    </button>

                    <button
                      onClick={handleTestConnection}
                      disabled={testStatus.loading}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-purple-50 border border-purple-300 text-purple-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      <span>{testStatus.loading ? '전송 중...' : '연동 테스트 전송'}</span>
                    </button>
                  </div>

                  {testStatus.message && (
                    <div
                      className={`p-2 rounded-xl text-[11px] font-semibold mt-1 flex items-center gap-1.5 ${
                        testStatus.success
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {testStatus.success ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      )}
                      <span>{testStatus.message}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: GOOGLE APPS SCRIPT CODE & GUIDE */}
            {activeTab === 'code' && (
              <div className="space-y-3">
                {/* 3-Step Guide */}
                <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-amber-900 space-y-1.5">
                  <div className="flex items-center gap-1 font-black text-xs text-amber-950">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>구글 시트 연동 3단계 가이드</span>
                  </div>
                  <ol className="text-[11px] space-y-1 list-decimal list-inside text-amber-900/90 leading-relaxed">
                    <li>
                      <a
                        href={GOOGLE_SPREADSHEET_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="underline font-bold text-amber-950"
                      >
                        지정된 구글 스프레드시트
                      </a>
                      에서 상단 메뉴의 <b>[확장 프로그램] → [Apps Script]</b>를 클릭합니다.
                    </li>
                    <li>아래의 코드를 복사한 뒤, 기존 코드를 지우고 붙여넣고 저장(Ctrl+S)합니다.</li>
                    <li>
                      우측 상단 <b>[배포] → [새 배포]</b> 클릭 후 유형을 <b>[웹 앱]</b>으로 선택,
                      액세스 권한을 <b>'모든 사용자(Anyone)'</b>로 설정하여 배포합니다.
                    </li>
                  </ol>
                </div>

                {/* Code Box with Copy Button */}
                <div className="relative rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 overflow-hidden shadow-inner">
                  <div className="flex items-center justify-between px-3 py-2 bg-slate-800/80 border-b border-slate-700">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-300 font-mono">
                      <Code2 className="w-3.5 h-3.5 text-purple-400" />
                      <span>Code.gs (Google Apps Script)</span>
                    </div>

                    <button
                      onClick={handleCopyCode}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-300" />
                          <span>복사 완료!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>코드 전체 복사</span>
                        </>
                      )}
                    </button>
                  </div>

                  <pre className="p-3 text-[10px] font-mono leading-relaxed overflow-x-auto max-h-60 text-slate-200">
                    <code>{GOOGLE_APPS_SCRIPT_CODE}</code>
                  </pre>
                </div>

                <p className="text-[11px] text-slate-500">
                  💡 배포 후 발급받은 URL을 [학생 & 시트 설정] 탭에 넣으면 게임 완료 시 자동 전송됩니다.
                </p>
              </div>
            )}

            {/* TAB 3: LOCAL LOGS */}
            {activeTab === 'logs' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 pb-1">
                  <span>최근 게임 기록 히스토리</span>
                  <span>총 {logs.length}건 기록됨</span>
                </div>

                {logs.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200">
                    <History className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                    <p className="text-xs font-bold text-slate-600">아직 플레이 기록이 없습니다.</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      게임을 한 판 완료하면 점수와 정답 수가 자동 기록됩니다!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[50dvh] overflow-y-auto pr-1">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-extrabold text-slate-800">
                            #{log.play_count}회차 • {log.game_mode}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {log.timestamp}
                          </span>
                        </div>

                        {/* Grid details */}
                        <div className="grid grid-cols-4 gap-1 text-center bg-slate-50 p-1.5 rounded-xl text-[10px]">
                          <div>
                            <span className="text-slate-400 block">학생명</span>
                            <span className="font-bold text-slate-800 truncate block">
                              {log.name}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">정답/오답</span>
                            <span className="font-bold text-emerald-600">
                              {log.correct_count} / {log.wrong_count}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Cat 1 점수</span>
                            <span className="font-bold text-amber-600">
                              {log.category1_score}점
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Cat 2 점수</span>
                            <span className="font-bold text-violet-600">
                              {log.category2_score}점
                            </span>
                          </div>
                        </div>

                        {/* Sentence Taps Metric in Log Card */}
                        <div className="bg-purple-50/60 rounded-xl px-2 py-1 border border-purple-100 text-[10px] flex items-center justify-between">
                          <span className="text-purple-900 font-bold">
                            문장별 탭: <span className="font-normal text-slate-700">{log.sentence_taps_summary || '기록 없음'}</span>
                          </span>
                          <span className="text-purple-700 font-extrabold shrink-0 ml-1">
                            평균 {log.average_taps || 0}회
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          {log.syncedToGoogleSheet ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <Check className="w-3 h-3" />
                              시트 전송 완료
                            </span>
                          ) : (
                            <div className="flex flex-col text-left">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                                <AlertCircle className="w-3 h-3 text-rose-600" />
                                시트 저장 실패
                              </span>
                              {log.syncError && (
                                <span className="text-[9px] text-rose-600 mt-0.5 line-clamp-1 max-w-[200px]" title={log.syncError}>
                                  {log.syncError}
                                </span>
                              )}
                            </div>
                          )}

                          <button
                            onClick={() => handleResendLog(log)}
                            disabled={resendingId === log.id}
                            className="px-2 py-0.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-[10px] font-bold border border-purple-200 cursor-pointer"
                          >
                            {resendingId === log.id ? '재전송 중...' : '시트로 재전송'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-500 font-medium">
              대학생 과제 제출 및 성적 관리 지원
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-xs transition-colors cursor-pointer"
            >
              닫기
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
