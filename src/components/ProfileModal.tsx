import React, { useState } from 'react';
import { PlayerProfile } from '../types/game';

interface ProfileModalProps {
  profile: PlayerProfile;
  isOpen: boolean;
  onSave: (updated: PlayerProfile) => void;
  onClose: () => void;
  isUnlocked?: boolean;
}

const DEFAULT_EMOJI_PRESETS = ['👾', '🕹️', '🎮', '🍄', '🐢', '⭐', '🗡️', '🛡️', '🦖', '🤖', '👑', '⚡'];
const SECRET_EMOJI_PRESETS = [
  '🧙‍♂️', '🔮', '💻', '🕶️', '💀', '🔥', '💎', '🚀', '👽', '🦄', '🐱', '🎯',
  '👾', '🕹️', '🎮', '🍄', '🐢', '⭐', '🗡️', '🛡️', '🦖', '🤖', '👑', '⚡'
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  profile,
  isOpen,
  onSave,
  onClose,
  isUnlocked = false,
}) => {
  const [name, setName] = useState(profile.name);
  const [avatarEmoji, setAvatarEmoji] = useState(profile.avatarEmoji);

  const emojiList = isUnlocked ? SECRET_EMOJI_PRESETS : DEFAULT_EMOJI_PRESETS;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...profile,
      name: name.trim() || 'PLAYER 1',
      avatarEmoji,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75">
      <div
        id="profile-customizer-modal"
        className="w-full max-w-xs border-2 border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)] p-3 text-[var(--lcd-darkest,#0f380f)] font-['Press_Start_2P',monospace] shadow-[4px_4px_0_var(--lcd-darkest,#0f380f)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-1.5 border-b-2 border-[var(--lcd-darkest,#0f380f)] text-[8px]">
          <span className="font-bold">TRAINER CARD</span>
          <button
            type="button"
            onClick={onClose}
            className="px-1 border border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg,#8bac0f)] cursor-pointer"
          >
            X
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-2 space-y-2.5 text-[8px]">
          {/* Avatar Preview */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 border-2 border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg,#8bac0f)] flex items-center justify-center text-xl">
              {avatarEmoji}
            </div>
            <div>
              <div className="text-[7px] text-[var(--lcd-dark,#306230)]">CALLSIGN:</div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={12}
                className="w-full px-1 py-0.5 border border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg,#8bac0f)] font-['Press_Start_2P',monospace] text-[8px] outline-none"
              />
            </div>
          </div>

          {/* Emoji Sprites */}
          <div>
            <div className="flex items-center justify-between text-[7px] text-[var(--lcd-dark,#306230)] mb-1">
              <span>SPRITE ICON:</span>
              {isUnlocked && (
                <span className="text-[6px] text-emerald-600 font-bold">★ MA9IC ALL UNLOCKED</span>
              )}
            </div>
            <div className="grid grid-cols-6 gap-1 border border-[var(--lcd-darkest,#0f380f)] p-1 bg-[var(--lcd-bg,#8bac0f)] max-h-32 overflow-y-auto gb-scroll">
              {emojiList.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatarEmoji(emoji)}
                  className={`w-7 h-7 flex items-center justify-center text-sm cursor-pointer border ${
                    avatarEmoji === emoji
                      ? 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-darkest,#0f380f)] text-white'
                      : 'border-transparent hover:border-[var(--lcd-darkest,#0f380f)]'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-1 flex gap-1 text-[8px]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-1 border border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg,#8bac0f)] cursor-pointer"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="flex-1 py-1 border-2 border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)] font-bold cursor-pointer"
            >
              SAVE
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
