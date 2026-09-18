import React, { useState, useEffect } from 'react';
import { GameMode, IdiomCategory, IdiomItem, QuestionResult, GameSummary, MasteredIdiomRecord } from './types';
import { getShuffledIdioms } from './data/idioms';
import { StartScreen } from './components/StartScreen';
import { WordCatchGame } from './components/WordCatchGame';
import { JellyRescueGame } from './components/JellyRescueGame';
import { ResultScreen } from './components/ResultScreen';
import { MasteredListModal } from './components/MasteredListModal';
import { getMasteredIdiomRecords, saveMultipleMasteredIdioms } from './utils/masteryStorage';

export default function App() {
  const [screen, setScreen] = useState<'start' | 'game' | 'result'>('start');
  const [mode, setMode] = useState<GameMode>('catch');
  const [category, setCategory] = useState<IdiomCategory>('all');
  const [questions, setQuestions] = useState<IdiomItem[]>([]);
  const [gameSummary, setGameSummary] = useState<GameSummary | null>(null);
  const [isMasteredModalOpen, setIsMasteredModalOpen] = useState(false);
  const [masteredRecords, setMasteredRecords] = useState<Record<string, MasteredIdiomRecord>>(() => {
    return getMasteredIdiomRecords();
  });
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('idiom_drop_dip_highscore');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  // Start new game session
  const handleStartGame = (selectedMode: GameMode, selectedCat: IdiomCategory) => {
    const selectedQuestions = getShuffledIdioms(selectedCat, 5);
    setMode(selectedMode);
    setCategory(selectedCat);
    setQuestions(selectedQuestions);
    setScreen('game');
  };

  // Complete game session
  const handleFinishGame = (_finalScore: number, results: QuestionResult[]) => {
    const maxScore = questions.length * 10;
    const correctCount = results.filter((r) => r.isCorrect).length;
    const calculatedScore = correctCount * 10;
    const summary: GameSummary = {
      mode,
      category,
      score: calculatedScore,
      maxScore,
      totalQuestions: questions.length,
      results,
    };

    // Save mastered idioms into persistent storage
    const correctIdiomIds = results
      .filter((r) => r.isCorrect)
      .map((r) => r.idiom.id);

    if (correctIdiomIds.length > 0) {
      saveMultipleMasteredIdioms(correctIdiomIds);
      setMasteredRecords(getMasteredIdiomRecords());
    }

    setGameSummary(summary);
    if (calculatedScore > highScore) {
      setHighScore(calculatedScore);
      try {
        localStorage.setItem('idiom_drop_dip_highscore', calculatedScore.toString());
      } catch {
        // ignore
      }
    }
    setScreen('result');
  };

  // Retry with same mode & category
  const handleRetry = () => {
    handleStartGame(mode, category);
  };

  // Back to home start screen
  const handleHome = () => {
    setScreen('start');
  };

  const masteredCount = Object.keys(masteredRecords).length;

  return (
    <main className="min-h-[100dvh] w-full bg-slate-100 flex items-center justify-center p-0 font-sans antialiased">
      {/* Smartphone vertical screen wrapper (max-w-md, full height on mobile) */}
      <div className="w-full max-w-md h-[100dvh] bg-white shadow-xl overflow-hidden relative flex flex-col">
        {screen === 'start' && (
          <StartScreen
            onStartGame={handleStartGame}
            selectedCategory={category}
            onSelectCategory={setCategory}
            highScore={highScore}
            masteredCount={masteredCount}
            onOpenMasteredList={() => setIsMasteredModalOpen(true)}
          />
        )}

        {screen === 'game' && mode === 'catch' && (
          <WordCatchGame
            questions={questions}
            onFinishGame={handleFinishGame}
            onExit={handleHome}
          />
        )}

        {screen === 'game' && mode === 'jelly_rescue' && (
          <JellyRescueGame
            questions={questions}
            onFinishGame={handleFinishGame}
            onExit={handleHome}
          />
        )}

        {screen === 'result' && gameSummary && (
          <ResultScreen
            summary={gameSummary}
            onRetry={handleRetry}
            onHome={handleHome}
            onOpenMasteredList={() => setIsMasteredModalOpen(true)}
          />
        )}

        {/* Mastered Idioms List Modal */}
        <MasteredListModal
          isOpen={isMasteredModalOpen}
          onClose={() => setIsMasteredModalOpen(false)}
          masteredRecords={masteredRecords}
        />
      </div>
    </main>
  );
}

