import React from 'react';
import { GameConfig, PredictionData, LotteryIssue } from '../types';
import { Terminal, X, CheckCircle, Wifi, RefreshCw, Send, AlertCircle } from 'lucide-react';
import { soundManager } from '../utils/soundEffects';

interface DataTunnelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGame: GameConfig;
  prediction: PredictionData | null;
  rawIssues: LotteryIssue[];
  latencyMs: number;
  isOnline: boolean;
  onTestEndpoint: (customUrl: string) => Promise<void>;
  customUrl: string;
  setCustomUrl: (url: string) => void;
}

export const DataTunnelModal: React.FC<DataTunnelModalProps> = ({
  isOpen,
  onClose,
  currentGame,
  prediction,
  rawIssues,
  latencyMs,
  isOnline,
  onTestEndpoint,
  customUrl,
  setCustomUrl
}) => {
  const [testing, setTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    setTestResult(null);
    try {
      await onTestEndpoint(customUrl);
      setTestResult('Success: 100% Live packets verified.');
      soundManager.playTone(800, 0.15);
    } catch (err) {
      setTestResult(`Error: ${(err as Error).message}`);
      soundManager.playAlert();
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-[#0e101a] border border-[#00e5ff]/40 rounded-2xl p-4 sm:p-6 shadow-2xl text-left max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/30">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-orbitron font-bold text-sm sm:text-base text-white">
                LIVE API DATA TUNNEL INSPECTOR
              </h3>
              <p className="text-[11px] text-gray-400 font-mono-code">
                Real-Time Socket & Mathematical Execution Stream
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto space-y-4 py-4 pr-1 text-xs font-mono-code">
          {/* Active Target Endpoint */}
          <div className="bg-[#141624] p-3 rounded-xl border border-gray-800">
            <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">
              CURRENT ACTIVE TARGET ENDPOINT
            </div>
            <div className="text-cyan-300 font-bold break-all bg-black/40 p-2 rounded border border-gray-800">
              {customUrl || currentGame.apiUrl}
            </div>
            <div className="flex items-center gap-3 mt-2 text-[11px]">
              <span className="flex items-center gap-1 text-emerald-400">
                <Wifi className="w-3.5 h-3.5" />
                {isOnline ? 'STREAM ACTIVE' : 'OFFLINE / STANDBY'}
              </span>
              <span className="text-gray-500">|</span>
              <span className="text-gray-300">PING: {latencyMs}ms</span>
              <span className="text-gray-500">|</span>
              <span className="text-[#ff8800]">GAME: {currentGame.name}</span>
            </div>
          </div>

          {/* Formula calculation breakdown */}
          {prediction && (
            <div className="bg-[#141624] p-3 rounded-xl border border-gray-800">
              <div className="text-[10px] text-gray-400 font-bold uppercase mb-2 flex items-center justify-between">
                <span>8-FORMULA MATHEMATICAL BREAKDOWN</span>
                <span className="text-emerald-400">TARGET: #{prediction.period}</span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 text-center mb-2.5">
                {prediction.calculations.map((c, i) => (
                  <div key={i} className="bg-black/50 p-1.5 rounded border border-gray-800">
                    <div className="text-[9px] text-gray-500">C{i + 1}</div>
                    <div className="font-orbitron font-bold text-sm text-[#ff8800]">{c}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-[11px] bg-black/30 p-2 rounded">
                <span>
                  BIG FORMULA COUNT: <strong className="text-rose-400">{prediction.bigCount}</strong>
                </span>
                <span>
                  SMALL FORMULA COUNT: <strong className="text-emerald-400">{prediction.smallCount}</strong>
                </span>
                <span>
                  RESOLVED: <strong className={prediction.predictedSize === 'BIG' ? 'text-rose-400' : 'text-emerald-400'}>{prediction.predictedSize} ({prediction.predictedNum})</strong>
                </span>
              </div>
            </div>
          )}

          {/* Raw Feed Packets */}
          <div className="bg-[#141624] p-3 rounded-xl border border-gray-800">
            <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">
              LATEST LIVE DRAW PACKET (ISSUES: {rawIssues.length})
            </div>
            <pre className="bg-black/60 p-2.5 rounded border border-gray-800 text-[10px] text-emerald-400 overflow-x-auto max-h-36">
              {rawIssues.length > 0
                ? JSON.stringify(rawIssues.slice(0, 3), null, 2)
                : 'No packets in buffer yet'}
            </pre>
          </div>

          {/* Custom Endpoint Testing Form */}
          <form onSubmit={handleTest} className="bg-[#141624] p-3 rounded-xl border border-gray-800">
            <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">
              CHANGE / TEST CUSTOM LIVE API URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder={currentGame.apiUrl}
                className="flex-1 bg-black/60 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00e5ff]"
              />
              <button
                type="submit"
                disabled={testing}
                className="px-3 py-1.5 rounded-lg bg-[#00e5ff]/20 border border-[#00e5ff]/50 text-[#00e5ff] hover:bg-[#00e5ff] hover:text-black transition-colors font-bold flex items-center gap-1 text-xs shrink-0"
              >
                {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>TEST</span>
              </button>
            </div>
            {testResult && (
              <p className={`mt-2 text-[11px] flex items-center gap-1 ${testResult.startsWith('Success') ? 'text-emerald-400' : 'text-rose-400'}`}>
                {testResult.startsWith('Success') ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {testResult}
              </p>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
