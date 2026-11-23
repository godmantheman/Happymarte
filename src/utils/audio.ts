/**
 * Web Audio API synthesized sound effects and Speech Synthesis (TTS)
 * Includes sparkling Christmas chime harmonics during Christmas Market season
 */
import { isChristmasSeason } from './seasonTheme';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Gentle pleasant chime (sparkling bell tone during Christmas)
export function playCartSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const christmas = isChristmasSeason();

    if (christmas) {
      const notes = [659.25, 987.77]; // E5 -> B5 sparkling bell
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        gain.gain.setValueAtTime(0.14, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.24);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.24);
      });
      return;
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12); // E5

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  } catch (e) {
    console.debug('Audio play failed', e);
  }
}

// Joyful success chime (festive holiday arpeggio during Christmas)
export function playPurchaseSuccessSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = isChristmasSeason()
      ? [659.25, 659.25, 659.25, 783.99, 1046.5] // Festive jingle cadence
      : [523.25, 659.25, 783.99, 1046.5];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + idx * (isChristmasSeason() ? 0.095 : 0.1);
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.28);
    });
  } catch (e) {
    console.debug('Audio play failed', e);
  }
}

// Notification chime for the teacher when a new order arrives
export function playNewOrderChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = isChristmasSeason()
      ? [783.99, 987.77, 1318.51] // G5, B5, E6 sleigh bell chime
      : [659.25, 880, 1046.5];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);

      gain.gain.setValueAtTime(0.22, now + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.14 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 0.35);
    });
  } catch (e) {
    console.debug('Audio play failed', e);
  }
}

// Approval sound
export function playApprovalSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [587.33, 880]; // D5, A5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0.18, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.12 + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.3);
    });
  } catch (e) {
    console.debug('Audio play failed', e);
  }
}

// Soft friendly notice when order is rejected
export function playRejectSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [440, 392]; // A4, G4
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.15);

      gain.gain.setValueAtTime(0.15, now + idx * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.15 + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.15);
      osc.stop(now + idx * 0.15 + 0.25);
    });
  } catch (e) {
    console.debug('Audio play failed', e);
  }
}

// Text to speech helper for Special Education students
export function speakText(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.9;
    utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.debug('TTS failed', e);
  }
}
