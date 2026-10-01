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
import { BottomNavBar, TabType } from './components/BottomNavBar';
import { EngineAnalysisView } from './components/EngineAnalysisView';
import { InAppWebView } from './components/InAppWebView';
import { AuthUser, getStoredOrAutoAdminUser } from './utils/authDatabase';

export default function App() {
  // SPECIFICATION: Automatic background verification for Admin ID 655675576694 — ZERO POP-UPS!
  const [authUser] = useState<AuthUser>(() => getStoredOrAutoAdminUser());

  // Default landing tab is 'predict' with all features turned on immediately!
  const [currentTab, setCurrentTab] = useState<TabType>('predict');
  const [selectedGame, setSelectedGame] = useState<GameType>('WINGO_1M');

  // Prediction and live API state
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

  // Auto-wipe history on browser back navigation
  useEffect(() => {
    const handlePopState = () => {
      setHistory([]);
      setWinCount(0);
      setCurrentLevel(0);
      setPrediction(null);
      lastProcessedIssueRef.current = null;
      currentPredictionRef.current = null;
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
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
            const isJackpot = prevPred.predictedNum === num;
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
      // Auto-retry in 1.5s
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = setTimeout(() => {
        syncLiveData();
      }, 1500);
    } finally {
      setIsLoading(false);
    }
  }, [selectedGame, customUrl, currentGame.shortName]);

  // Infinite Scroll Handler: Fetches additional pages of real live draws from the API
  const handleLoadMoreHistory = async () => {
    if (isLoadingMore || !hasMore) return;
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

  // Change Game Handler
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

      if (rem <= 5 && rem > 0 && soundEnabled && currentTab === 'predict') {
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
  }, [currentGame.durationSec, soundEnabled, syncLiveData, currentTab]);

  // Continuous background polling loop — runs uninterruptedly
  useEffect(() => {
    syncLiveData();
    const timer = setInterval(() => {
      syncLiveData();
    }, 3000);

    return () => {
      clearInterval(timer);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, [syncLiveData]);

  return (
    <div className="min-h-screen bg-[#070b16] text-gray-200 flex flex-col font-rajdhani antialiased pb-20 selection:bg-[#ff6b00]/30 selection:text-white">
      {/* Top Header */}
      <Header
        latencyMs={latencyMs}
        isOnline={isOnline}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenInspector={() => setShowInspector(true)}
        authUser={authUser}
      />

      {/* Main Content Area */}
      <main
        className={`flex-1 w-full mx-auto flex flex-col transition-all ${
          currentTab === 'webpage'
            ? 'max-w-2xl p-1 sm:p-2 flex-1 h-full'
            : 'max-w-md p-3 sm:p-4 gap-3.5'
        }`}
      >
        {/* Game Mode Selector Strip */}
        {currentTab !== 'webpage' && (
          <GameSelector
            selectedGame={selectedGame}
            onSelectGame={handleSelectGame}
          />
        )}

        {/* Tab 1: Predict (All features ON immediately!) */}
        {currentTab === 'predict' && (
          <>
            {/* Top Glowing Prediction Card with 3D Flip Entry & Mobile Vibration (NO backup number) */}
            <PredictionCard
              prediction={prediction}
              currentGame={currentGame}
              currentLevel={currentLevel}
              remainingSeconds={remainingSeconds}
              isLoading={isLoading}
              onRefresh={syncLiveData}
              winCount={winCount}
              onChangeGame={() => {
                setHistory([]);
                setWinCount(0);
                setCurrentLevel(0);
                setPrediction(null);
                lastProcessedIssueRef.current = null;
                currentPredictionRef.current = null;
              }}
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

        {/* Tab 2: AI Engines Breakdown (All 5 Engines ON immediately!) */}
        {currentTab === 'engines' && (
          <EngineAnalysisView
            prediction={prediction}
            currentGame={currentGame}
            onBackToPredict={() => setCurrentTab('predict')}
          />
        )}

        {/* Tab 3: PERSISTENT In-App Game Web View (Loads ONCE, top live prediction ticker active!) */}
        <div className={`w-full flex-1 h-full ${currentTab === 'webpage' ? 'flex flex-col' : 'hidden'}`}>
          <InAppWebView
            onBackToPredict={() => setCurrentTab('predict')}
            prediction={prediction}
            history={history}
            isVerified={true}
          />
        </div>
      </main>

      {/* Bottom Navigation Bar (All tabs immediately accessible without pop-ups!) */}
      <BottomNavBar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        isVerified={true}
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
