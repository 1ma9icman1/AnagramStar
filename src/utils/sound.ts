class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Authentic physical button click (plastic tactile thump)
  public playButtonClick() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.025);

      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.025);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.025);
    } catch {}
  }

  // 8-Bit tile select blip (Game Boy pulse wave Channel 1)
  public playTileClick(pitchMultiplier: number = 1.0) {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const freq = 440 * pitchMultiplier;
      osc.type = 'square'; // Classic DMG Pulse 50%
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.setValueAtTime(freq * 1.5, this.ctx.currentTime + 0.02);

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {}
  }

  // 8-Bit tile return / deselect
  public playTileReturn() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(330, this.ctx.currentTime);
      osc.frequency.setValueAtTime(220, this.ctx.currentTime + 0.025);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {}
  }

  // 8-Bit rapid shuffle arpeggio
  public playShuffle() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99];
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.03);

        const startTime = this.ctx.currentTime + idx * 0.03;
        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.04);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.045);
      });
    } catch {}
  }

  // 8-Bit level-up / valid word chime (Ascending fanfare)
  public playValidWord(length: number = 3) {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      // Classic Game Boy ascending chords (C - E - G - B - C)
      const baseFrequencies = [
        [523.25, 659.25, 783.99], // 3-letter: C5 - E5 - G5
        [523.25, 659.25, 783.99, 1046.5], // 4-letter: + C6
        [523.25, 659.25, 783.99, 987.77, 1046.5], // 5-letter: + B5 + C6
        [523.25, 659.25, 783.99, 1046.5, 1318.51], // 6-letter: + E6
        [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98], // 7-letter: + G6 Mega Chime!
      ];

      const noteSet = baseFrequencies[Math.min(length - 3, baseFrequencies.length - 1)] || baseFrequencies[0];

      noteSet.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        const startTime = this.ctx.currentTime + idx * 0.045;
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.2, startTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.25);
      });
    } catch {}
  }

  // 8-Bit classic error buzz (Channel 4 noise / low saw)
  public playInvalidWord() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(80, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch {}
  }

  // 8-Bit Game Boy Start / Coin Chime (Iconic Nintendo startup tone)
  public playStartChime() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'square';
      osc2.type = 'square';

      // Authentic Game Boy startup "Po-ling!"
      const now = this.ctx.currentTime;
      osc1.frequency.setValueAtTime(1046.5, now); // C6
      osc2.frequency.setValueAtTime(2093.0, now + 0.12); // C7

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.setValueAtTime(0.25, now + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.12);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.85);
    } catch {}
  }

  // 8-Bit quick positive notification beep
  public playSuccessBeep() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880.0, this.ctx.currentTime + 0.05); // A5

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch {}
  }

  // 8-Bit Tick
  public playTick() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.02);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.02);
    } catch {}
  }

  // 8-Bit Game Over Fanfare
  public playGameOver() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const notes = [
        { f: 523.25, d: 0.12 }, // C5
        { f: 392.0, d: 0.12 },  // G4
        { f: 329.63, d: 0.12 }, // E4
        { f: 440.0, d: 0.15 },  // A4
        { f: 493.88, d: 0.15 }, // B4
        { f: 440.0, d: 0.15 },  // A4
        { f: 415.3, d: 0.15 },  // Ab4
        { f: 466.16, d: 0.15 }, // Bb4
        { f: 415.3, d: 0.15 },  // Ab4
        { f: 392.0, d: 0.35 },  // G4
      ];

      let elapsed = 0;
      notes.forEach((note) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        const startTime = this.ctx.currentTime + elapsed;
        osc.frequency.setValueAtTime(note.f, startTime);

        gain.gain.setValueAtTime(0.18, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + note.d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + note.d);
        elapsed += note.d * 0.9;
      });
    } catch {}
  }

  // ==========================================
  // NOKIA 3310 MONOPHONIC SOUND EFFECTS
  // ==========================================

  // Legendary Monophonic Nokia Tune (Gran Vals by Francisco Tárrega)
  public playNokiaTune() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      // Classic Nokia 3310 ringtone note frequencies and durations
      const notes = [
        { f: 1318.51, d: 0.14 }, // E6
        { f: 1174.66, d: 0.14 }, // D6
        { f: 739.99,  d: 0.28 }, // F#5
        { f: 830.61,  d: 0.28 }, // G#5
        { f: 1108.73, d: 0.14 }, // C#6
        { f: 987.77,  d: 0.14 }, // B5
        { f: 587.33,  d: 0.28 }, // D5
        { f: 659.25,  d: 0.28 }, // E5
        { f: 987.77,  d: 0.14 }, // B5
        { f: 880.00,  d: 0.14 }, // A5
        { f: 554.37,  d: 0.28 }, // C#5
        { f: 659.25,  d: 0.28 }, // E5
        { f: 880.00,  d: 0.55 }, // A5 (finale hold)
      ];

      let elapsed = 0;
      notes.forEach((note) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square'; // Authentic Nokia piezo buzzer tone
        const startTime = this.ctx.currentTime + elapsed;
        osc.frequency.setValueAtTime(note.f, startTime);

        gain.gain.setValueAtTime(0.18, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + note.d * 0.95);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + note.d);
        elapsed += note.d * 1.05;
      });
    } catch {}
  }

  // Classic Nokia Keypad Beep (Monophonic DTMF-like pure beep)
  public playNokiaKeyBeep(keyNumber?: number | string) {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Slightly varying frequencies for 1-9 keypad feel
      let freq = 1200;
      if (typeof keyNumber === 'number') {
        freq = 800 + keyNumber * 75;
      } else if (keyNumber === '*') {
        freq = 750;
      } else if (keyNumber === '#') {
        freq = 1500;
      }

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.14, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.045);
    } catch {}
  }

  // Nokia SMS Alert (Morse Code for SMS: ... -- ...)
  public playNokiaSMS() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const f = 1400; // Classic high piercing SMS beep
      const pattern = [
        { type: 'dot', d: 0.06, g: 0.04 },
        { type: 'dot', d: 0.06, g: 0.04 },
        { type: 'dot', d: 0.06, g: 0.12 },
        { type: 'dash', d: 0.16, g: 0.06 },
        { type: 'dash', d: 0.16, g: 0.12 },
        { type: 'dot', d: 0.06, g: 0.04 },
        { type: 'dot', d: 0.06, g: 0.04 },
        { type: 'dot', d: 0.06, g: 0.04 },
      ];

      let elapsed = 0;
      pattern.forEach((p) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        const startTime = this.ctx.currentTime + elapsed;
        osc.frequency.setValueAtTime(f, startTime);

        gain.gain.setValueAtTime(0.15, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + p.d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + p.d);
        elapsed += p.d + p.g;
      });
    } catch {}
  }

  // Nokia Snake Eating Crunch / High Blip
  public playNokiaSnakeBite() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(987.77, this.ctx.currentTime); // B5
      osc.frequency.setValueAtTime(1975.53, this.ctx.currentTime + 0.03); // B6

      gain.gain.setValueAtTime(0.16, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.07);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.075);
    } catch {}
  }

  // Nokia Low Battery / Error Boop-Boop
  public playNokiaError() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const beeps = [400, 300];
      beeps.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        const startTime = this.ctx.currentTime + idx * 0.09;
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.07);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.08);
      });
    } catch {}
  }
  // Voice synthesis and audio for secret unlocked
  public speakSecretUnlocked() {
    if (!this.enabled) return;

    // 1. Web Speech API voice synthesis: "Secret unlocked"
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance('Secret unlocked');
        utterance.rate = 0.92;
        utterance.pitch = 1.15;
        utterance.volume = 1.0;

        const setVoiceAndSpeak = () => {
          const voices = window.speechSynthesis.getVoices();
          const preferredVoice =
            voices.find(
              (v) =>
                v.lang.startsWith('en') &&
                (v.name.includes('Google') ||
                  v.name.includes('Natural') ||
                  v.name.includes('Samantha') ||
                  v.name.includes('Daniel') ||
                  v.name.includes('Alex') ||
                  v.name.includes('Zira') ||
                  v.name.includes('David'))
            ) || voices.find((v) => v.lang.startsWith('en'));

          if (preferredVoice) {
            utterance.voice = preferredVoice;
          }
          window.speechSynthesis.speak(utterance);
        };

        if (window.speechSynthesis.getVoices().length > 0) {
          setVoiceAndSpeak();
        } else {
          window.speechSynthesis.onvoiceschanged = () => {
            setVoiceAndSpeak();
          };
          // Fallback trigger if onvoiceschanged doesn't fire immediately
          setTimeout(setVoiceAndSpeak, 50);
        }
      } catch (e) {
        console.warn('Speech synthesis error', e);
      }
    }

    // 2. Cyber Melodic Chime & Fanfare
    try {
      this.initCtx();
      if (!this.ctx) return;

      const chordNotes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98, 2093.0];
      chordNotes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        const startTime = this.ctx.currentTime + idx * 0.06;
        osc.frequency.setValueAtTime(freq, startTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.02, startTime + 0.4);

        gain.gain.setValueAtTime(0.22, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.65);
      });
    } catch {}
  }

  // Hacker Cyber Unlock Synth Arpeggio & Matrix Beep Sequence
  public playHackerUnlock() {
    if (!this.enabled) return;
    this.speakSecretUnlocked();
    try {
      this.initCtx();
      if (!this.ctx) return;

      const notes = [220, 330, 440, 554.37, 659.25, 880, 1108.73, 1318.51, 1760];
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        const startTime = this.ctx.currentTime + idx * 0.045;
        osc.frequency.setValueAtTime(freq, startTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.05, startTime + 0.04);

        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.09);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.1);
      });

      // Final matrix bass pulse & shimmer
      setTimeout(() => {
        if (!this.ctx) return;
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(110, this.ctx.currentTime);
        bassOsc.frequency.exponentialRampToValueAtTime(55, this.ctx.currentTime + 0.4);

        bassGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        bassGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);

        bassOsc.connect(bassGain);
        bassGain.connect(this.ctx.destination);
        bassOsc.start();
        bassOsc.stop(this.ctx.currentTime + 0.45);
      }, 400);
    } catch {}
  }

  // 2-Player Countdown Tick & Match Start Beep
  public playCountdownBeep(isFinal: boolean = false) {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const freq = isFinal ? 880 : 440;
      const duration = isFinal ? 0.35 : 0.12;

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      if (isFinal) {
        osc.frequency.exponentialRampToValueAtTime(1320, this.ctx.currentTime + 0.1);
      }

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {}
  }

  // Opponent Scored / Found Word in 2-Player Match
  public playOpponentFoundWord() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(480, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch {}
  }
}

export const sound = new SoundEngine();
