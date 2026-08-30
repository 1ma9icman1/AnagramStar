import React, { useState } from 'react';
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

  const foundSet = new Set(playerWords.map((w) => w.word.toUpperCase()));
  const totalScorePossible = allValidWords.reduce((sum, w) => sum + calculateWordScore(w), 0);
  const playerTotalScore = playerWords.reduce((sum, w) => sum + w.score, 0);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75">
      <div
        id="dictionary-modal"
        className="w-full max-w-sm border-2 border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)] p-3 text-[var(--lcd-darkest,#0f380f)] font-['Press_Start_2P',monospace] shadow-[4px_4px_0_var(--lcd-darkest,#0f380f)] flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-1.5 border-b-2 border-[var(--lcd-darkest,#0f380f)] text-[8px]">
          <div>
            <span className="font-bold">DEX: {rootWord}</span>
            <div className="text-[6px] text-[var(--lcd-dark,#306230)]">
              {playerWords.length}/{allValidWords.length} WORDS ({playerTotalScore}/{totalScorePossible}P)
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-1.5 py-0.5 border border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg,#8bac0f)] cursor-pointer"
          >
            X
          </button>
        </div>

        {/* Filter buttons */}
        <div className="grid grid-cols-3 gap-1 my-2 text-[7px]">
          {(['all', 'missed', 'found'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setSelectedFilter(f)}
              className={`py-1 border border-[var(--lcd-darkest,#0f380f)] cursor-pointer uppercase ${
                selectedFilter === f
                  ? 'bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)]'
                  : 'bg-[var(--lcd-bg,#8bac0f)]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Word Lists */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 gb-scroll max-h-[220px]">
          {lengths.map((len) => {
            const wordsInLen = grouped[len] || [];
            const filteredWords = wordsInLen.filter((w) => {
              const isFound = foundSet.has(w);
              if (selectedFilter === 'found') return isFound;
              if (selectedFilter === 'missed') return !isFound;
              return true;
            });

            if (filteredWords.length === 0) return null;

            return (
              <div key={`len-${len}`} className="space-y-1">
                <div className="text-[7px] text-[var(--lcd-dark,#306230)] border-b border-[var(--lcd-dark,#306230)]/40 pb-0.5">
                  {len}-LETTER WORDS ({filteredWords.length})
                </div>

                <div className="grid grid-cols-2 gap-1 text-[7px]">
                  {filteredWords.map((word) => {
                    const isFound = foundSet.has(word);
                    return (
                      <div
                        key={word}
                        className={`px-1 py-0.5 border flex items-center justify-between ${
                          isFound
                            ? 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)]'
                            : 'border-[var(--lcd-dark,#306230)]/50 bg-[var(--lcd-bg,#8bac0f)] opacity-70'
                        }`}
                      >
                        <span>{word}</span>
                        <span>{isFound ? '✓' : '-'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t-2 border-[var(--lcd-darkest,#0f380f)] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-1.5 border-2 border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)] text-[8px] font-bold cursor-pointer"
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
};
