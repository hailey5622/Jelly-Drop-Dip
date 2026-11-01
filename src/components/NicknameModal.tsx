import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, User, ArrowRight, CheckCircle2 } from 'lucide-react';

interface NicknameModalProps {
  isOpen: boolean;
  currentNickname?: string;
  onSaveNickname: (nickname: string) => void;
  canClose?: boolean;
  onClose?: () => void;
}

export const NicknameModal: React.FC<NicknameModalProps> = ({
  isOpen,
  currentNickname = '',
  onSaveNickname,
  canClose = false,
  onClose,
}) => {
  const [nicknameInput, setNicknameInput] = useState(currentNickname);
  const [touched, setTouched] = useState(false);

  if (!isOpen) return null;

  const trimmed = nicknameInput.trim();
  const isValid = trimmed.length >= 1 && trimmed.length <= 12;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isValid) return;
    onSaveNickname(trimmed);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 12 }}
          className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-purple-100 flex flex-col text-center relative overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-linear-to-br from-purple-200/40 to-amber-200/40 blur-xl pointer-events-none" />

          {/* Icon Header */}
          <div className="w-16 h-16 rounded-2xl bg-linear-to-tr from-purple-600 to-indigo-600 text-white mx-auto flex items-center justify-center shadow-md mb-3">
            <User className="w-8 h-8" />
          </div>

          <div className="inline-flex items-center justify-center gap-1 text-purple-700 bg-purple-50 text-[11px] font-extrabold px-3 py-1 rounded-full mx-auto mb-2 border border-purple-200/60">
            <Sparkles className="w-3 h-3 text-purple-600" />
            <span>게임 시작 전 닉네임 설정</span>
          </div>

          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            환영합니다! 닉네임을 정해주세요
          </h2>
          <p className="text-xs text-slate-500 mt-1 mb-5">
            단어 캐치 모드와 젤리탕 구출 모드 점수가<br />이 닉네임으로 Google Sheets에 기록됩니다.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-left">
              <label className="text-[11px] font-bold text-slate-600 block mb-1.5 ml-1">
                닉네임 (1~12자, 공백 불가)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={nicknameInput}
                  onChange={(e) => {
                    setNicknameInput(e.target.value);
                    setTouched(true);
                  }}
                  placeholder="예: 젤리탐험가, 숙어마스터"
                  maxLength={12}
                  autoFocus
                  className={`w-full px-4 py-3 rounded-2xl border text-sm font-bold transition-all outline-none ${
                    touched && !isValid
                      ? 'border-rose-400 bg-rose-50/40 focus:ring-2 focus:ring-rose-200 text-rose-900'
                      : 'border-slate-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 text-slate-900'
                  }`}
                />
                {isValid && (
                  <div className="absolute right-3.5 top-3.5 text-emerald-500">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
              </div>

              {touched && !trimmed && (
                <p className="text-[10px] text-rose-500 font-semibold mt-1 ml-1">
                  닉네임은 공백일 수 없습니다. 한 글자 이상 입력해 주세요.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!isValid}
              className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all ${
                isValid
                  ? 'bg-purple-600 hover:bg-purple-700 active:scale-98 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>{currentNickname ? '닉네임 변경 완료' : '게임 시작하기'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {canClose && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
              >
                닫기
              </button>
            )}
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
