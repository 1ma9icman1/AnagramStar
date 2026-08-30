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
}

export const sound = new SoundEngine();
