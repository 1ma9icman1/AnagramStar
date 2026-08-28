import React, { useState } from 'react';
import { X, CheckCircle2, Circle, Sparkles } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      <div
        id="dictionary-modal"
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 sm:p-6 flex flex-col max-h-[90vh] text-slate-100 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>All Anagrams: <span className="text-amber-400 font-mono tracking-widest">{rootWord}</span></span>
            </h3>
            <p className="text-xs text-slate-400">
              Found {playerWords.length}/{allValidWords.length} words ({pctFound}%) • {playerTotalScore}/{totalScorePossible} pts
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
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
                px-3 py-1 text-xs font-bold rounded-lg uppercase tracking-wider transition cursor-pointer
                ${selectedFilter === f
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'}
              `}
            >
              {f} {f === 'found' ? `(${playerWords.length})` : f === 'missed' ? `(${allValidWords.length - playerWords.length})` : `(${allValidWords.length})`}
            </button>
          ))}
        </div>

        {/* Word Lists by Length */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-wood-scroll">
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
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1 border-b border-slate-800/80 pb-1">
                  <span>{len}-LETTER WORDS (+{calculateWordScore('A'.repeat(len))} pts)</span>
                  <span className="font-mono">{filteredWords.length} words</span>
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
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                            : 'bg-slate-800/50 border-slate-700/50 text-slate-300'}
                        `}
                      >
                        <span className="tracking-wider">{word}</span>
                        {isFound ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
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
        <div className="pt-3 mt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Close Dictionary
          </button>
        </div>
      </div>
    </div>
  );
};
