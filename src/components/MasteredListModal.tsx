import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IdiomCategory, IdiomItem, MasteredIdiomRecord } from '../types';
import { IDIOM_DATABASE } from '../data/idioms';
import { speakIdiom } from '../utils/sound';
import {
  BookOpen,
  Volume2,
  ChevronDown,
  ChevronUp,
  X,
  Search,
  CheckCircle2,
  Sparkles,
  Flame,
} from 'lucide-react';

interface MasteredListModalProps {
  isOpen: boolean;
  onClose: () => void;
  masteredRecords: Record<string, MasteredIdiomRecord>;
}

export const MasteredListModal: React.FC<MasteredListModalProps> = ({
  isOpen,
  onClose,
  masteredRecords,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<IdiomCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const masteredIds = new Set(Object.keys(masteredRecords));
  const totalMasteredCount = masteredIds.size;
  const totalTotalCount = IDIOM_DATABASE.length;

  // Filter mastered items
  const masteredItems = IDIOM_DATABASE.filter((item) => masteredIds.has(item.id)).filter(
    (item) => {
      if (selectedFilter !== 'all' && item.category !== selectedFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          item.idiom.toLowerCase().includes(query) ||
          item.meaning.toLowerCase().includes(query) ||
          item.exampleEn.toLowerCase().includes(query)
        );
      }
      return true;
    }
  );

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const categories: { id: IdiomCategory; label: string }[] = [
    { id: 'all', label: '전체' },
    { id: 'daily', label: '일상' },
    { id: 'business', label: '직장' },
    { id: 'social', label: '감정/관계' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-md h-[90dvh] max-h-[700px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-purple-100"
      >
        {/* Header */}
        <header className="p-4 bg-linear-to-r from-purple-700 to-violet-800 text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center text-lg shadow-inner">
              <BookOpen className="w-5 h-5 text-purple-100" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-extrabold tracking-tight">맞힌 숙어 단어장</h2>
                <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                  {totalMasteredCount} / {totalTotalCount}개
                </span>
              </div>
              <p className="text-[11px] text-purple-200">
                게임을 플레이하며 정답을 맞힌 모든 숙어 보관소
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white active:scale-95 transition-all cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Search Bar & Categories */}
        <div className="p-3 border-b border-slate-100 bg-slate-50/70 space-y-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="숙어 영어 또는 한국어 뜻 검색..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-purple-500 font-medium text-slate-800"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {categories.map((cat) => {
              const isSelected = selectedFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedFilter(cat.id)}
                  className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Idiom List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {totalMasteredCount === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-14 h-14 rounded-full bg-purple-50 text-purple-400 flex items-center justify-center mb-3">
                <Sparkles className="w-7 h-7" />
              </div>
              <p className="font-bold text-sm text-slate-700 mb-1">아직 맞힌 숙어가 없습니다</p>
              <p className="text-xs text-slate-500 max-w-xs">
                단어 캐치 모드나 젤리탕 구출 모드를 클리어하면 정답 숙어가 이곳에 자동으로 영구 저장됩니다!
              </p>
            </div>
          ) : masteredItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <p className="text-xs text-slate-500">검색 또는 선택한 카테고리에 해당하는 숙어가 없습니다.</p>
            </div>
          ) : (
            masteredItems.map((item) => {
              const isExpanded = expandedId === item.id;
              const rec = masteredRecords[item.id];
              const masteredCount = rec ? rec.timesMastered : 1;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-3 border border-purple-100 shadow-xs hover:border-purple-200 transition-all text-left"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-sm text-slate-900 tracking-tight">
                          {item.idiom}
                        </span>
                        <span className="inline-flex items-center gap-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black px-1.5 py-0.2 rounded-md">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          정답
                        </span>
                        {masteredCount > 1 && (
                          <span className="inline-flex items-center gap-0.5 bg-orange-100 text-orange-800 text-[10px] font-black px-1.5 py-0.2 rounded-md">
                            <Flame className="w-3 h-3 text-orange-500" />
                            {masteredCount}회 마스터
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-semibold text-purple-700 mt-0.5">
                        {item.meaning}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        직역: {item.literalMeaning}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => speakIdiom(item.idiom)}
                        className="p-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors cursor-pointer"
                        title="원어민 발음 듣기"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => toggleExpand(item.id)}
                        className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
                        title="예문 및 상세 보기"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Collapsible Example & Nuance */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-1.5 overflow-hidden"
                      >
                        {/* Nuance */}
                        <div className="text-[11px] text-amber-900 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200/70">
                          💡 <span className="font-bold">어원 및 뉘앙스:</span> {item.nuanceTip}
                        </div>

                        {/* Real-world Example (Requested by user) */}
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                            <span>💬 실전 예문:</span>
                          </div>
                          <div className="text-xs font-semibold text-purple-900 mt-0.5">
                            "{item.exampleEn}"
                          </div>
                          <div className="text-[11px] text-slate-600 mt-0.5">
                            {item.exampleKo}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <footer className="p-3 bg-white border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            전체 <strong>{totalTotalCount}개</strong> 중 <strong>{totalMasteredCount}개</strong> 마스터
          </span>
          <button
            onClick={onClose}
            className="py-1.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all cursor-pointer"
          >
            닫기
          </button>
        </footer>
      </motion.div>
    </div>
  );
};
