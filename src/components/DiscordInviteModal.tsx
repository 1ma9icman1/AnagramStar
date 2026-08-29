import React, { useState } from 'react';
import { Share2, Copy, Check, X, Users, Terminal, Sparkles, Send, Globe, MessageSquare } from 'lucide-react';
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
  const [puzzle, setPuzzle] = useState(() => {
    return getRandomPuzzle(wordLength);
  });
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedDiscordMsg, setCopiedDiscordMsg] = useState(false);
  const [inDiscordActivity, setInDiscordActivity] = useState(false);

  // Generate invite URL and rich message
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
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleCopyDiscordMessage = async () => {
    try {
      await navigator.clipboard.writeText(discordMessage);
      setCopiedDiscordMsg(true);
      setTimeout(() => setCopiedDiscordMsg(false), 2500);
    } catch {}
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Matrix Anagram Duel vs ${playerProfile.name}`,
          text: `Accept my Matrix Anagrams cipher duel! Decode ${rootWord.length} scrambled letters in 60s:`,
          url: inviteUrl,
        });
      } catch {}
    } else {
      handleCopyLink();
    }
  };

  const handleDiscordSdkInvite = async () => {
    const success = await openDiscordInviteDialog();
    if (!success) {
      // Fallback to copying
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in font-mono">
      <div className="relative w-full max-w-lg bg-[#020b05] border-2 border-[#00ff66]/70 rounded-2xl p-4 sm:p-6 shadow-[0_0_40px_rgba(0,255,102,0.3)] text-emerald-100 flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#00ff66]/30 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#00ff66] text-black flex items-center justify-center font-black shadow-[0_0_12px_#00ff66]">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-['Orbitron',monospace] font-black text-sm sm:text-base text-[#00ff66] tracking-wider">
                INVITE DISCORD PLAYER
              </h3>
              <p className="text-[10px] sm:text-xs text-emerald-400">1v1 Synchronous / Asynchronous Seed Duel</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-black hover:bg-emerald-950 text-emerald-400 flex items-center justify-center border border-[#00ff66]/30 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Word Length & Target Rack Preview */}
        <div className="bg-black/80 p-3 rounded-xl border border-[#00ff66]/30 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-400">CIPHER DIFFICULTY:</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => handleLengthChange(6)}
                className={`px-2.5 py-1 text-xs rounded border font-bold transition cursor-pointer ${
                  wordLength === 6
                    ? 'bg-[#00ff66] text-black border-[#00ff66] shadow-[0_0_10px_#00ff66]'
                    : 'bg-black text-emerald-500 border-emerald-900 hover:border-emerald-700'
                }`}
              >
                6-LETTER
              </button>
              <button
                type="button"
                onClick={() => handleLengthChange(7)}
                className={`px-2.5 py-1 text-xs rounded border font-bold transition cursor-pointer ${
                  wordLength === 7
                    ? 'bg-[#00ff66] text-black border-[#00ff66] shadow-[0_0_10px_#00ff66]'
                    : 'bg-black text-emerald-500 border-emerald-900 hover:border-emerald-700'
                }`}
              >
                7-LETTER
              </button>
            </div>
          </div>

          {/* Letter Tiles Preview */}
          <div className="pt-2 border-t border-[#00ff66]/20 flex items-center justify-between">
            <div className="flex items-center gap-1 sm:gap-1.5">
              {rootWord.split('').map((char, i) => (
                <span
                  key={i}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-[#011a0b] border border-[#00ff66] text-[#00ff66] font-['Orbitron',monospace] font-black text-sm flex items-center justify-center shadow-[0_0_8px_rgba(0,255,102,0.3)]"
                >
                  {char}
                </span>
              ))}
            </div>
            <button
              onClick={handleRegenerateSeed}
              type="button"
              className="text-[10px] text-emerald-400 hover:text-[#00ff66] underline cursor-pointer"
            >
              [Re-Roll Seed]
            </button>
          </div>
        </div>

        {/* Action 1: Discord Native / Rich Message */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5 text-[#5865F2]" />
            <span>DISCORD CHAT INVITE (FORMATTED WITH EMOJIS & LINK):</span>
          </label>

          <div className="relative bg-[#010c05] p-2.5 rounded-xl border border-[#00ff66]/30 text-[10px] text-emerald-300 font-mono overflow-x-auto whitespace-pre-line leading-relaxed max-h-28">
            {discordMessage}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              type="button"
              onClick={handleCopyDiscordMessage}
              className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                copiedDiscordMsg
                  ? 'bg-emerald-500 text-black border-white shadow-[0_0_15px_#00ff66]'
                  : 'bg-[#5865F2] hover:bg-[#4752C4] text-white border-[#7289da] shadow-[0_0_12px_rgba(88,101,242,0.4)]'
              }`}
            >
              {copiedDiscordMsg ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedDiscordMsg ? 'MESSAGE COPIED!' : 'COPY DISCORD MSG'}</span>
            </button>

            <button
              type="button"
              onClick={handleDiscordSdkInvite}
              className="py-2.5 px-3 rounded-xl bg-[#002b13] hover:bg-[#003d1b] text-[#00ff66] border border-[#00ff66]/60 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-[0_0_10px_rgba(0,255,102,0.2)]"
            >
              <Send className="w-4 h-4" />
              <span>INVITE IN DISCORD</span>
            </button>
          </div>
        </div>

        {/* Action 2: Direct Duel URL */}
        <div className="flex flex-col gap-1.5 pt-2 border-t border-[#00ff66]/20">
          <label className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-[#00ff66]" />
            <span>DIRECT CHALLENGE WEB LINK:</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="flex-1 px-3 py-1.5 bg-black border border-[#00ff66]/40 rounded-lg text-xs text-[#00ff66] font-mono focus:outline-hidden"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className={`px-3 py-1.5 rounded-lg border font-bold text-xs transition cursor-pointer flex items-center gap-1 ${
                copiedLink
                  ? 'bg-emerald-400 text-black border-white'
                  : 'bg-black hover:bg-emerald-950 text-[#00ff66] border-[#00ff66]/50'
              }`}
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'COPIED' : 'COPY'}</span>
            </button>
          </div>
        </div>

        {/* Bottom Duel Launch */}
        <div className="pt-2 border-t border-[#00ff66]/30 flex flex-col gap-2">
          {onStartWithPuzzle && (
            <button
              type="button"
              onClick={handleLaunchDuelNow}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-600 via-[#00ff66] to-emerald-600 hover:from-teal-400 hover:to-emerald-400 text-black font-['Orbitron',monospace] font-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_20px_#00ff66] border border-white transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-black" />
              <span>PLAY THIS SEED NOW & SEND SCORE</span>
            </button>
          )}

          <p className="text-[10px] text-center text-emerald-400/80">
            Whoever opens your link or message will crack the exact same scramble in 60s!
          </p>
        </div>
      </div>
    </div>
  );
};
