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

export type SwitchSoundProfile =
  | "cherry_brown"
  | "cherry_blue"
  | "gateron_ink_black"
  | "topre_capacitive"
  | "typewriter";

/**
 * Procedural Mechanical Switch Synthesizer
 * Synthesizes 5 authentic switch profiles in real-time with zero audio asset overhead:
 * - Cherry MX Brown: classic tactile bump and balanced snap
 * - Cherry MX Blue: sharp dual-stage clicky leaf click
 * - Gateron Ink Black: creamy deep low-pitched thock
 * - Topre Capacitive: smooth muted electrostatic dome pop
 * - Vintage Typewriter: heavy metallic strike and resonant carriage ping
 */
export function playMechanicalClick(
  volume = 0.5,
  switchType: SwitchSoundProfile = "cherry_brown"
): void {
  try {
    const ctx = getAudioContext();
    if (!ctx || volume <= 0) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();

    if (switchType === "cherry_blue") {
      // Crisp clicky switch: high-pitched leaf snap + sharp transient clack
      masterGain.gain.setValueAtTime(volume * 0.45, now);
      masterGain.connect(ctx.destination);

      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(4200, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.025);

      oscGain.gain.setValueAtTime(0.9, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
      osc.connect(oscGain);
      oscGain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.03);

      // Click leaf tactile rebound click (+8ms)
      const rebound = ctx.createOscillator();
      const reboundGain = ctx.createGain();
      rebound.type = "triangle";
      rebound.frequency.setValueAtTime(3200, now + 0.008);
      rebound.frequency.exponentialRampToValueAtTime(1800, now + 0.028);

      reboundGain.gain.setValueAtTime(0, now);
      reboundGain.gain.setValueAtTime(0.6, now + 0.008);
      reboundGain.gain.exponentialRampToValueAtTime(0.001, now + 0.028);
      rebound.connect(reboundGain);
      reboundGain.connect(masterGain);
      rebound.start(now + 0.008);
      rebound.stop(now + 0.035);

      // Noise clack
      const noise = ctx.createBufferSource();
      noise.buffer = getNoiseBuffer(ctx);
      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.setValueAtTime(3200, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.5, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(masterGain);
      noise.start(now);
      noise.stop(now + 0.03);
    } else if (switchType === "gateron_ink_black") {
      // Creamy deep lubed thock: low-pass body + damp sub-thump
      masterGain.gain.setValueAtTime(volume * 0.55, now);
      masterGain.connect(ctx.destination);

      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(130, now + 0.065);

      oscGain.gain.setValueAtTime(1.0, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
      osc.connect(oscGain);
      oscGain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.07);

      // Dampened housing noise
      const noise = ctx.createBufferSource();
      noise.buffer = getNoiseBuffer(ctx);
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(700, now);
      filter.Q.setValueAtTime(2.5, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.8, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(masterGain);
      noise.start(now);
      noise.stop(now + 0.05);
    } else if (switchType === "topre_capacitive") {
      // Electrostatic dome pop: smooth rounded pop + muted bottom-out
      masterGain.gain.setValueAtTime(volume * 0.4, now);
      masterGain.connect(ctx.destination);

      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(850, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.04);

      oscGain.gain.setValueAtTime(0.7, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(oscGain);
      oscGain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.045);

      // Rubber dome return sound
      const noise = ctx.createBufferSource();
      noise.buffer = getNoiseBuffer(ctx);
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1400, now);
      filter.Q.setValueAtTime(1.8, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.45, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(masterGain);
      noise.start(now);
      noise.stop(now + 0.035);
    } else if (switchType === "typewriter") {
      // Vintage mechanical typewriter: metal strike + resonant chassis ring
      masterGain.gain.setValueAtTime(volume * 0.5, now);
      masterGain.connect(ctx.destination);

      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(2800, now);
      osc.frequency.exponentialRampToValueAtTime(850, now + 0.035);

      oscGain.gain.setValueAtTime(0.85, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
      osc.connect(oscGain);
      oscGain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.04);

      // Resonant metal ping
      const ping = ctx.createOscillator();
      const pingGain = ctx.createGain();
      ping.type = "sine";
      ping.frequency.setValueAtTime(1950, now);
      pingGain.gain.setValueAtTime(0.3, now);
      pingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      ping.connect(pingGain);
      pingGain.connect(masterGain);
      ping.start(now);
      ping.stop(now + 0.085);

      // Mechanical lever noise
      const noise = ctx.createBufferSource();
      noise.buffer = getNoiseBuffer(ctx);
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(2200, now);
      filter.Q.setValueAtTime(1.5, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.65, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(masterGain);
      noise.start(now);
      noise.stop(now + 0.04);
    } else {
      // Default: Cherry MX Brown (balanced tactile bump)
      masterGain.gain.setValueAtTime(volume * 0.4, now);
      masterGain.connect(ctx.destination);

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
    }
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
