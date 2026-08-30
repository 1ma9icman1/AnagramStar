import React, { useState } from 'react';
import { PlayerProfile } from '../types/game';
import { generateDiscordInviteText, encodeMatchShareUrl } from '../utils/discord';
import { openDiscordInviteDialog } from '../utils/discordSdk';
import { getRandomPuzzle } from '../utils/dictionary';

interface DiscordInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerProfile: PlayerProfile;
  initialRootWord?: string;
  defaultWordLength?: 6 | 7;
  onStartWithPuzzle?: (puzzle: { root: string; scrambled: string; allValidWords: string[]; maxScore: number }) => void;
}

export const DiscordInviteModal: React.FC<DiscordInviteModalProps> = ({
  isOpen,
  onClose,
  playerProfile,
  initialRootWord,
  defaultWordLength = 6,
  onStartWithPuzzle,
}) => {
  const [wordLength, setWordLength] = useState<6 | 7>(defaultWordLength);
  const [puzzle, setPuzzle] = useState(() => getRandomPuzzle(wordLength));
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedDiscordMsg, setCopiedDiscordMsg] = useState(false);

  const rootWord = initialRootWord || puzzle.root;
  const inviteUrl = encodeMatchShareUrl(rootWord, 0, 0, playerProfile.name);
  const discordMessage = generateDiscordInviteText(playerProfile, rootWord, wordLength);

  const handleRegenerateSeed = () => {
    const newPuz = getRandomPuzzle(wordLength);
    setPuzzle(newPuz);
  };

  const handleLengthChange = (len: 6 | 7) => {
    setWordLength(len);
    const newPuz = getRandomPuzzle(len);
    setPuzzle(newPuz);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {}
  };

  const handleCopyDiscordMessage = async () => {
    try {
      await navigator.clipboard.writeText(discordMessage);
      setCopiedDiscordMsg(true);
      setTimeout(() => setCopiedDiscordMsg(false), 2000);
    } catch {}
  };

  const handleDiscordSdkInvite = async () => {
    const success = await openDiscordInviteDialog();
    if (!success) {
      handleCopyDiscordMessage();
    }
  };

  const handleLaunchDuelNow = () => {
    if (onStartWithPuzzle) {
      onStartWithPuzzle(puzzle);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75">
      <div
        id="discord-invite-modal"
        className="w-full max-w-sm border-2 border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)] p-3 text-[var(--lcd-darkest,#0f380f)] font-['Press_Start_2P',monospace] shadow-[4px_4px_0_var(--lcd-darkest,#0f380f)] flex flex-col max-h-[90vh] overflow-y-auto gb-scroll"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-1.5 border-b-2 border-[var(--lcd-darkest,#0f380f)] text-[8px]">
          <span className="font-bold">LINK CABLE DUEL</span>
          <button
            type="button"
            onClick={onClose}
            className="px-1.5 py-0.5 border border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg,#8bac0f)] cursor-pointer"
          >
            X
          </button>
        </div>

        {/* Letter count selector & Seed */}
        <div className="my-2 border border-[var(--lcd-darkest,#0f380f)] p-2 bg-[var(--lcd-bg,#8bac0f)] text-[7px] space-y-1.5">
          <div className="flex items-center justify-between">
            <span>LETTERS:</span>
            <div className="flex gap-1">
              {[6, 7].map((len) => (
                <button
                  key={len}
                  type="button"
                  onClick={() => handleLengthChange(len as 6 | 7)}
                  className={`px-1.5 py-0.5 border border-[var(--lcd-darkest,#0f380f)] cursor-pointer ${
                    wordLength === len
                      ? 'bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)]'
                      : 'bg-[var(--lcd-bg-light,#9bbc0f)]'
                  }`}
                >
                  {len}L
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-[var(--lcd-dark,#306230)]/40">
            <div className="font-bold text-[8px] tracking-wider">{rootWord}</div>
            <button
              type="button"
              onClick={handleRegenerateSeed}
              className="text-[6px] underline hover:opacity-80 cursor-pointer"
            >
              [RE-ROLL]
            </button>
          </div>
        </div>

        {/* Discord format message preview */}
        <div className="space-y-1 my-1 text-[7px]">
          <div className="text-[6px] text-[var(--lcd-dark,#306230)]">DISCORD PAYLOAD:</div>
          <div className="p-1.5 border border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg,#8bac0f)] max-h-20 overflow-y-auto gb-scroll text-[6px] font-mono whitespace-pre-wrap">
            {discordMessage}
          </div>

          <div className="grid grid-cols-2 gap-1 pt-1">
            <button
              type="button"
              onClick={handleCopyDiscordMessage}
              className="py-1 border border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)] hover:bg-[var(--lcd-dark,#306230)] hover:text-[var(--lcd-bg-light,#9bbc0f)] cursor-pointer text-center text-[7px]"
            >
              {copiedDiscordMsg ? 'COPIED!' : 'COPY DISCORD'}
            </button>
            <button
              type="button"
              onClick={handleDiscordSdkInvite}
              className="py-1 border border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)] hover:bg-[var(--lcd-dark,#306230)] hover:text-[var(--lcd-bg-light,#9bbc0f)] cursor-pointer text-center text-[7px]"
            >
              INVITE FRIEND
            </button>
          </div>
        </div>

        {/* Challenge Link */}
        <div className="space-y-1 my-1 text-[7px] pt-1 border-t border-[var(--lcd-dark,#306230)]/40">
          <div className="text-[6px] text-[var(--lcd-dark,#306230)]">DIRECT WEB LINK:</div>
          <div className="flex gap-1">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="flex-1 px-1 py-0.5 border border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg,#8bac0f)] text-[6px] font-mono outline-none"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-1.5 py-0.5 border border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)] text-[7px] cursor-pointer"
            >
              {copiedLink ? '✓' : 'COPY'}
            </button>
          </div>
        </div>

        {/* Launch now */}
        <div className="pt-2 border-t-2 border-[var(--lcd-darkest,#0f380f)]">
          {onStartWithPuzzle && (
            <button
              type="button"
              onClick={handleLaunchDuelNow}
              className="w-full py-2 border-2 border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)] font-bold text-[8px] text-center shadow-[2px_2px_0_var(--lcd-darkest,#0f380f)] cursor-pointer"
            >
              ► PLAY THIS SEED NOW
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
