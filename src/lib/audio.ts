/**
 * Web Audio API Procedural Synthesizer & Web Speech API TTS Controller
 * 100% Client-Side, Zero Latency, Free Native APIs
 */

let audioCtx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;

/**
 * Initialize or resume AudioContext on user interaction
 */
export function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }

  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }

  return audioCtx;
}

/**
 * Pre-generate a 0.05s white noise buffer for switch click realism
 */
function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noiseBuffer && noiseBuffer.sampleRate === ctx.sampleRate) {
    return noiseBuffer;
  }

  const bufferSize = Math.floor(ctx.sampleRate * 0.05);
  noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }

  return noiseBuffer;
}

/**
 * Procedural Cherry MX Brown style mechanical keystroke click
 * 0.05s high-frequency oscillator click mixed with bandpass-filtered noise
 */
export function playMechanicalClick(volume = 0.5): void {
  try {
    const ctx = getAudioContext();
    if (!ctx || volume <= 0) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume * 0.4, now);
    masterGain.connect(ctx.destination);

    // 1. High frequency micro-click (oscillator transient)
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(2200, now);
    osc.frequency.exponentialRampToValueAtTime(700, now + 0.045);

    oscGain.gain.setValueAtTime(0.8, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(oscGain);
    oscGain.connect(masterGain);

    osc.start(now);
    osc.stop(now + 0.05);

    // 2. White noise burst through bandpass filter for mechanical tactility
    const noise = ctx.createBufferSource();
    noise.buffer = getNoiseBuffer(ctx);

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(2800, now);
    filter.Q.setValueAtTime(2.0, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.6, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(masterGain);

    noise.start(now);
    noise.stop(now + 0.04);
  } catch {
    // Non-blocking fallback if audio context fails
  }
}

/**
 * Procedural Error Thud: Low-pass filtered 150Hz triangle wave fading out over 0.2s
 */
export function playErrorThud(volume = 0.5): void {
  try {
    const ctx = getAudioContext();
    if (!ctx || volume <= 0) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(280, now);
    filter.Q.setValueAtTime(1.5, now);

    gain.gain.setValueAtTime(volume * 0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.21);
  } catch {
    // Non-blocking fallback
  }
}

/**
 * Speech Synthesis TTS Controller
 */
export class TTSController {
  private static activeUtterance: SpeechSynthesisUtterance | null = null;
  private static cachedVoices: SpeechSynthesisVoice[] = [];
  private static listenerAttached = false;

  public static getVoices(): SpeechSynthesisVoice[] {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];

    if (!this.listenerAttached) {
      this.listenerAttached = true;
      window.speechSynthesis.addEventListener("voiceschanged", () => {
        const v = window.speechSynthesis.getVoices();
        if (v.length > 0) {
          this.cachedVoices = v;
        }
      });
    }

    const available = window.speechSynthesis.getVoices();
    if (available.length > 0) {
      this.cachedVoices = available;
      return available;
    }

    return this.cachedVoices;
  }

  public static speakWord(
    word: string,
    options: {
      rate?: number;
      voiceURI?: string;
      slow?: boolean;
      onStart?: () => void;
      onEnd?: () => void;
    } = {}
  ): void {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(word);
      const baseRate = options.rate ?? 0.95;
      utterance.rate = options.slow ? Math.max(0.5, baseRate * 0.72) : baseRate;
      utterance.lang = "en-US";

      const voices = this.getVoices();
      if (options.voiceURI) {
        const found = voices.find((v) => v.voiceURI === options.voiceURI);
        if (found) utterance.voice = found;
      } else {
        // Prefer natural English voices if present
        const englishVoice = voices.find(
          (v) => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Natural") || v.default)
        ) || voices.find((v) => v.lang.startsWith("en"));
        if (englishVoice) utterance.voice = englishVoice;
      }

      utterance.onstart = () => {
        options.onStart?.();
      };

      utterance.onend = () => {
        options.onEnd?.();
      };

      utterance.onerror = () => {
        options.onEnd?.();
      };

      this.activeUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Non-blocking
    }
  }

  public static cancel(): void {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
  }
}
