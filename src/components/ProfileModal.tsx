import React, { useState } from 'react';
import { X, User, Check, Terminal, Shield } from 'lucide-react';
import { PlayerProfile } from '../types/game';

interface ProfileModalProps {
  profile: PlayerProfile;
  isOpen: boolean;
  onSave: (updated: PlayerProfile) => void;
  onClose: () => void;
}

const EMOJI_PRESETS = ['🕶️', '💻', '👾', '💊', '🤖', '🕵️', '🦾', '⚡', '💾', '🧠', '📡', '🛡️', '🧬', '🟢', '🔑', '👁️'];
const COLOR_PRESETS = ['#052e16', '#064e3b', '#022c22', '#0f172a', '#172554', '#3b0764', '#450a0a', '#18181b'];

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
      name: name.trim() || 'Neo',
      avatarEmoji,
      avatarColor,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
      <div
        id="profile-customizer-modal"
        className="relative w-full max-w-sm bg-[#040e07] border-2 border-[#00ff66]/60 rounded-2xl shadow-[0_0_35px_rgba(0,255,102,0.25)] p-5 text-emerald-100 font-mono"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#00ff66]/20">
          <h3 className="text-base font-['Orbitron',monospace] font-black text-[#00ff66] flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#00ff66]" />
            <span>OPERATOR PROFILE</span>
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-black hover:bg-emerald-950/80 text-emerald-400 hover:text-white flex items-center justify-center transition border border-[#00ff66]/40 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Avatar Preview */}
          <div className="flex flex-col items-center justify-center gap-2">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl shadow-[0_0_15px_#00ff66] border-2 border-[#00ff66] bg-black"
              style={{ backgroundColor: avatarColor }}
            >
              {avatarEmoji}
            </div>
            <span className="text-[10px] font-bold text-emerald-400">CALLSIGN PREVIEW</span>
          </div>

          {/* Player Name */}
          <div>
            <label className="block text-[10px] font-bold text-emerald-400 mb-1 uppercase tracking-wider">
              OPERATOR CODENAME
            </label>
            <input
              id="player-name-input"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={16}
              className="w-full px-3 py-2 bg-black border border-[#00ff66]/50 rounded-lg text-sm font-bold text-[#00ff66] focus:outline-hidden focus:border-[#00ff66] shadow-inner font-mono"
              placeholder="Enter alias"
            />
          </div>

          {/* Emoji selector */}
          <div>
            <label className="block text-[10px] font-bold text-emerald-400 mb-1.5 uppercase tracking-wider">
              AVATAR GLYPH
            </label>
            <div className="grid grid-cols-8 gap-1.5 bg-black/60 p-2 rounded-xl border border-[#00ff66]/30 max-h-32 overflow-y-auto custom-matrix-scroll">
              {EMOJI_PRESETS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatarEmoji(emoji)}
                  className={`
                    w-7 h-7 rounded flex items-center justify-center text-base transition cursor-pointer
                    ${avatarEmoji === emoji ? 'bg-[#003816] ring-2 ring-[#00ff66] scale-110 shadow-[0_0_8px_#00ff66]' : 'hover:bg-emerald-950/60'}
                  `}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Color selector */}
          <div>
            <label className="block text-[10px] font-bold text-emerald-400 mb-1.5 uppercase tracking-wider">
              BACKGROUND SHIELD TINT
            </label>
            <div className="flex items-center gap-2">
              {COLOR_PRESETS.map(col => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setAvatarColor(col)}
                  className={`
                    w-6 h-6 rounded border transition cursor-pointer flex items-center justify-center
                    ${avatarColor === col ? 'border-[#00ff66] ring-2 ring-[#00ff66] scale-110' : 'border-slate-700 hover:opacity-80'}
                  `}
                  style={{ backgroundColor: col }}
                >
                  {avatarColor === col && <Check className="w-3 h-3 text-[#00ff66]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex gap-2 font-mono">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg bg-black hover:bg-emerald-950/60 text-emerald-400 border border-[#00ff66]/30 text-xs font-bold transition cursor-pointer"
            >
              [ CANCEL ]
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-lg bg-[#00ff66] hover:bg-[#55ff99] text-black font-['Orbitron',monospace] text-xs font-black uppercase tracking-wider shadow-[0_0_15px_#00ff66] transition cursor-pointer"
            >
              SAVE CONFIG
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

