import React, { useEffect, useState } from 'react';
import { Sparkles, Zap, Lock, Unlock } from 'lucide-react';

interface RainbowSecretEffectProps {
  isActive: boolean;
  durationMs?: number;
  onComplete?: () => void;
}

export const RainbowSecretEffect: React.FC<RainbowSecretEffectProps> = ({
  isActive,
  durationMs = 7000,
  onComplete,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isActive) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, durationMs);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [isActive, durationMs, onComplete]);

  if (!visible) return null;

  return (
    <div
      id="rainbow-secret-effect"
      className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center overflow-hidden"
    >
      {/* 1. Global Rainbow Hue Vignette / Ambient Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(255,0,128,0.15)_80%,rgba(0,255,200,0.2)_100%)] animate-[rainbowHue_3s_linear_infinite]" />

      {/* 2. Rotating Rainbow Aura Going Around the GUI (Large Spinning Conic Gradient Ring) */}
      <div className="absolute w-[180vw] h-[180vw] max-w-[1400px] max-h-[1400px] rounded-full opacity-35 blur-3xl pointer-events-none rainbow-spinning-conic" />
      <div className="absolute w-[140vw] h-[140vw] max-w-[1100px] max-h-[1100px] rounded-full opacity-40 blur-2xl pointer-events-none rainbow-spinning-conic-reverse" />

      {/* 3. GUI Perimeter Rotating Rainbow Border Frame */}
      <div className="relative w-full max-w-[540px] h-full max-h-[920px] m-2 pointer-events-none flex items-center justify-center">
        {/* Spinning Conic Border Layer */}
        <div className="absolute -inset-3 rounded-3xl p-[4px] overflow-hidden">
          <div className="absolute -inset-[150%] rainbow-spinning-conic opacity-90 blur-[1px]" />
          <div className="absolute inset-[3px] bg-black/20 backdrop-blur-xs rounded-3xl" />
        </div>

        {/* Outer Glow Halo with Rotating Hue & Pulse */}
        <div className="absolute -inset-4 rounded-3xl opacity-75 blur-md rainbow-spinning-conic animate-[rainbowHue_2s_linear_infinite]" />
        
        {/* Pulsing Corner Rainbow Sparkles */}
        <div className="absolute -top-3 -left-3 animate-bounce text-amber-300 drop-shadow-[0_0_8px_#ff00ea]">
          <Sparkles className="w-8 h-8 animate-spin text-yellow-300" style={{ animationDuration: '3s' }} />
        </div>
        <div className="absolute -top-3 -right-3 animate-bounce text-cyan-300 drop-shadow-[0_0_8px_#00ffea]">
          <Sparkles className="w-8 h-8 animate-spin text-pink-400" style={{ animationDuration: '2.5s' }} />
        </div>
        <div className="absolute -bottom-3 -left-3 animate-bounce text-emerald-300 drop-shadow-[0_0_8px_#00ff66]">
          <Zap className="w-8 h-8 text-emerald-300 animate-pulse" />
        </div>
        <div className="absolute -bottom-3 -right-3 animate-bounce text-purple-300 drop-shadow-[0_0_8px_#b000ff]">
          <Sparkles className="w-8 h-8 animate-spin text-purple-300" style={{ animationDuration: '4s' }} />
        </div>
      </div>

      {/* 4. Top Animated Toast / Banner with Voice Badge */}
      <div className="absolute top-4 sm:top-6 z-[110] px-4 py-2.5 rounded-full border-2 border-white/80 bg-black/90 shadow-[0_0_30px_rgba(255,255,255,0.8)] backdrop-blur-md flex items-center gap-3 animate-gb-pop">
        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-pink-500 via-amber-400 to-cyan-400 flex items-center justify-center text-black font-black shadow-[0_0_12px_#fff]">
          <Unlock className="w-4 h-4 text-black" />
        </div>
        <div className="flex flex-col">
          <div className="text-xs sm:text-sm font-black tracking-widest rainbow-text-shimmer uppercase flex items-center gap-1.5 font-mono">
            <span>✨ SECRET UNLOCKED! ✨</span>
          </div>
          <div className="text-[9px] text-emerald-300 font-mono tracking-wider">
            [MA9IC CIPHER OVERRIDE ACTIVE]
          </div>
        </div>
      </div>
    </div>
  );
};
