import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GameSummary, GameLogRecord, StudentProfile } from '../types';
import { speakIdiom } from '../utils/sound';
import {
  Trophy,
  Volume2,
  RotateCcw,
  Home,
  Sparkles,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  User,
  Check,
  Send,
  AlertCircle,
  Settings,
} from 'lucide-react';

interface ResultScreenProps {
  summary: GameSummary;
  onRetry: () => void;
  onHome: () => void;
  onOpenMasteredList?: () => void;
  onOpenSettings?: () => void;
  latestGameLog?: GameLogRecord | null;
  studentProfile?: StudentProfile;
  isSyncingSheet?: boolean;
  sheetSyncSuccess?: boolean | null;
  sheetSyncMessage?: string | null;
  onRetrySheetSync?: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  summary,
  onRetry,
  onHome,
  onOpenMasteredList,
  onOpenSettings,
  latestGameLog,
  studentProfile,
  isSyncingSheet = false,
  sheetSyncSuccess = null,
  sheetSyncMessage = null,
  onRetrySheetSync,
}) => {
  const [activeTab, setActiveTab] = useState<'wrong' | 'all'>('wrong');
  const [expandedIdiomId, setExpandedIdiomId] = useState<string | null>(null);

  const wrongResults = summary.results.filter((r) => !r.isCorrect);
  const correctResults = summary.results.filter((r) => r.isCorrect);

  const percentage = Math.round((summary.score / summary.maxScore) * 100);

  // Motivational message based on score
  let scoreBadge = {
    title: '원어민 감각 마스터!',
    desc: '원어민 수준의 idiom 감각을 가졌어요!',
    color: 'text-emerald-700 bg-emerald-100 border-emerald-300',
  };
  if (percentage < 40) {
    scoreBadge = {
      title: '반복 학습이 핵심!',
      desc: '틀린 숙어를 복습하고 다시 도전해 보세요!',
      color: 'text-purple-700 bg-purple-100 border-purple-300',
    };
  } else if (percentage < 80) {
    scoreBadge = {
      title: '훌륭한 회화 실력!',
      desc: '조금만 더 복습하면 완벽하게 마스터!',
      color: 'text-amber-700 bg-amber-100 border-amber-300',
    };
  }

  const toggleExpand = (id: string) => {
    setExpandedIdiomId(expandedIdiomId === id ? null : id);
  };

  const nickname = studentProfile?.name || latestGameLog?.name || '사용자';
  const isCatchMode = summary.mode === 'catch';

  return (
    <div className="flex flex-col justify-between min-h-[100dvh] w-full max-w-md mx-auto p-4 select-none relative z-10 bg-linear-to-b from-purple-50/70 via-white to-purple-50/50">
      {/* Top Header & Total Score (총점 화면 상단) */}
      <header className="pt-2 pb-2 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-2 shadow-xs bg-white border border-purple-200 text-purple-700">
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          <span>게임 종료 • 결과 리포트</span>
        </div>

        {/* Big Score Display */}
        <div className="my-1">
          <div className="text-5xl font-black text-slate-900 tracking-tight flex items-baseline justify-center gap-1">
            <span className="text-purple-600">{summary.score}</span>
            <span className="text-xl font-bold text-slate-400">/ {summary.maxScore}점</span>
          </div>
          <div className="text-xs text-slate-500 font-semibold mt-0.5">
            5문제 중 {correctResults.length}개 정답 ({percentage}%)
          </div>
        </div>

        {/* Score Motivational Badge */}
        <div className={`mt-2 px-3 py-1.5 rounded-xl border inline-block text-center ${scoreBadge.color}`}>
          <div className="text-xs font-extrabold flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3" />
            {scoreBadge.title}
          </div>
          <div className="text-[11px] opacity-90">{scoreBadge.desc}</div>
        </div>

        {/* Google Sheets GameLogs 4-Column Record Card */}
        <div className="mt-2.5 bg-white/95 rounded-2xl border border-purple-200/80 p-2.5 text-left shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1.5">
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-[11px] font-black text-slate-900">
                Google Sheets (GameLogs) 기록 현황
              </span>
            </div>
            <span className="text-[10px] text-purple-700 font-mono font-bold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
              #{studentProfile?.playCount || latestGameLog?.play_count || 1}회차
            </span>
          </div>

          {/* 4 Google Sheets Columns Grid */}
          <div className="grid grid-cols-4 gap-1 text-[10px] text-center mb-2">
            <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
              <div className="text-slate-400 text-[9px] font-bold">A. name</div>
              <div className="font-extrabold text-slate-800 truncate">{nickname}</div>
            </div>
            <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
              <div className="text-slate-400 text-[9px] font-bold">B. playcount</div>
              <div className="font-extrabold text-purple-700">
                {studentProfile?.playCount || latestGameLog?.play_count || 1}회
              </div>
            </div>
            <div className={`p-1.5 rounded-lg border ${!isCatchMode ? 'bg-violet-50 border-violet-200 ring-1 ring-violet-300' : 'bg-slate-50 border-slate-100'}`}>
              <div className="text-slate-400 text-[9px] font-bold">C. jellydip</div>
              <div className="font-extrabold text-violet-700">
                {studentProfile?.category2Score || 0}점
              </div>
            </div>
            <div className={`p-1.5 rounded-lg border ${isCatchMode ? 'bg-amber-50 border-amber-200 ring-1 ring-amber-300' : 'bg-slate-50 border-slate-100'}`}>
              <div className="text-slate-400 text-[9px] font-bold">D. idiomdrop</div>
              <div className="font-extrabold text-amber-700">
                {studentProfile?.category1Score || 0}점
              </div>
            </div>
          </div>

          {/* Google Sheets Sync Status Bar */}
          <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-slate-100 text-[10px]">
            {sheetSyncSuccess ? (
              <div className="flex items-center gap-1 text-emerald-700 font-bold">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>시트(GameLogs) 저장 완료!</span>
              </div>
            ) : isSyncingSheet ? (
              <div className="flex items-center gap-1 text-purple-700 font-bold animate-pulse">
                <Send className="w-3 h-3 text-purple-600 animate-spin shrink-0" />
                <span>Google Sheets 저장 중...</span>
              </div>
            ) : sheetSyncSuccess === false ? (
              <div className="flex items-center gap-1 text-rose-700 font-bold">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>시트 저장 실패</span>
              </div>
            ) : (
              <div className="text-slate-400 font-medium">
                URL 미등록 (로컬 저장 유지됨)
              </div>
            )}

            <div className="flex items-center gap-1">
              {sheetSyncSuccess === false && onRetrySheetSync && (
                <button
                  onClick={onRetrySheetSync}
                  disabled={isSyncingSheet}
                  className="px-2 py-0.8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1 cursor-pointer transition-colors active:scale-95"
                >
                  <Send className="w-2.5 h-2.5" />
                  <span>다시 시도</span>
                </button>
              )}

              {onOpenSettings && (
                <button
                  onClick={onOpenSettings}
                  className="px-2 py-0.8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-0.5 cursor-pointer"
                  title="Google Sheets 연동 설정 열기"
                >
                  <Settings className="w-3 h-3" />
                  <span>시트설정</span>
                </button>
              )}
            </div>
          </div>

          {sheetSyncSuccess === false && sheetSyncMessage && (
            <div className="mt-1.5 p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[9.5px] leading-snug">
              {sheetSyncMessage}
            </div>
          )}
        </div>
      </header>

      {/* Review Section */}
      <div className="flex-1 overflow-y-auto px-1 py-2 my-2 space-y-3 max-h-[46dvh] custom-scrollbar">
        {/* Review Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('wrong')}
              className={`text-xs font-extrabold pb-1 border-b-2 transition-all flex items-center gap-1 ${
                activeTab === 'wrong'
                  ? 'text-purple-700 border-purple-600'
                  : 'text-slate-400 border-transparent hover:text-slate-600'
              }`}
            >
              <XCircle className="w-3.5 h-3.5 text-red-500" />
              <span>틀린 숙어 ({wrongResults.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`text-xs font-extrabold pb-1 border-b-2 transition-all flex items-center gap-1 ${
                activeTab === 'all'
                  ? 'text-purple-700 border-purple-600'
                  : 'text-slate-400 border-transparent hover:text-slate-600'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>전체 숙어 ({summary.results.length})</span>
            </button>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">발음 & 예문 확인</span>
        </div>

        {/* List of Idioms for Review */}
        {activeTab === 'wrong' && wrongResults.length === 0 ? (
          <div className="py-8 text-center bg-emerald-50 rounded-2xl border border-emerald-200 p-4">
            <span className="text-3xl">🎉</span>
            <h4 className="text-sm font-extrabold text-emerald-800 mt-2">
              틀린 숙어가 하나도 없어요!
            </h4>
            <p className="text-xs text-emerald-600 mt-0.5">
              완벽한 정답률입니다. 다른 테마도 도전해보세요!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {(activeTab === 'wrong' ? wrongResults : summary.results).map((item, idx) => {
              const idiom = item.idiom;
              const isExpanded = expandedIdiomId === idiom.id;

              return (
                <div
                  key={idx}
                  className={`bg-white rounded-2xl border transition-all p-3 shadow-xs ${
                    item.isCorrect ? 'border-emerald-200' : 'border-purple-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {item.isCorrect ? (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700">
                            정답
                          </span>
                        ) : (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-red-100 text-red-700">
                            오답 복습
                          </span>
                        )}
                        <h4 className="font-extrabold text-sm text-slate-900">
                          {idiom.idiom}
                        </h4>
                      </div>

                      {/* Korean Meaning */}
                      <p className="text-xs font-bold text-slate-700 mt-1">
                        {idiom.meaning}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        직역: {idiom.literalMeaning}
                      </p>
                    </div>

                    {/* Audio pronunciation speaker */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => speakIdiom(idiom.idiom)}
                        className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors cursor-pointer"
                        title="원어민 발음 듣기"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => toggleExpand(idiom.id)}
                        className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors"
                        title="예문 및 유래 보기"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Collapsible Nuance & Example Card */}
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2.5 pt-2.5 border-t border-slate-100 text-left space-y-1.5"
                    >
                      <div className="text-[11px] text-amber-800 bg-amber-50/70 p-2 rounded-xl border border-amber-100">
                        💡 <span className="font-bold">어원/뉘앙스:</span> {idiom.nuanceTip}
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                        <div className="text-[11px] font-semibold text-slate-800">
                          💬 {idiom.exampleEn}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {idiom.exampleKo}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Buttons: [맞힌 숙어 단어장] · [다시 하기] · [처음으로] */}
      <footer className="w-full pt-2.5 pb-2 border-t border-slate-200/80 bg-white/80 backdrop-blur-xs space-y-2">
        {onOpenMasteredList && (
          <button
            onClick={onOpenMasteredList}
            className="w-full py-2.5 px-3 rounded-2xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 font-extrabold text-xs shadow-xs flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-purple-600" />
            <span>누적 맞힌 숙어 단어장 보기 (예문/어원)</span>
          </button>
        )}

        <div className="grid grid-cols-2 gap-3">
          {/* [다시 하기] 버튼(좌측 하단) */}
          <button
            onClick={onRetry}
            className="py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>다시 하기</span>
          </button>

          {/* [처음으로] 버튼(우측 하단) */}
          <button
            onClick={onHome}
            className="py-3 px-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>처음으로</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
