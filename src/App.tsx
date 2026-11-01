import React, { useState } from 'react';
import { GameMode, IdiomCategory, IdiomItem, QuestionResult, GameSummary, MasteredIdiomRecord, GameLogRecord, StudentProfile } from './types';
import { getShuffledIdioms } from './data/idioms';
import { StartScreen } from './components/StartScreen';
import { WordCatchGame } from './components/WordCatchGame';
import { JellyRescueGame } from './components/JellyRescueGame';
import { ResultScreen } from './components/ResultScreen';
import { MasteredListModal } from './components/MasteredListModal';
import { GoogleSheetModal } from './components/GoogleSheetModal';
import { getMasteredIdiomRecords, saveMultipleMasteredIdioms } from './utils/masteryStorage';
import {
  getStudentProfile,
  saveStudentProfile,
  saveGameLog,
  sendGameLogToGoogleSheet,
  formatLocalTimestamp,
} from './utils/googleSheetService';

export default function App() {
  const [screen, setScreen] = useState<'start' | 'game' | 'result'>('start');
  const [mode, setMode] = useState<GameMode>('catch');
  const [category, setCategory] = useState<IdiomCategory>('all');
  const [questions, setQuestions] = useState<IdiomItem[]>([]);
  const [gameSummary, setGameSummary] = useState<GameSummary | null>(null);
  const [isMasteredModalOpen, setIsMasteredModalOpen] = useState(false);
  const [isGoogleSheetModalOpen, setIsGoogleSheetModalOpen] = useState(false);
  const [studentProfile, setStudentProfile] = useState<StudentProfile>(() => getStudentProfile());
  const [latestGameLog, setLatestGameLog] = useState<GameLogRecord | null>(null);

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
    const wrongCount = results.length - correctCount;
    const calculatedScore = correctCount * 10;
    // Compute tap frequency per sentence and overall average
    const sentenceTaps = results.map((r, idx) => ({
      sentenceIndex: idx + 1,
      idiom: r.idiom.idiom,
      meaning: r.idiom.meaning,
      taps: r.tapCount || 1,
      isCorrect: r.isCorrect,
    }));
    const totalTaps = sentenceTaps.reduce((sum, item) => sum + item.taps, 0);
    const averageTaps = results.length > 0 ? parseFloat((totalTaps / results.length).toFixed(1)) : 0;
    const sentenceTapsSummary = sentenceTaps
      .map((st) => `문장${st.sentenceIndex}(${st.taps}회)`)
      .join(', ');

    const summary: GameSummary = {
      mode,
      category,
      score: calculatedScore,
      maxScore,
      totalQuestions: questions.length,
      results,
      averageTaps,
      totalTaps,
    };

    // Save mastered idioms into persistent storage
    const correctIdiomIds = results
      .filter((r) => r.isCorrect)
      .map((r) => r.idiom.id);

    if (correctIdiomIds.length > 0) {
      saveMultipleMasteredIdioms(correctIdiomIds);
      setMasteredRecords(getMasteredIdiomRecords());
    }

    // Update play count and category scores
    const nextPlayCount = (studentProfile.playCount || 0) + 1;
    const nextCat1Score =
      mode === 'catch' ? calculatedScore : studentProfile.category1Score;
    const nextCat2Score =
      mode === 'jelly_rescue' ? calculatedScore : studentProfile.category2Score;

    const updatedProfile = saveStudentProfile({
      playCount: nextPlayCount,
      category1Score: nextCat1Score,
      category2Score: nextCat2Score,
    });
    setStudentProfile(updatedProfile);

    // Create log record for Google Sheets
    const displayName = updatedProfile.studentId
      ? `${updatedProfile.name} (${updatedProfile.studentId})`
      : updatedProfile.name;

    const logRecord: GameLogRecord = {
      id: `log_${Date.now()}`,
      timestamp: formatLocalTimestamp(),
      name: displayName,
      play_count: nextPlayCount,
      correct_count: correctCount,
      wrong_count: wrongCount,
      category1_score: nextCat1Score,
      category2_score: nextCat2Score,
      total_score: calculatedScore,
      game_mode: mode === 'catch' ? '단어 캐치 모드' : '젤리탕 구출 모드',
      total_taps: totalTaps,
      average_taps: averageTaps,
      sentence_taps: sentenceTaps,
      sentence_taps_summary: sentenceTapsSummary,
      syncedToGoogleSheet: false,
    };

    saveGameLog(logRecord);
    setLatestGameLog(logRecord);

    // Auto-dispatch to Google Sheet via NEXT_PUBLIC_GOOGLE_SCRIPT_URL
    const targetUrl = updatedProfile.gasWebAppUrl || undefined;
    sendGameLogToGoogleSheet(logRecord, targetUrl).then((res) => {
      setLatestGameLog((prev) =>
        prev
          ? {
              ...prev,
              syncedToGoogleSheet: res.success,
              syncError: res.success ? undefined : res.message,
            }
          : null
      );
    });

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
            onOpenGoogleSheetModal={() => setIsGoogleSheetModalOpen(true)}
            studentProfile={studentProfile}
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
            onOpenGoogleSheetModal={() => setIsGoogleSheetModalOpen(true)}
            latestGameLog={latestGameLog}
            studentProfile={studentProfile}
          />
        )}

        {/* Mastered Idioms List Modal */}
        <MasteredListModal
          isOpen={isMasteredModalOpen}
          onClose={() => setIsMasteredModalOpen(false)}
          masteredRecords={masteredRecords}
        />

        {/* Google Sheet & Apps Script Modal */}
        <GoogleSheetModal
          isOpen={isGoogleSheetModalOpen}
          onClose={() => setIsGoogleSheetModalOpen(false)}
          onProfileUpdated={(updated) => setStudentProfile(updated)}
        />
      </div>
    </main>
  );
}

