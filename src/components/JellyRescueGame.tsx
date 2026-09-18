import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { IdiomItem, QuestionResult } from '../types';
import { HangingJellyCharacter } from './CharacterGraphics';
import { sounds, speakIdiom, triggerHaptic } from '../utils/sound';
import { Volume2, Heart, AlertTriangle, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';

interface JellyRescueGameProps {
  questions: IdiomItem[];
  onFinishGame: (score: number, results: QuestionResult[]) => void;
  onExit: () => void;
}

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

export const JellyRescueGame: React.FC<JellyRescueGameProps> = ({
  questions,
  onFinishGame,
  onExit,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [mistakes, setMistakes] = useState(0); // 0, 1, or 2 (2 = dipped!)
  const [isResolved, setIsResolved] = useState(false); // question ended (either rescued or dipped)
  const [isSuccess, setIsSuccess] = useState(false);

  const currentIdiom = questions[currentIdx];

  // Letters needed in idiom (normalized uppercase, excluding spaces/punctuation)
  const cleanIdiom = currentIdiom.idiom.toUpperCase();
  const uniqueLetters = Array.from(new Set(cleanIdiom.replace(/[^A-Z]/g, '')));

  // Check if all letters have been revealed
  const isWordFullyGuessed = uniqueLetters.every((letter) => guessedLetters.has(letter));

  // Handle letter guess
  const handleGuessLetter = useCallback(
    (letter: string) => {
      if (isResolved || guessedLetters.has(letter)) return;

      const upperLetter = letter.toUpperCase();
      const newGuessed = new Set(guessedLetters);
      newGuessed.add(upperLetter);
      setGuessedLetters(newGuessed);

      if (cleanIdiom.includes(upperLetter)) {
        // CORRECT GUESS!
        sounds.playCatchSuccess();
        triggerHaptic('light');

        // Check if word completed
        const completed = uniqueLetters.every((l) => newGuessed.has(l));
        if (completed) {
          // RESCUED!
          setIsResolved(true);
          setIsSuccess(true);
          sounds.playWordComplete();
          triggerHaptic('double');
          setScore((s) => s + 10);

          try {
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.6 },
              colors: ['#A855F7', '#EC4899', '#3B82F6', '#10B981'],
            });
          } catch {
            // fallback
          }

          const qResult: QuestionResult = {
            idiom: currentIdiom,
            isCorrect: true,
            mistakes,
          };
          setResults((prev) => [...prev, qResult]);
          speakIdiom(currentIdiom.idiom);
        }
      } else {
        // WRONG GUESS!
        const newMistakes = mistakes + 1;
        setMistakes(newMistakes);

        if (newMistakes === 1) {
          // Strike 1: Rope creaks, character gets scared
          sounds.playRopeCreak();
          triggerHaptic('medium');
        } else if (newMistakes >= 2) {
          // Strike 2: DIPPED IN JELLY!
          setIsResolved(true);
          setIsSuccess(false);
          sounds.playSplash();
          triggerHaptic('heavy');

          const qResult: QuestionResult = {
            idiom: currentIdiom,
            isCorrect: false,
            mistakes: 2,
          };
          setResults((prev) => [...prev, qResult]);
          speakIdiom(currentIdiom.idiom);
        }
      }
    },
    [isResolved, guessedLetters, cleanIdiom, uniqueLetters, mistakes, currentIdiom]
  );

  // Physical keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[a-zA-Z]$/.test(e.key)) {
        handleGuessLetter(e.key.toUpperCase());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleGuessLetter]);

  const handleNextQuestion = () => {
    const nextIdx = currentIdx + 1;
    if (nextIdx < questions.length) {
      setCurrentIdx(nextIdx);
      setGuessedLetters(new Set());
      setMistakes(0);
      setIsResolved(false);
      setIsSuccess(false);
    } else {
      // Completed all 5 questions
      onFinishGame(score, results);
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto h-[100dvh] flex flex-col justify-between overflow-hidden select-none bg-linear-to-b from-purple-50 via-slate-50 to-purple-100/60">
      {/* Top Header */}
      <header className="pt-3 px-4 pb-2 z-20 flex items-center justify-between border-b border-purple-200/50 bg-white/75 backdrop-blur-xs">
        {/* Left: Question index & Hearts (남은 기회: 하트 2개) */}
        <div className="flex items-center gap-2">
          <button
            onClick={onExit}
            className="text-xs text-slate-500 hover:text-slate-800 p-1.5 rounded-lg bg-slate-100 active:scale-95"
          >
            홈으로
          </button>
          <div className="bg-purple-100 text-purple-900 px-2 py-1 rounded-full text-xs font-bold border border-purple-200">
            {currentIdx + 1} / {questions.length}
          </div>

          {/* 2 Hearts Indicator */}
          <div className="flex items-center gap-1 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
            <Heart
              className={`w-3.5 h-3.5 transition-all ${
                mistakes >= 1 ? 'text-slate-300 fill-slate-200 scale-90' : 'text-red-500 fill-red-500 animate-pulse'
              }`}
            />
            <Heart
              className={`w-3.5 h-3.5 transition-all ${
                mistakes >= 2 ? 'text-slate-300 fill-slate-200 scale-90' : 'text-red-500 fill-red-500'
              }`}
            />
          </div>
        </div>

        {/* Mode Tag */}
        <div className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
          젤리탕 구출
        </div>

        {/* Score (오른쪽 위, +10점) */}
        <div className="flex items-center gap-1 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-extrabold shadow-xs">
          <span>{score}점</span>
        </div>
      </header>

      {/* Meaning text (숙어 뜻 텍스트 상단 중앙) */}
      <div className="px-4 pt-1 pb-1 text-center z-20">
        <div className="bg-white/90 shadow-sm border border-purple-200 rounded-2xl p-2.5 backdrop-blur-xs">
          <div className="text-[11px] font-bold text-purple-600 mb-0.5">이 뜻의 숙어를 완성하세요</div>
          <div className="text-base font-extrabold text-slate-900 leading-tight">
            "{currentIdiom.meaning}"
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            직역: <span className="italic">{currentIdiom.literalMeaning}</span>
          </div>
        </div>
      </div>

      {/* Middle Stage: Hanging Character & Bubbling Purple Jelly Pool */}
      <div className="relative flex-1 w-full flex flex-col items-center justify-center -my-2 overflow-hidden">
        <HangingJellyCharacter mistakes={mistakes} isSuccess={isSuccess} />

        {/* Status text badge */}
        <div className="mt-1">
          {mistakes === 0 && !isResolved && (
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-300">
              안전! 줄을 꽉 잡고 있어요
            </span>
          )}
          {mistakes === 1 && !isResolved && (
            <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-1 animate-bounce">
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              줄이 끊어지려고 해요! 남은 기회 1번
            </span>
          )}
          {mistakes >= 2 && (
            <span className="text-[11px] font-bold text-purple-900 bg-purple-200 px-2.5 py-0.5 rounded-full border border-purple-300">
              포도색 젤리탕에 풍덩 빠졌습니다! 🍇
            </span>
          )}
          {isSuccess && (
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
              성공! 안전하게 구출되었습니다! 🎉
            </span>
          )}
        </div>
      </div>

      {/* Idiom Letter Blank Slots */}
      <div className="px-4 py-2 text-center z-20">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 max-w-sm mx-auto">
          {cleanIdiom.split(' ').map((word, wordIdx) => (
            <div key={wordIdx} className="flex items-center gap-1">
              {word.split('').map((char, charIdx) => {
                const isGuessed = guessedLetters.has(char);
                const showChar = isGuessed || (isResolved && !isSuccess);
                const isMissedLetter = !isGuessed && isResolved && !isSuccess;

                return (
                  <div
                    key={charIdx}
                    className={`w-7 h-9 sm:w-8 sm:h-10 rounded-lg flex items-center justify-center font-black text-sm sm:text-base border transition-all ${
                      showChar
                        ? isMissedLetter
                          ? 'bg-red-50 text-red-600 border-red-300 animate-pulse'
                          : 'bg-white text-slate-900 border-purple-300 shadow-xs'
                        : 'bg-purple-100/70 border-b-3 border-purple-400 text-transparent'
                    }`}
                  >
                    {showChar ? char : '_'}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Alphabet Keyboard (화면 하단 [알파벳 키보드]) */}
      <div className="w-full px-2 pb-3 pt-1 z-20 bg-linear-to-t from-purple-100/90 to-transparent">
        <div className="max-w-md mx-auto space-y-1">
          {KEYBOARD_ROWS.map((row, rowIdx) => (
            <div key={rowIdx} className="flex justify-center gap-1">
              {row.map((letter) => {
                const isUsed = guessedLetters.has(letter);
                const isCorrect = isUsed && cleanIdiom.includes(letter);
                const isWrong = isUsed && !cleanIdiom.includes(letter);

                return (
                  <button
                    key={letter}
                    disabled={isUsed || isResolved}
                    onClick={() => handleGuessLetter(letter)}
                    className={`h-11 sm:h-12 min-w-[28px] sm:min-w-[34px] flex-1 max-w-[38px] rounded-xl font-extrabold text-xs sm:text-sm transition-all duration-150 flex items-center justify-center active:scale-92 cursor-pointer shadow-xs border ${
                      isCorrect
                        ? 'bg-emerald-500 text-white border-emerald-600 shadow-inner'
                        : isWrong
                        ? 'bg-slate-200 text-slate-400 border-slate-300 opacity-60'
                        : 'bg-white hover:bg-purple-50 text-slate-800 border-purple-200 active:bg-purple-200'
                    }`}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Resolution Overlay (When Dipped or Rescued) */}
      <AnimatePresence>
        {isResolved && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className={`absolute inset-x-4 bottom-16 z-30 rounded-3xl p-5 shadow-2xl border-2 flex flex-col items-center text-center backdrop-blur-xs ${
              isSuccess
                ? 'bg-white border-emerald-400'
                : 'bg-white border-purple-400'
            }`}
          >
            {/* Header icon */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center mb-1.5 ${
                isSuccess
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-purple-100 text-purple-700'
              }`}
            >
              {isSuccess ? <CheckCircle2 className="w-6 h-6" /> : <span className="text-xl">🍇</span>}
            </div>

            <div
              className={`text-xs font-bold mb-1 flex items-center gap-1 ${
                isSuccess ? 'text-emerald-600' : 'text-purple-700'
              }`}
            >
              {isSuccess ? (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  구출 성공! +10점 획득
                </>
              ) : (
                '젤리탕 풍덩! 정답 숙어를 확인하세요'
              )}
            </div>

            {/* Answer & Speaker Audio button */}
            <div className="flex items-center justify-center gap-2 mb-1">
              <h3 className="text-xl font-black text-slate-900">
                {currentIdiom.idiom}
              </h3>
              <button
                onClick={() => speakIdiom(currentIdiom.idiom)}
                className="p-1.5 rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                title="원어민 발음 듣기"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs font-bold text-slate-700 mb-1">
              "{currentIdiom.meaning}"
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 w-full text-left mb-3">
              <p className="text-[11px] font-semibold text-slate-800">
                💬 {currentIdiom.exampleEn}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {currentIdiom.exampleKo}
              </p>
            </div>

            <button
              onClick={handleNextQuestion}
              className={`w-full py-3 text-white rounded-2xl font-extrabold text-sm shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer ${
                isSuccess
                  ? 'bg-emerald-500 hover:bg-emerald-600'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              <span>
                {currentIdx + 1 >= questions.length ? '결과 확인하기' : '다음 문제'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
