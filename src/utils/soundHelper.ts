let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!sharedAudioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        sharedAudioCtx = new AudioCtxClass();
      }
    }
    if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume();
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

export function playChimeSound(type: 'near' | 'current' | 'urgent') {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.3, now);
    masterGain.connect(ctx.destination);

    if (type === 'urgent') {
      // Urgent Warning Chime: A5 (880Hz) -> F5 (698.46Hz) -> D5 (587.33Hz)
      const freqs = [880.0, 698.46, 587.33];
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + i * 0.15);

        noteGain.gain.setValueAtTime(0, now + i * 0.15);
        noteGain.gain.linearRampToValueAtTime(0.2, now + i * 0.15 + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.4);

        osc.connect(noteGain);
        noteGain.connect(masterGain);

        osc.start(now + i * 0.15);
        osc.stop(now + i * 0.15 + 0.45);
      });
    } else if (type === 'current') {
      // Celebratory Fanfare Chime: C6 (1046.5Hz) -> E6 (1318.5Hz) -> G6 (1567.98Hz) -> C7 (2093Hz)
      const freqs = [1046.5, 1318.5, 1567.98, 2093.0];
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.12);

        noteGain.gain.setValueAtTime(0, now + i * 0.12);
        noteGain.gain.linearRampToValueAtTime(0.25, now + i * 0.12 + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.45);

        osc.connect(noteGain);
        noteGain.connect(masterGain);

        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.5);
      });
    } else {
      // Near Chime: E5 (659.25Hz) -> B5 (987.77Hz)
      const freqs = [659.25, 987.77];
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.18);

        noteGain.gain.setValueAtTime(0, now + i * 0.18);
        noteGain.gain.linearRampToValueAtTime(0.2, now + i * 0.18 + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.18 + 0.5);

        osc.connect(noteGain);
        noteGain.connect(masterGain);

        osc.start(now + i * 0.18);
        osc.stop(now + i * 0.18 + 0.55);
      });
    }
  } catch {
    // Ignore audio playback errors
  }
}
