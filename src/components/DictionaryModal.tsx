import React, { useState } from 'react';
import { X, CheckCircle2, Circle, Terminal, Cpu } from 'lucide-react';
import { calculateWordScore } from '../utils/dictionary';
import { SubmittedWord } from '../types/game';

interface DictionaryModalProps {
  rootWord: string;
  allValidWords: string[];
  playerWords: SubmittedWord[];
  isOpen: boolean;
  onClose: () => void;
}

export const DictionaryModal: React.FC<DictionaryModalProps> = ({
  rootWord,
  allValidWords,
  playerWords,
  isOpen,
  onClose,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'missed' | 'found'>('all');

  if (!isOpen) return null;

  const foundSet = new Set(playerWords.map(w => w.word.toUpperCase()));
  const totalScorePossible = allValidWords.reduce((sum, w) => sum + calculateWordScore(w), 0);
  const playerTotalScore = playerWords.reduce((sum, w) => sum + w.score, 0);
  const pctFound = Math.round((playerWords.length / Math.max(1, allValidWords.length)) * 100);

  // Group words by length
  const grouped: Record<number, string[]> = {};
  for (const word of allValidWords) {
    const len = word.length;
    if (!grouped[len]) grouped[len] = [];
    grouped[len].push(word);
  }

  const lengths = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs font-mono">
      <div
        id="dictionary-modal"
        className="relative w-full max-w-lg bg-[#040e07] border-2 border-[#00ff66]/60 rounded-2xl shadow-[0_0_40px_rgba(0,255,102,0.25)] p-4 sm:p-6 flex flex-col max-h-[90vh] text-emerald-100 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#00ff66]/20">
          <div>
            <h3 className="text-base sm:text-lg font-['Orbitron',monospace] font-black text-[#00ff66] flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#00ff66]" />
              <span>PAYLOAD DICTIONARY: <span className="text-[#00ffcc] tracking-widest">{rootWord}</span></span>
            </h3>
            <p className="text-xs text-emerald-400 font-mono mt-0.5">
              DECRYPTED: {playerWords.length}/{allValidWords.length} ({pctFound}%) • YIELD: {playerTotalScore}/{totalScorePossible}b
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-black hover:bg-emerald-950/80 text-emerald-400 hover:text-white flex items-center justify-center transition border border-[#00ff66]/40 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 my-3">
          {(['all', 'missed', 'found'] as const).map(f => (
            <button
              key={f}
              onClick={() => setSelectedFilter(f)}
              className={`
                px-3 py-1 text-xs font-bold font-mono rounded-lg uppercase tracking-wider transition cursor-pointer border
                ${selectedFilter === f
                  ? 'bg-[#00ff66] text-black border-[#00ff66] shadow-[0_0_10px_rgba(0,255,102,0.4)]'
                  : 'bg-black text-emerald-500 border-[#00ff66]/30 hover:border-[#00ff66]/70'}
              `}
            >
              {f} {f === 'found' ? `(${playerWords.length})` : f === 'missed' ? `(${allValidWords.length - playerWords.length})` : `(${allValidWords.length})`}
            </button>
          ))}
        </div>

        {/* Word Lists by Length */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-matrix-scroll">
          {lengths.map(len => {
            const wordsInLen = grouped[len] || [];
            const filteredWords = wordsInLen.filter(w => {
              const isFound = foundSet.has(w);
              if (selectedFilter === 'found') return isFound;
              if (selectedFilter === 'missed') return !isFound;
              return true;
            });

            if (filteredWords.length === 0) return null;

            return (
              <div key={`len-${len}`} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-400 px-1 border-b border-[#00ff66]/20 pb-1">
                  <span>{len}-BYTE SEQUENCES (+{calculateWordScore('A'.repeat(len))}b)</span>
                  <span className="font-mono text-emerald-500">{filteredWords.length} entries</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {filteredWords.map(word => {
                    const isFound = foundSet.has(word);
                    return (
                      <div
                        key={word}
                        className={`
                          flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold font-mono border transition
                          ${isFound
                            ? 'bg-[#002e12] border-[#00ff66] text-[#00ff66] shadow-[0_0_8px_rgba(0,255,102,0.2)]'
                            : 'bg-black/70 border-[#00ff66]/20 text-emerald-700'}
                        `}
                      >
                        <span className="tracking-wider">{word}</span>
                        {isFound ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff66] shrink-0" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-emerald-950 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 mt-2 border-t border-[#00ff66]/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#00ff66] hover:bg-[#55ff99] text-black font-['Orbitron',monospace] text-xs font-bold rounded-lg shadow-[0_0_12px_#00ff66] transition cursor-pointer"
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
};

