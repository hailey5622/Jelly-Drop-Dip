import React, { useState, useEffect, useRef } from 'react';
import {
  GameMode,
  IdiomCategory,
  IdiomItem,
  QuestionResult,
  GameSummary,
  MasteredIdiomRecord,
  GameLogRecord,
  StudentProfile,
  SheetGamePayload,
} from './types';
import { getShuffledIdioms } from './data/idioms';
import { StartScreen } from './components/StartScreen';
import { WordCatchGame } from './components/WordCatchGame';
import { JellyRescueGame } from './components/JellyRescueGame';
import { ResultScreen } from './components/ResultScreen';
import { MasteredListModal } from './components/MasteredListModal';
import { NicknameModal } from './components/NicknameModal';
import { SettingsModal } from './components/SettingsModal';
import { getMasteredIdiomRecords, saveMultipleMasteredIdioms } from './utils/masteryStorage';
import {
  getStudentProfile,
  saveStudentProfile,
  saveGameLog,
  formatLocalTimestamp,
} from './utils/gameStorage';
import { sendGameRecordToSheet } from './utils/googleSheetService';

export default function App() {
  const [screen, setScreen] = useState<'start' | 'game' | 'result'>('start');
  const [mode, setMode] = useState<GameMode>('catch');
  const [category, setCategory] = useState<IdiomCategory>('all');
  const [questions, setQuestions] = useState<IdiomItem[]>([]);
  const [gameSummary, setGameSummary] = useState<GameSummary | null>(null);

  // Modals
  const [isMasteredModalOpen, setIsMasteredModalOpen] = useState(false);
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Student Profile & Game Logs
  const [studentProfile, setStudentProfile] = useState<StudentProfile>(() => getStudentProfile());
  const [latestGameLog, setLatestGameLog] = useState<GameLogRecord | null>(null);

  // Google Sheets Sync Status
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);
  const [sheetSyncSuccess, setSheetSyncSuccess] = useState<boolean | null>(null);
  const [sheetSyncMessage, setSheetSyncMessage] = useState<string | null>(null);
  const lastSheetPayloadRef = useRef<SheetGamePayload | null>(null);

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

  // Prompt nickname on first load if not set
  useEffect(() => {
    if (!studentProfile.name || !studentProfile.name.trim()) {
      setIsNicknameModalOpen(true);
    }
  }, []);

  // Save nickname handler
  const handleSaveNickname = (nickname: string) => {
    const trimmed = nickname.trim();
    if (!trimmed) return;
    const updated = saveStudentProfile({ name: trimmed });
    setStudentProfile(updated);
    setIsNicknameModalOpen(false);
  };

  // Start new game session (guarded by nickname check)
  const handleStartGame = (selectedMode: GameMode, selectedCat: IdiomCategory) => {
    if (!studentProfile.name || !studentProfile.name.trim()) {
      setIsNicknameModalOpen(true);
      return;
    }
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

    // Calculate actual score from the game session (never arbitrarily 0 or assumed 100)
    const calculatedScore =
      typeof _finalScore === 'number' && !isNaN(_finalScore) && _finalScore >= 0
        ? _finalScore
        : correctCount * 10;

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
    // 단어 캐치 모드(mode === 'catch') -> idiomdropscore (category1Score)
    // 젤리탕 구출 모드(mode === 'jelly_rescue') -> jellydipscore (category2Score)
    // 게임을 플레이하지 않은 모드의 점수는 기존 기록을 유지!
    const nextPlayCount = (studentProfile.playCount || 0) + 1;
    const isCatch = mode === 'catch';
    const isJelly = mode === 'jelly_rescue';
    const nextCat1Score = isCatch ? calculatedScore : (studentProfile.category1Score || 0);
    const nextCat2Score = isJelly ? calculatedScore : (studentProfile.category2Score || 0);

    const updatedProfile = saveStudentProfile({
      playCount: nextPlayCount,
      category1Score: nextCat1Score,
      category2Score: nextCat2Score,
    });
    setStudentProfile(updatedProfile);

    // Create log record for local storage
    const logRecord: GameLogRecord = {
      id: `log_${Date.now()}`,
      timestamp: formatLocalTimestamp(),
      name: updatedProfile.name.trim(),
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
    };

    saveGameLog(logRecord);
    setLatestGameLog(logRecord);

    // Build 4-column payload for Google Sheets (GameLogs)
    const sheetPayload: SheetGamePayload = {
      name: updatedProfile.name.trim(),
      playcount: nextPlayCount,
      jellydipscore: nextCat2Score,
      idiomdropscore: nextCat1Score,
      mode,
      score: calculatedScore,
      game_id: `game_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      is_test: false,
    };
    lastSheetPayloadRef.current = sheetPayload;

    // Automatic dispatch to Google Sheets
    setIsSyncingSheet(true);
    setSheetSyncSuccess(null);
    setSheetSyncMessage(null);

    sendGameRecordToSheet(sheetPayload)
      .then((res) => {
        setIsSyncingSheet(false);
        setSheetSyncSuccess(res.success);
        setSheetSyncMessage(res.message);
      })
      .catch((err) => {
        setIsSyncingSheet(false);
        setSheetSyncSuccess(false);
        setSheetSyncMessage(String(err));
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

  // Retry Google Sheets sync manually if failed
  const handleRetrySheetSync = () => {
    if (!lastSheetPayloadRef.current) return;
    setIsSyncingSheet(true);
    setSheetSyncSuccess(null);
    setSheetSyncMessage(null);

    sendGameRecordToSheet(lastSheetPayloadRef.current)
      .then((res) => {
        setIsSyncingSheet(false);
        setSheetSyncSuccess(res.success);
        setSheetSyncMessage(res.message);
      })
      .catch((err) => {
        setIsSyncingSheet(false);
        setSheetSyncSuccess(false);
        setSheetSyncMessage(String(err));
      });
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
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            onOpenNicknameModal={() => setIsNicknameModalOpen(true)}
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
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            latestGameLog={latestGameLog}
            studentProfile={studentProfile}
            isSyncingSheet={isSyncingSheet}
            sheetSyncSuccess={sheetSyncSuccess}
            sheetSyncMessage={sheetSyncMessage}
            onRetrySheetSync={handleRetrySheetSync}
          />
        )}

        {/* Mastered Idioms List Modal */}
        <MasteredListModal
          isOpen={isMasteredModalOpen}
          onClose={() => setIsMasteredModalOpen(false)}
          masteredRecords={masteredRecords}
        />

        {/* Nickname Input Modal */}
        <NicknameModal
          isOpen={isNicknameModalOpen}
          currentNickname={studentProfile.name}
          onSaveNickname={handleSaveNickname}
          canClose={Boolean(studentProfile.name && studentProfile.name.trim())}
          onClose={() => setIsNicknameModalOpen(false)}
        />

        {/* Settings & Google Sheets Modal */}
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          studentProfile={studentProfile}
          onOpenNicknameModal={() => setIsNicknameModalOpen(true)}
          onProfileUpdated={(updated) => setStudentProfile(updated)}
        />
      </div>
    </main>
  );
}
