import React, { useState } from 'react';
import { AppSkin } from '../types/game';
import { sound } from '../utils/sound';

interface SkinSelectModalProps {
  isOpen: boolean;
  currentSkin: AppSkin;
  onSelectSkin: (skin: AppSkin, remember: boolean) => void;
  onClose?: () => void;
  canClose?: boolean;
}

export const SkinSelectModal: React.FC<SkinSelectModalProps> = ({
  isOpen,
  currentSkin,
  onSelectSkin,
  onClose,
  canClose = true,
}) => {
  const [selectedSkin, setSelectedSkin] = useState<AppSkin>(currentSkin);
  const [rememberChoice, setRememberChoice] = useState<boolean>(true);

  if (!isOpen) return null;

  const handlePick = (skin: AppSkin) => {
    setSelectedSkin(skin);
    if (skin === 'nokia') {
      sound.playNokiaKeyBeep(5);
    } else if (skin === 'gameboy') {
      sound.playButtonClick();
    } else {
      sound.playTileClick();
    }
  };

  const handleConfirm = () => {
    if (selectedSkin === 'nokia') {
      sound.playNokiaTune();
    } else if (selectedSkin === 'gameboy') {
      sound.playStartChime();
    } else {
      sound.playShuffle();
    }
    onSelectSkin(selectedSkin, rememberChoice);
  };

  const isGb = selectedSkin === 'gameboy';
  const isNokia = selectedSkin === 'nokia';
  const isCyber = selectedSkin === 'cyber';

  let modalThemeClass = "border-[#00ff66] bg-[#050e08]/95 text-emerald-100 font-mono shadow-[0_0_30px_rgba(0,255,102,0.25)]";
  if (isGb) {
    modalThemeClass = "border-[#0f380f] bg-[#9bbc0f] text-[#0f380f] font-['Press_Start_2P',monospace] shadow-[6px_6px_0_#0f380f]";
  } else if (isNokia) {
    modalThemeClass = "border-[#18233c] bg-[#9cb885] text-[#11240e] font-['Silkscreen',monospace] shadow-[6px_6px_0_#18233c]";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-gb-pop">
      <div
        id="skin-select-modal"
        className={`w-full max-w-2xl border-2 p-4 sm:p-6 flex flex-col shadow-2xl transition-all duration-300 ${modalThemeClass}`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between pb-3 border-b-2 ${
            isGb ? 'border-[#0f380f]' : isNokia ? 'border-[#11240e]' : 'border-emerald-500/40'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg">{isGb ? '👾' : isNokia ? '📱' : '⚡'}</span>
            <div>
              <h2 className="text-xs sm:text-sm font-bold tracking-wider">
                {isGb ? 'SELECT INTERFACE' : isNokia ? 'SELECT DEVICE THEME' : 'INTERFACE SELECTION MATRIX'}
              </h2>
              <p
                className={`text-[8px] sm:text-[9px] mt-0.5 ${
                  isGb ? 'text-[#306230]' : isNokia ? 'text-[#1a3814]' : 'text-emerald-400/80'
                }`}
              >
                Choose your preferred visual & audio nostalgia experience
              </p>
            </div>
          </div>
          {canClose && onClose && (
            <button
              type="button"
              onClick={onClose}
              className={`px-2 py-1 border text-xs cursor-pointer active:scale-95 ${
                isGb
                  ? 'border-[#0f380f] bg-[#8bac0f] text-[#0f380f]'
                  : isNokia
                  ? 'border-[#11240e] bg-[#89a873] text-[#11240e]'
                  : 'border-emerald-500/50 bg-emerald-950/60 text-emerald-300 hover:border-emerald-400'
              }`}
            >
              ✕
            </button>
          )}
        </div>

        {/* 3 Skin Choice Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
          {/* 1. Game Boy DMG Skin */}
          <button
            type="button"
            onClick={() => handlePick('gameboy')}
            className={`p-3 border-2 text-left flex flex-col justify-between transition-all cursor-pointer relative overflow-hidden ${
              selectedSkin === 'gameboy'
                ? 'border-[#0f380f] bg-[#8bac0f] shadow-[3px_3px_0_#0f380f] scale-[1.02]'
                : 'border-black/30 bg-black/10 opacity-75 hover:opacity-100 hover:border-black/50'
            }`}
          >
            {selectedSkin === 'gameboy' && (
              <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-[#0f380f] text-[#9bbc0f] text-[7px] font-bold">
                ACTIVE
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-xl">🎮</span>
                <div>
                  <div className="font-bold text-xs">GAME BOY</div>
                  <div className="text-[7px] opacity-75">1989 DMG Console</div>
                </div>
              </div>

              {/* Visual preview widget */}
              <div className="my-2 p-1.5 border border-[#0f380f] bg-[#9bbc0f] text-[#0f380f] text-[7px] space-y-1">
                <div className="flex justify-between items-center border-b border-[#0f380f]/30 pb-0.5 text-[6px]">
                  <span>DMG-01</span>
                  <span>● BATTERY</span>
                </div>
                <div className="flex gap-1 justify-center py-1">
                  {['W', 'O', 'R', 'D'].map((char, i) => (
                    <span
                      key={i}
                      className="px-1 py-0.5 border border-[#0f380f] bg-[#8bac0f] font-bold text-[7px]"
                    >
                      {char}
                    </span>
                  ))}
                </div>
              </div>

              <ul className="text-[7px] space-y-0.5 mt-2 opacity-90">
                <li>• DMG-01 console chassis</li>
                <li>• Physical D-Pad & A/B</li>
                <li>• 4 Dot-Matrix LCD palettes</li>
                <li>• 8-bit pulse wave chiptunes</li>
              </ul>
            </div>
          </button>

          {/* 2. Nokia 3310 Retro Phone Skin */}
          <button
            type="button"
            onClick={() => handlePick('nokia')}
            className={`p-3 border-2 text-left flex flex-col justify-between transition-all cursor-pointer relative overflow-hidden ${
              selectedSkin === 'nokia'
                ? 'border-[#18233c] bg-[#89a873] shadow-[3px_3px_0_#18233c] scale-[1.02]'
                : 'border-black/30 bg-black/10 opacity-75 hover:opacity-100 hover:border-black/50'
            }`}
          >
            {selectedSkin === 'nokia' && (
              <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-[#18233c] text-[#9cb885] text-[7px] font-bold">
                ACTIVE
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-xl">📱</span>
                <div>
                  <div className="font-bold text-xs text-[#11240e]">NOKIA 3310</div>
                  <div className="text-[7px] opacity-75">2000 Brick Phone</div>
                </div>
              </div>

              {/* Visual preview widget */}
              <div className="my-2 p-1.5 border border-[#11240e] bg-[#9cb885] text-[#11240e] text-[7px] space-y-1">
                <div className="flex justify-between items-center border-b border-[#11240e]/30 pb-0.5 text-[6px]">
                  <span>📶 IIII</span>
                  <span>[||||]</span>
                </div>
                <div className="flex gap-1 justify-center py-1">
                  {['S', 'N', 'A', 'K'].map((char, i) => (
                    <span
                      key={i}
                      className="px-1 py-0.5 border border-[#11240e] bg-[#a9c792] font-bold text-[7px]"
                    >
                      {char}
                    </span>
                  ))}
                </div>
              </div>

              <ul className="text-[7px] space-y-0.5 mt-2 opacity-90">
                <li>• Iconic Navy Blue chassis</li>
                <li>• 12-key keypad + Navi-key</li>
                <li>• Gran Vals Nokia Tune</li>
                <li>• Monophonic key beeps</li>
              </ul>
            </div>
          </button>

          {/* 3. Cyber Matrix Skin */}
          <button
            type="button"
            onClick={() => handlePick('cyber')}
            className={`p-3 border-2 text-left flex flex-col justify-between transition-all cursor-pointer relative overflow-hidden ${
              selectedSkin === 'cyber'
                ? 'border-[#00ff66] bg-[#00ff66]/10 shadow-[0_0_20px_rgba(0,255,102,0.3)] scale-[1.02]'
                : 'border-emerald-900/40 bg-emerald-950/20 opacity-75 hover:opacity-100 hover:border-emerald-700/60'
            }`}
          >
            {selectedSkin === 'cyber' && (
              <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-[#00ff66] text-black text-[7px] font-bold">
                ACTIVE
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-xl">💻</span>
                <div>
                  <div className="font-bold text-xs text-[#00ff66]">CYBER MATRIX</div>
                  <div className="text-[7px] text-emerald-400/70">Original Terminal HUD</div>
                </div>
              </div>

              {/* Visual preview widget */}
              <div className="my-2 p-1.5 border border-[#00ff66]/50 bg-black/60 text-[#00ff66] text-[7px] space-y-1">
                <div className="flex justify-between items-center border-b border-emerald-800/40 pb-0.5 text-[6px]">
                  <span>CYBER DECK</span>
                  <span className="text-emerald-400">⚡ LIVE</span>
                </div>
                <div className="flex gap-1 justify-center py-1">
                  {['H', 'A', 'C', 'K'].map((char, i) => (
                    <span
                      key={i}
                      className="px-1 py-0.5 border border-[#00ff66] bg-[#00ff66]/20 font-bold text-[7px] text-white shadow-[0_0_6px_#00ff66]"
                    >
                      {char}
                    </span>
                  ))}
                </div>
              </div>

              <ul className="text-[7px] space-y-0.5 mt-2 text-emerald-300/90">
                <li>• Dynamic digital rain</li>
                <li>• Glowing holographic tiles</li>
                <li>• High-tech telemetry HUD</li>
                <li>• Direct touch & keyboard</li>
              </ul>
            </div>
          </button>
        </div>

        {/* Remember choice toggle */}
        <label className="flex items-center gap-2 text-[8px] cursor-pointer py-1 select-none">
          <input
            type="checkbox"
            checked={rememberChoice}
            onChange={(e) => setRememberChoice(e.target.checked)}
            className="w-3.5 h-3.5 accent-[#0f380f] cursor-pointer"
          />
          <span className={isGb ? 'text-[#306230]' : isNokia ? 'text-[#1a3814]' : 'text-emerald-400'}>
            Remember preference for future launches (switch anytime via the top bar)
          </span>
        </label>

        {/* Confirmation Button */}
        <div className="pt-3 mt-2 border-t-2 border-current/20 flex gap-2">
          <button
            type="button"
            onClick={handleConfirm}
            className={`w-full py-2.5 sm:py-3 border-2 font-bold text-[9px] sm:text-[10px] text-center cursor-pointer transition-all active:scale-[0.98] ${
              isGb
                ? 'border-[#0f380f] bg-[#0f380f] text-[#9bbc0f] shadow-[3px_3px_0_#0f380f] hover:bg-[#1a551a]'
                : isNokia
                ? 'border-[#18233c] bg-[#18233c] text-[#9cb885] shadow-[3px_3px_0_#18233c] hover:bg-[#24355a]'
                : 'border-[#00ff66] bg-[#00ff66] text-black shadow-[0_0_20px_rgba(0,255,102,0.4)] hover:bg-[#33ff88]'
            }`}
          >
            ► ENTER WITH {selectedSkin === 'gameboy' ? 'GAME BOY SKIN' : selectedSkin === 'nokia' ? 'NOKIA 3310 SKIN' : 'ORIGINAL CYBER SKIN'}
          </button>
        </div>
      </div>
    </div>
  );
};

