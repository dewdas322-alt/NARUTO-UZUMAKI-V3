import React, { useEffect, useState, useRef, useCallback } from 'react';
import { GameType, LotteryIssue, PredictionData, HistoryRecord } from './types';
import { GAMES, BET_LEVELS, calculatePrediction, determineActualSize } from './utils/lotteryEngine';
import { fetchLotteryIssues } from './services/lotteryApi';
import { soundManager } from './utils/soundEffects';
import { Header } from './components/Header';
import { GameSelector } from './components/GameSelector';
import { PredictionCard } from './components/PredictionCard';
import { HistoryTable } from './components/HistoryTable';
import { DataTunnelModal } from './components/DataTunnelModal';
import { WingoGateModal } from './components/WingoGateModal';
import { BottomNavBar, TabType } from './components/BottomNavBar';
import { EngineAnalysisView } from './components/EngineAnalysisView';
import { InAppWebView } from './components/InAppWebView';

export default function App() {
  // Gate state: Starts strictly from 0 on every open, reopen, or restart!
  const [hasChosenGame, setHasChosenGame] = useState<boolean>(false);
  const [selectedGame, setSelectedGame] = useState<GameType>('WINGO_1M');
  const [currentTab, setCurrentTab] = useState<TabType>('predict');

  // Fresh clean state: zero previous data
  const [issues, setIssues] = useState<LotteryIssue[]>([]);
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [currentLevel, setCurrentLevel] = useState<number>(0);
  const [winCount, setWinCount] = useState<number>(0);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(60);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [latencyMs, setLatencyMs] = useState<number>(36);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showInspector, setShowInspector] = useState<boolean>(false);
  const [customUrl, setCustomUrl] = useState<string>('');

  // Pagination for unlimited infinite scrolling from 100% Live API
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  const lastProcessedIssueRef = useRef<string | null>(null);
  const currentPredictionRef = useRef<PredictionData | null>(null);
  const currentLevelRef = useRef<number>(0);
  const winCountRef = useRef<number>(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-wipe everything on restart, reopen, or back navigation
  useEffect(() => {
    // 1. Wipe browser storage on boot so old data never persists
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}

    // 2. Browser Back Navigation Handler -> Auto-wipes history back to 0
    const handlePopState = () => {
      setHistory([]);
      setWinCount(0);
      setCurrentLevel(0);
      setPrediction(null);
      lastProcessedIssueRef.current = null;
      currentPredictionRef.current = null;
      setHasChosenGame(false);
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
    };

    // 3. Page exit/unload handler -> Purges cache on exit
    const handlePageExit = () => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('pagehide', handlePageExit);
    window.addEventListener('beforeunload', handlePageExit);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('pagehide', handlePageExit);
      window.removeEventListener('beforeunload', handlePageExit);
    };
  }, []);

  // Keep refs in sync
  useEffect(() => {
    currentPredictionRef.current = prediction;
  }, [prediction]);

  useEffect(() => {
    currentLevelRef.current = currentLevel;
  }, [currentLevel]);

  useEffect(() => {
    winCountRef.current = winCount;
  }, [winCount]);

  const currentGame = GAMES.find((g) => g.id === selectedGame) || GAMES[0];

  // Fetch and update prediction logic — 100% LIVE API SYNC, starts strictly from 0
  const syncLiveData = useCallback(async () => {
    if (!hasChosenGame) return;
    setIsLoading(true);

    try {
      // Fetch 50 real issues from 100% live API
      const res = await fetchLotteryIssues(selectedGame, customUrl || undefined, 50, 1);
      setLatencyMs(res.latencyMs);
      setIsOnline(true);

      if (res.list.length > 0) {
        setIssues(res.list);
        const latestIssue = res.list[0];

        // Check if there is a new real live draw compared to what we last evaluated
        if (latestIssue.issueNumber !== lastProcessedIssueRef.current) {
          const prevIssueId = lastProcessedIssueRef.current;
          lastProcessedIssueRef.current = latestIssue.issueNumber;

          const num = parseInt(latestIssue.number, 10);
          const isK3 = selectedGame === 'K3_1M';
          const actualSize = determineActualSize(num, isK3);

          // Evaluate with previous prediction ONLY when active prediction was made
          const prevPred = currentPredictionRef.current;
          if (prevPred && prevIssueId) {
            const isSizeWin = prevPred.predictedSize === actualSize;
            const isJackpot = prevPred.predictedNum === num || prevPred.backupNum === num;
            const isWin = isSizeWin || isJackpot;

            if (isWin) {
              const newWins = winCountRef.current + 1;
              setWinCount(newWins);
              setCurrentLevel(0);
              soundManager.playWin();
            } else {
              setWinCount(0);
              setCurrentLevel((prev) => (prev + 1) % BET_LEVELS.length);
              soundManager.playAlert();
            }

            const newRec: HistoryRecord = {
              period: latestIssue.issueNumber.slice(-5),
              fullPeriod: latestIssue.issueNumber,
              actualNum: num,
              actualSize,
              predictedSize: prevPred.predictedSize,
              predictedNum: prevPred.predictedNum,
              backupNum: prevPred.backupNum,
              isWin,
              isJackpot,
              jackpotNum: isJackpot ? num : undefined,
              betAmount: BET_LEVELS[currentLevelRef.current] || BET_LEVELS[0],
              timestamp: Date.now(),
              game: currentGame.shortName,
              conf: prevPred.confidence,
              step: currentLevelRef.current + 1
            };

            // Prepend new verified live draw into history table
            setHistory((prev) => [newRec, ...prev.filter((r) => r.fullPeriod !== latestIssue.issueNumber)]);
          }

          // Generate next prediction using 5-engine AI fusion (Dragon, Mirror, Zigzag, Random Adaptive)
          const nextPred = calculatePrediction(res.list, selectedGame, currentLevelRef.current);
          if (nextPred) {
            setPrediction(nextPred);
            soundManager.playChakraTone(560, 0.2);
          }
        } else if (!currentPredictionRef.current) {
          // If prediction was not yet generated (e.g. initial boot), generate immediately!
          lastProcessedIssueRef.current = latestIssue.issueNumber;
          const initialPred = calculatePrediction(res.list, selectedGame, currentLevelRef.current);
          if (initialPred) {
            setPrediction(initialPred);
          }
        }
      }
    } catch {
      setIsOnline(false);
      // Auto-retry in 1.5s so prediction never halts or freezes
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = setTimeout(() => {
        syncLiveData();
      }, 1500);
    } finally {
      setIsLoading(false);
    }
  }, [hasChosenGame, selectedGame, customUrl, currentGame.shortName]);

  // Infinite Scroll Handler: Fetches additional pages of real live draws from the API
  const handleLoadMoreHistory = async () => {
    if (isLoadingMore || !hasMore || !hasChosenGame) return;
    setIsLoadingMore(true);

    try {
      const nextPage = currentPage + 1;
      const res = await fetchLotteryIssues(selectedGame, customUrl || undefined, 50, nextPage);

      if (res.list.length > 0) {
        setCurrentPage(nextPage);
      } else {
        setHasMore(false);
      }
    } catch {
      // Ignore pagination errors
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Back Button / Change Game Handler with Instant Auto-History Delete
  const handleBackAndClearSession = () => {
    soundManager.playTick();
    setHistory([]);
    setWinCount(0);
    setCurrentLevel(0);
    setPrediction(null);
    lastProcessedIssueRef.current = null;
    currentPredictionRef.current = null;
    setHasChosenGame(false);
    setCurrentPage(1);
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
  };

  // Handle Game choice confirmation from initial gate
  const handleConfirmInitialWingo = (gameId: GameType) => {
    setSelectedGame(gameId);
    setHasChosenGame(true);
    setPrediction(null);
    lastProcessedIssueRef.current = null;
    currentPredictionRef.current = null;
    setHistory([]);
    setWinCount(0);
    setCurrentLevel(0);
    setCurrentPage(1);
    setHasMore(true);
  };

  // Handle Game switch with auto history flush
  const handleSelectGame = (gameId: GameType) => {
    setSelectedGame(gameId);
    setPrediction(null);
    lastProcessedIssueRef.current = null;
    currentPredictionRef.current = null;
    setCustomUrl('');
    setHistory([]);
    setWinCount(0);
    setCurrentLevel(0);
    setCurrentPage(1);
    setHasMore(true);
  };

  // Sound toggle
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.enabled = next;
    if (next) {
      soundManager.playTone(660, 0.1);
    }
  };

  // Continuous Clock countdown timer effect
  useEffect(() => {
    if (!hasChosenGame) return;

    const updateCountdown = () => {
      const now = new Date();
      const currentSeconds = now.getSeconds();
      const dur = currentGame.durationSec;

      let rem = 60 - currentSeconds;
      if (dur === 30) {
        rem = 30 - (currentSeconds % 30);
      } else if (dur === 180) {
        const totalSecs = now.getMinutes() * 60 + currentSeconds;
        rem = 180 - (totalSecs % 180);
      } else if (dur === 300) {
        const totalSecs = now.getMinutes() * 60 + currentSeconds;
        rem = 300 - (totalSecs % 300);
      }

      setRemainingSeconds(rem);

      if (rem <= 5 && rem > 0 && soundEnabled) {
        soundManager.playTick();
      }

      // Sync aggressively around draw cut-off (2s, 1s, 0s) to catch new draw immediately
      if (rem <= 2) {
        syncLiveData();
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [hasChosenGame, currentGame.durationSec, soundEnabled, syncLiveData]);

  // Continuous background polling loop — runs uninterruptedly
  useEffect(() => {
    if (!hasChosenGame) return;

    syncLiveData();
    const timer = setInterval(() => {
      syncLiveData();
    }, 3000);

    return () => {
      clearInterval(timer);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, [hasChosenGame, syncLiveData]);

  return (
    <div className="min-h-screen bg-[#070b16] text-gray-200 flex flex-col font-rajdhani antialiased pb-20 selection:bg-[#10b981]/30 selection:text-white">
      {/* Top Header */}
      <Header
        latencyMs={latencyMs}
        isOnline={hasChosenGame ? isOnline : false}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenInspector={() => setShowInspector(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-md w-full mx-auto p-3 sm:p-4 flex flex-col gap-3.5">
        {/* Game Mode Selector Strip (hidden in embedded webpage tab) */}
        {hasChosenGame && currentTab !== 'webpage' && (
          <GameSelector
            selectedGame={selectedGame}
            onSelectGame={handleSelectGame}
          />
        )}

        {/* Tab 1: Predict (Exact Match to Screenshot IMG_20261001_164834_632.jpg) */}
        {currentTab === 'predict' && (
          <>
            {/* Top Glowing Prediction Card with 3D Flip Entry & Mobile Vibration */}
            <PredictionCard
              prediction={prediction}
              currentGame={currentGame}
              currentLevel={currentLevel}
              remainingSeconds={remainingSeconds}
              isLoading={isLoading}
              onRefresh={syncLiveData}
              winCount={winCount}
              onChangeGame={handleBackAndClearSession}
            />

            {/* Verification & Accuracy History Table with Auto-Wipe and Unlimited Scrolling */}
            <HistoryTable
              records={history}
              currentGame={currentGame}
              isOnline={isOnline}
              onLoadMore={handleLoadMoreHistory}
              hasMore={hasMore}
              isLoadingMore={isLoadingMore}
              onClearHistory={() => setHistory([])}
            />
          </>
        )}

        {/* Tab 2: AI Engines Breakdown (Dragon, Mirror, Zigzag, Block, Random) */}
        {currentTab === 'engines' && (
          <EngineAnalysisView
            prediction={prediction}
            currentGame={currentGame}
            onBackToPredict={() => setCurrentTab('predict')}
          />
        )}

        {/* Tab 3: Direct In-App Game Web View (Opens directly in-app, no external browser) */}
        {currentTab === 'webpage' && (
          <InAppWebView
            onBackToPredict={() => setCurrentTab('predict')}
          />
        )}
      </main>

      {/* Bottom Navigation Bar (Webpage | Hack / Predict | AI Engines) */}
      <BottomNavBar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
      />

      {/* Initial Wingo Choice Gate Modal (Bypasses License Key, Forces Wingo Selection First) */}
      <WingoGateModal
        isOpen={!hasChosenGame}
        selectedGame={selectedGame}
        onConfirmSelection={handleConfirmInitialWingo}
      />

      {/* Data Tunnel Modal */}
      <DataTunnelModal
        isOpen={showInspector}
        onClose={() => setShowInspector(false)}
        currentGame={currentGame}
        prediction={prediction}
        rawIssues={issues}
        latencyMs={latencyMs}
        isOnline={isOnline}
        onTestEndpoint={async (url) => {
          await fetchLotteryIssues(selectedGame, url);
        }}
        customUrl={customUrl}
        setCustomUrl={setCustomUrl}
      />
    </div>
  );
}
