import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { IdiomItem, QuestionResult } from '../types';
import { BasketCharacter } from './CharacterGraphics';
import { sounds, speakIdiom, triggerHaptic } from '../utils/sound';
import { Volume2, ChevronLeft, ChevronRight, Sparkles, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

interface WordCatchGameProps {
  questions: IdiomItem[];
  onFinishGame: (score: number, results: QuestionResult[]) => void;
  onExit: () => void;
}

interface FallingWord {
  id: number;
  text: string;
  x: number; // 10 to 85 percent
  y: number; // 0 to 100 percent
  speed: number;
  isTarget: boolean;
}

export const WordCatchGame: React.FC<WordCatchGameProps> = ({
  questions,
  onFinishGame,
  onExit,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [targetWordIdx, setTargetWordIdx] = useState(0);
  const [basketX, setBasketX] = useState(50); // percentage 10% - 90%
  const [isCatching, setIsCatching] = useState(false);
  const [isStumbling, setIsStumbling] = useState(false);
  const [fallingWords, setFallingWords] = useState<FallingWord[]>([]);
  const [isQuestionSolved, setIsQuestionSolved] = useState(false);
  const [isQuestionFailed, setIsQuestionFailed] = useState(false);
  const [wrongWordCaught, setWrongWordCaught] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const nextWordIdRef = useRef(1);
  const spawnTimerRef = useRef(0);

  const currentIdiom = questions[currentIdx];

  // Spawn words loop
  const spawnWord = useCallback(() => {
    if (!currentIdiom || isQuestionSolved || isQuestionFailed) return;

    const neededWord = currentIdiom.words[targetWordIdx];
    // Bias spawn towards the needed word 60% of the time, or distractor/future word
    const isTarget = Math.random() < 0.6;
    let wordText = neededWord;

    if (!isTarget) {
      const candidates = [
        ...currentIdiom.distractors,
        ...currentIdiom.words.filter((_, idx) => idx !== targetWordIdx),
      ];
      if (candidates.length > 0) {
        wordText = candidates[Math.floor(Math.random() * candidates.length)];
      }
    }

    const newWord: FallingWord = {
      id: nextWordIdRef.current++,
      text: wordText,
      x: 15 + Math.random() * 70, // 15% to 85%
      y: 4,
      speed: 0.35 + Math.random() * 0.25, // percentage per frame
      isTarget: wordText === neededWord,
    };

    setFallingWords((prev) => {
      // Cap at 4 falling words simultaneously to keep it fun and clean on mobile
      if (prev.length >= 4) return prev;
      return [...prev, newWord];
    });
  }, [currentIdiom, targetWordIdx, isQuestionSolved, isQuestionFailed]);

  // Main game tick: update positions and detect collision
  useEffect(() => {
    if (isQuestionSolved || isQuestionFailed) return;

    let lastTime = performance.now();

    const gameLoop = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;

      // Spawn check roughly every 1.35 seconds
      spawnTimerRef.current += delta;
      if (spawnTimerRef.current > 1350) {
        spawnTimerRef.current = 0;
        spawnWord();
      }

      setFallingWords((prev) => {
        const nextWords: FallingWord[] = [];

        for (const item of prev) {
          const nextY = item.y + item.speed * (delta / 16.6);

          // Collision check with basket
          // Basket vertical catchment zone: ~72% to 86%
          const isAtBasketHeight = nextY >= 72 && nextY <= 86;
          const isHorizontallyAligned = Math.abs(item.x - basketX) <= 15;

          if (isAtBasketHeight && isHorizontallyAligned) {
            // Check if correct word
            const expectedWord = currentIdiom.words[targetWordIdx];
            if (item.text === expectedWord) {
              // CORRECT CATCH!
              sounds.playCatchSuccess();
              triggerHaptic('light');
              setIsCatching(true);
              setTimeout(() => setIsCatching(false), 300);

              const nextTarget = targetWordIdx + 1;
              setTargetWordIdx(nextTarget);

              if (nextTarget >= currentIdiom.words.length) {
                // Completed idiom correctly!
                handleIdiomCompleted();
              }
              // Word is caught -> do not keep in falling list
              continue;
            } else {
              // WRONG WORD CAUGHT! Once caught, question immediately fails (0 points)
              sounds.playWrong();
              triggerHaptic('heavy');
              setIsStumbling(true);
              setTimeout(() => setIsStumbling(false), 500);

              handleIdiomFailed(item.text);
              return [];
            }
          }

          // If reached bottom without being caught
          if (nextY > 94) {
            continue;
          }

          nextWords.push({ ...item, y: nextY });
        }

        return nextWords;
      });

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [basketX, currentIdiom, targetWordIdx, isQuestionSolved, isQuestionFailed, spawnWord]);

  // Handle entire idiom completed successfully (0 wrong catches)
  const handleIdiomCompleted = () => {
    setIsQuestionSolved(true);
    sounds.playWordComplete();
    triggerHaptic('double');

    // Confetti effect
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#F59E0B', '#8B5CF6', '#10B981', '#EC4899'],
      });
    } catch {
      // confetti fallback
    }

    const addedScore = 10;
    setScore((s) => s + addedScore);

    const questionResult: QuestionResult = {
      idiom: currentIdiom,
      isCorrect: true,
      mistakes: 0,
    };

    const updatedResults = [...results, questionResult];
    setResults(updatedResults);

    // Speak audio
    speakIdiom(currentIdiom.idiom);
  };

  // Handle wrong word caught -> mark as incorrect (0 points)
  const handleIdiomFailed = (caughtWord: string) => {
    setIsQuestionFailed(true);
    setWrongWordCaught(caughtWord);

    const questionResult: QuestionResult = {
      idiom: currentIdiom,
      isCorrect: false,
      mistakes: 1,
    };

    const updatedResults = [...results, questionResult];
    setResults(updatedResults);

    // Speak audio
    speakIdiom(currentIdiom.idiom);
  };

  const handleNextQuestion = () => {
    const nextIdx = currentIdx + 1;
    if (nextIdx < questions.length) {
      setCurrentIdx(nextIdx);
      setTargetWordIdx(0);
      setFallingWords([]);
      setIsQuestionSolved(false);
      setIsQuestionFailed(false);
      setWrongWordCaught(null);
    } else {
      // Finished all questions!
      const finalResults = results;
      const finalScore = finalResults.filter((r) => r.isCorrect).length * 10;
      onFinishGame(finalScore, finalResults);
    }
  };

  // Keyboard navigation (ArrowLeft/ArrowRight, A/D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        setBasketX((prev) => Math.max(15, prev - 8));
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        setBasketX((prev) => Math.min(85, prev + 8));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Touch & Pointer move handling on the stage
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current || isQuestionSolved || isQuestionFailed) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX;
    const relativeX = clientX - rect.left;
    const percentage = (relativeX / rect.width) * 100;
    setBasketX(Math.max(15, Math.min(85, percentage)));
  };

  const moveBasketBy = (delta: number) => {
    setBasketX((prev) => Math.max(15, Math.min(85, prev + delta)));
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      className="relative w-full max-w-md mx-auto h-[100dvh] flex flex-col justify-between overflow-hidden select-none bg-linear-to-b from-sky-50 via-amber-50/40 to-orange-100/60 touch-none"
    >
      {/* Top Header */}
      <header className="pt-3 px-4 pb-2 z-20 flex items-center justify-between border-b border-amber-200/50 bg-white/70 backdrop-blur-xs">
        {/* Question Index (1/5 형식, 왼쪽 위) */}
        <div className="flex items-center gap-2">
          <button
            onClick={onExit}
            className="text-xs text-slate-500 hover:text-slate-800 p-1.5 rounded-lg bg-slate-100 active:scale-95"
          >
            홈으로
          </button>
          <div className="bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full text-xs font-bold border border-amber-200">
            문제 {currentIdx + 1} / {questions.length}
          </div>
        </div>

        {/* Mode Tag */}
        <div className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
          단어 캐치
        </div>

        {/* Score (오른쪽 위, +10점) */}
        <div className="flex items-center gap-1.5 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-extrabold shadow-xs">
          <span>{score}점</span>
        </div>
      </header>

      {/* Meaning & Target Word Slots */}
      <div className="px-4 py-2 text-center z-20">
        {/* 숙어 뜻 텍스트(상단 중앙) */}
        <div className="bg-white/90 shadow-sm border border-amber-200 rounded-2xl p-3 backdrop-blur-xs">
          <div className="text-[11px] font-bold text-amber-700 mb-0.5">
            순서대로 단어를 담으세요! (틀린 단어 1번 담으면 오답)
          </div>
          <div className="text-base font-extrabold text-slate-900 leading-tight">
            "{currentIdiom.meaning}"
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            직역: <span className="italic">{currentIdiom.literalMeaning}</span>
          </div>

          {/* Sequential word slots to fill */}
          <div className="flex items-center justify-center gap-1.5 mt-2.5 flex-wrap">
            {currentIdiom.words.map((word, idx) => {
              const isFilled = idx < targetWordIdx;
              const isCurrent = idx === targetWordIdx;

              return (
                <div
                  key={idx}
                  className={`px-3 py-1 rounded-xl text-xs font-extrabold border transition-all duration-200 ${
                    isFilled
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs scale-105'
                      : isCurrent
                      ? 'bg-amber-100 text-amber-900 border-amber-400 animate-pulse border-2 shadow-xs'
                      : 'bg-slate-100 text-slate-400 border-slate-200'
                  }`}
                >
                  {isFilled ? word : isCurrent ? `다음: ?` : '...'}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sky Game Playfield (Words fall here) */}
      <div className="relative flex-1 w-full overflow-hidden">
        {/* Clouds decoration in sky */}
        <div className="absolute top-2 left-4 text-slate-300/60 text-2xl select-none pointer-events-none">☁️</div>
        <div className="absolute top-10 right-6 text-slate-300/60 text-3xl select-none pointer-events-none">☁️</div>

        {/* Falling Words */}
        <AnimatePresence>
          {fallingWords.map((item) => {
            const isTarget = item.text === currentIdiom.words[targetWordIdx];

            return (
              <div
                key={item.id}
                className="absolute transform -translate-x-1/2 pointer-events-none select-none z-10"
                style={{
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                }}
              >
                <div
                  className={`px-3.5 py-1.5 rounded-full text-xs font-black shadow-md border flex items-center gap-1 ${
                    isTarget
                      ? 'bg-amber-400 text-amber-950 border-amber-500'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  <span>{item.text}</span>
                </div>
              </div>
            );
          })}
        </AnimatePresence>

        {/* Basket Character at bottom */}
        <BasketCharacter
          positionXPercent={basketX}
          isCatching={isCatching}
          isStumbling={isStumbling}
        />
      </div>

      {/* Bottom Controls Bar (Touch arrows for easy one-handed mobile play) */}
      <div className="w-full px-4 pb-4 pt-2 z-20 bg-linear-to-t from-amber-100/90 to-transparent">
        <div className="flex items-center justify-between gap-3 max-w-xs mx-auto">
          <button
            onPointerDown={() => moveBasketBy(-12)}
            className="flex-1 py-3 rounded-2xl bg-white border border-amber-300 shadow-sm text-amber-800 font-extrabold flex items-center justify-center gap-1 active:scale-95 active:bg-amber-50 transition-transform cursor-pointer"
            aria-label="왼쪽으로 이동"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-xs">왼쪽</span>
          </button>

          <div className="text-[10px] text-amber-800 font-bold px-2 py-1 bg-amber-200/60 rounded-lg whitespace-nowrap">
            화면 드래그 & 터치
          </div>

          <button
            onPointerDown={() => moveBasketBy(12)}
            className="flex-1 py-3 rounded-2xl bg-white border border-amber-300 shadow-sm text-amber-800 font-extrabold flex items-center justify-center gap-1 active:scale-95 active:bg-amber-50 transition-transform cursor-pointer"
            aria-label="오른쪽으로 이동"
          >
            <span className="text-xs">오른쪽</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Completion or Failure Modal Overlay */}
      <AnimatePresence>
        {(isQuestionSolved || isQuestionFailed) && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`absolute inset-x-4 bottom-16 z-30 bg-white rounded-3xl p-5 shadow-2xl border-2 flex flex-col items-center text-center ${
              isQuestionSolved ? 'border-emerald-400' : 'border-red-400'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 shadow-xs ${
                isQuestionSolved
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-red-100 text-red-600'
              }`}
            >
              {isQuestionSolved ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <XCircle className="w-6 h-6" />
              )}
            </div>

            <div
              className={`text-xs font-bold mb-1 flex items-center gap-1 ${
                isQuestionSolved ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {isQuestionSolved ? (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  숙어 완성! +10점
                </>
              ) : (
                <>
                  <span>오답! 틀린 단어('{wrongWordCaught}')를 담았습니다 (0점)</span>
                </>
              )}
            </div>

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

            <p className="text-xs font-bold text-slate-700 mb-2">
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
              className={`w-full py-3 rounded-2xl font-extrabold text-sm shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer ${
                isQuestionSolved
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              <span>
                {currentIdx + 1 >= questions.length ? '결과 보기' : '다음 문제'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
