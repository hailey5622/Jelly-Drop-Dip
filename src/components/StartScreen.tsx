import React from 'react';
import { motion } from 'motion/react';
import { GameMode, IdiomCategory } from '../types';
import { StartScreenHero } from './CharacterGraphics';
import { Volume2, VolumeX, Sparkles, Trophy, ArrowRight, BookOpen } from 'lucide-react';
import { sounds } from '../utils/sound';

interface StartScreenProps {
  onStartGame: (mode: GameMode, category: IdiomCategory) => void;
  selectedCategory: IdiomCategory;
  onSelectCategory: (cat: IdiomCategory) => void;
  highScore: number;
  masteredCount: number;
  onOpenMasteredList: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onStartGame,
  selectedCategory,
  onSelectCategory,
  highScore,
  masteredCount,
  onOpenMasteredList,
}) => {
  const [muted, setMuted] = React.useState(sounds.getMuted());

  const handleToggleMute = () => {
    const isNowMuted = sounds.toggleMute();
    setMuted(isNowMuted);
  };

  const categories: { id: IdiomCategory; label: string; icon: string }[] = [
    { id: 'all', label: '전체 모음', icon: '✨' },
    { id: 'daily', label: '일상 회화', icon: '☕' },
    { id: 'business', label: '직장/오피스', icon: '💼' },
    { id: 'social', label: '감정/관계', icon: '💬' },
  ];

  return (
    <div className="flex flex-col items-center justify-between min-h-[100dvh] w-full max-w-md mx-auto p-4 select-none relative z-10">
      {/* Top Bar: High Score, Mastered List Button & Sound */}
      <header className="w-full flex items-center justify-between pt-2 pb-1 px-1">
        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold text-amber-900 shadow-xs">
          <Trophy className="w-3.5 h-3.5 text-amber-600" />
          <span>최고 점수:</span>
          <span className="text-amber-700 font-extrabold">{highScore}점</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Mastered Idioms List Button */}
          <button
            onClick={onOpenMasteredList}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
            title="한 번 맞힌 숙어 리스트 보기"
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-600" />
            <span>맞힌 숙어</span>
            <span className="bg-purple-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
              {masteredCount}
            </span>
          </button>

          <button
            onClick={handleToggleMute}
            className="p-2 rounded-full bg-white/90 border border-purple-100 text-purple-700 shadow-xs hover:bg-purple-50 active:scale-95 transition-all cursor-pointer"
            title={muted ? '소리 켜기' : '소리 끄기'}
            aria-label={muted ? '소리 켜기' : '소리 끄기'}
          >
            {muted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-purple-600" />}
          </button>
        </div>
      </header>

      {/* Main Title & Hero Graphic */}
      <div className="flex flex-col items-center text-center my-auto w-full">
        {/* Title Header */}
        <div className="mb-2">
          <div className="inline-flex items-center gap-1 bg-purple-100/90 text-purple-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full mb-1 border border-purple-200">
            <Sparkles className="w-3 h-3 text-purple-600" />
            2030 원어민 회화 필수 관용구
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center gap-1">
            <span className="text-violet-600">Idiom</span>
            <span className="text-amber-500">Drop</span>
            <span className="text-slate-400 font-normal">&</span>
            <span className="text-purple-600">Dip</span>
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            직역하면 모르는 원어민 숙어! 미니게임 5판으로 완벽 정복
          </p>
        </div>

        {/* Character Graphic: Waiting on swing above purple jelly pool */}
        <div className="my-1">
          <StartScreenHero size={180} />
        </div>

        {/* Theme / Category Selector */}
        <div className="w-full mt-2 mb-4">
          <div className="text-[11px] font-bold text-slate-500 mb-1.5 text-left px-1 flex items-center justify-between">
            <span>테마 선택 (5문제)</span>
            <span className="text-[10px] text-purple-600 font-normal">CEFR B1-B2 레벨</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`py-2 px-1 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all border ${
                    isSelected
                      ? 'bg-purple-600 text-white border-purple-700 shadow-sm scale-102'
                      : 'bg-white/80 text-slate-700 border-slate-200 hover:bg-slate-50 active:scale-98'
                  }`}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span className="text-[11px] whitespace-nowrap">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Game Mode Selection Buttons (PRD: Catch mode top, Jelly Dip mode bottom) */}
        <div className="w-full space-y-2.5">
          {/* 1. 단어 캐치 모드 버튼 */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              sounds.playCatchSuccess();
              onStartGame('catch', selectedCategory);
            }}
            className="w-full bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white p-4 rounded-2xl shadow-md border border-amber-400/40 text-left relative overflow-hidden group cursor-pointer"
          >
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-2xl shadow-inner">
                  🧺
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-base tracking-tight">단어 캐치 모드</span>
                    <span className="bg-amber-700/60 text-amber-100 text-[10px] font-bold px-1.5 py-0.5 rounded-full">순발력</span>
                  </div>
                  <p className="text-[11px] text-amber-100/90 mt-0.5">
                    하늘에서 떨어지는 단어를 순서대로 바구니에 쏙!
                  </p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white group-hover:translate-x-1 transition-transform">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </motion.button>

          {/* 2. 젤리탕 구출 모드 버튼 */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              sounds.playSplash();
              onStartGame('jelly_rescue', selectedCategory);
            }}
            className="w-full bg-linear-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 text-white p-4 rounded-2xl shadow-md border border-purple-400/40 text-left relative overflow-hidden group cursor-pointer"
          >
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-2xl shadow-inner">
                  🍇
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-base tracking-tight">젤리탕 구출 모드</span>
                    <span className="bg-purple-950/60 text-purple-200 text-[10px] font-bold px-1.5 py-0.5 rounded-full">행맨 타이핑</span>
                  </div>
                  <p className="text-[11px] text-purple-200/90 mt-0.5">
                    2번 오타 시 보라색 젤리탕에 풍덩 빠져요!
                  </p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white group-hover:translate-x-1 transition-transform">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </motion.button>
        </div>
      </div>

      {/* Footer Info */}
      <footer className="w-full text-center py-2 text-[11px] text-slate-500 flex items-center justify-center gap-2">
        <span>출퇴근길 5분 완성</span>
        <span>•</span>
        <span>오답 복습 & 원어민 발음 지원</span>
      </footer>
    </div>
  );
};
