let audioCtx = null;
let isMuted = false;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  return audioCtx;
}

function playTone(frequency, type, duration, volume = 0.1) {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {}
}

export function playClickSound() {
  playTone(545, 'sine', 0.075, 0.1);
}

export function playFlagSound() {
  playTone(711, 'triangle', 0.095, 0.09);
}

export function playExplosionSound() {
  playTone(66, 'sawtooth', 0.75, 0.15);
}

export function playWinSound() {
  playTone(523, 'sine', 0.12, 0.15);
  setTimeout(() => playTone(659, 'sine', 0.12, 0.15), 90);
  setTimeout(() => playTone(784, 'sine', 0.12, 0.15), 180);
  setTimeout(() => playTone(1046.5, 'sine', 0.35, 0.16), 270);
}

export function toggleMute() {
  isMuted = !isMuted;
  return isMuted;
}

export function playRevealAreaSound() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(333, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(777, ctx.currentTime + 0.65);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.65);
  } catch (e) {}
}

export function playButtonSound() {
  playTone(620, 'triangle', 0.055, 0.175);
}

export function playConfirmLossSound() {
  playTone(220, 'triangle', 0.08, 0.5);
  setTimeout(() => playTone(165, 'triangle', 0.14, 0.5), 70);
}
