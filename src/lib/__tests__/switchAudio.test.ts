import test from "node:test";
import assert from "node:assert/strict";
import {
  playMechanicalClick,
  playStreakChord,
  playSuccessChime,
  TTSController,
  getNoiseBuffer,
  getCachedAudioBuffer,
  getAudioBufferCacheSize,
  clearAudioBufferCache,
  type SwitchSoundProfile,
} from "../audio";

test("Switch Audio: gracefully handles execution without audio context (SSR / headless)", () => {
  const switchProfiles: SwitchSoundProfile[] = [
    "cherry_brown",
    "cherry_blue",
    "gateron_ink_black",
    "topre_capacitive",
    "typewriter",
    "holy_panda",
    "cream_linear",
  ];

  for (const profile of switchProfiles) {
    assert.doesNotThrow(() => {
      playMechanicalClick(0.5, profile);
      playMechanicalClick(0.5, profile, "k"); // test keyChar jitter
    }, `Switch profile '${profile}' threw error in headless environment`);
  }
});

test("Switch Audio: gracefully handles zero or negative volume", () => {
  assert.doesNotThrow(() => {
    playMechanicalClick(0, "cherry_blue");
    playMechanicalClick(-0.5, "typewriter");
  });
});

test("Harmonic Synthesizer: playStreakChord handles milestone thresholds and non-browser env", () => {
  const streaks = [5, 10, 25, 50, 100, 250];
  for (const streak of streaks) {
    assert.doesNotThrow(() => {
      playStreakChord(streak, 0.5);
      playStreakChord(streak, 0); // muted
    }, `playStreakChord failed on streak ${streak}`);
  }
});

test("Harmonic Synthesizer: playSuccessChime handles headless runtime without errors", () => {
  assert.doesNotThrow(() => {
    playSuccessChime(0.5);
    playSuccessChime(0);
    playSuccessChime(-1);
  });
});

test("TTSController: speakArabic gracefully handles headless/SSR environment without throwing", () => {
  assert.doesNotThrow(() => {
    TTSController.speakArabic("مرحبا بالعالم", { rate: 0.9 });
    TTSController.speakArabic("", {});
  });
});

test("Procedural Audio: caches synthesized audio buffers to minimize GC allocations", () => {
  clearAudioBufferCache();
  assert.equal(getAudioBufferCacheSize(), 0);

  const mockCtx = {
    sampleRate: 44100,
    createBuffer: (_channels: number, length: number, sampleRate: number) => {
      const data = new Float32Array(length);
      return {
        numberOfChannels: _channels,
        length,
        sampleRate,
        getChannelData: () => data,
      } as unknown as AudioBuffer;
    },
  } as unknown as AudioContext;

  const buf1 = getNoiseBuffer(mockCtx, 0);
  assert.ok(buf1);
  assert.equal(getAudioBufferCacheSize(), 1);

  // Subsequent call for same variant should reuse cached buffer
  const buf2 = getNoiseBuffer(mockCtx, 0);
  assert.strictEqual(buf1, buf2);
  assert.equal(getAudioBufferCacheSize(), 1);

  clearAudioBufferCache();
  assert.equal(getAudioBufferCacheSize(), 0);
});

