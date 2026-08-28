import React, { useState } from 'react';
import { X, User, Check } from 'lucide-react';
import { PlayerProfile } from '../types/game';

interface ProfileModalProps {
  profile: PlayerProfile;
  isOpen: boolean;
  onSave: (updated: PlayerProfile) => void;
  onClose: () => void;
}

const EMOJI_PRESETS = ['😋', '😎', '🤠', '🦊', '🐱', '🐶', '🦁', '🐸', '🐼', '🤖', '👾', '🚀', '🔥', '⭐', '🍕', '🏆'];
const COLOR_PRESETS = ['#5865F2', '#3BA55C', '#FAA61A', '#ED4245', '#EB459E', '#99AAB5', '#2C2F33', '#10B981'];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  profile,
  isOpen,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(profile.name);
  const [avatarEmoji, setAvatarEmoji] = useState(profile.avatarEmoji);
  const [avatarColor, setAvatarColor] = useState(profile.avatarColor);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...profile,
      name: name.trim() || 'Player',
      avatarEmoji,
      avatarColor,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      <div
        id="profile-customizer-modal"
        className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 text-slate-100"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-400" />
            <span>Customize Profile</span>
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Avatar Preview */}
          <div className="flex flex-col items-center justify-center gap-2">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-lg border-2 border-emerald-500 ring-4 ring-slate-800"
              style={{ backgroundColor: avatarColor }}
            >
              {avatarEmoji}
            </div>
            <span className="text-xs font-bold text-slate-400">Avatar Preview</span>
          </div>

          {/* Player Name */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
              Display Name
            </label>
            <input
              id="player-name-input"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={16}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm font-bold text-white focus:outline-hidden focus:border-indigo-500 transition"
              placeholder="Enter name"
            />
          </div>

          {/* Emoji selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              Choose Avatar
            </label>
            <div className="grid grid-cols-8 gap-1.5 bg-slate-800/60 p-2 rounded-xl border border-slate-700/60 max-h-32 overflow-y-auto">
              {EMOJI_PRESETS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatarEmoji(emoji)}
                  className={`
                    w-8 h-8 rounded-lg flex items-center justify-center text-lg transition cursor-pointer
                    ${avatarEmoji === emoji ? 'bg-indigo-600 ring-2 ring-white scale-110' : 'hover:bg-slate-700'}
                  `}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Color selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              Profile Color
            </label>
            <div className="flex items-center gap-2">
              {COLOR_PRESETS.map(col => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setAvatarColor(col)}
                  className={`
                    w-7 h-7 rounded-full transition cursor-pointer flex items-center justify-center
                    ${avatarColor === col ? 'ring-2 ring-white scale-110' : 'hover:opacity-80'}
                  `}
                  style={{ backgroundColor: col }}
                >
                  {avatarColor === col && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider shadow-lg transition cursor-pointer"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
