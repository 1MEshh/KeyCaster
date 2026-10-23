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

test("Procedural Audio: multi-variant buffer caching partitions variants and sample rates cleanly", () => {
  clearAudioBufferCache();

  const createMockContext = (sampleRate: number) =>
    ({
      sampleRate,
      createBuffer: (_channels: number, length: number, sr: number) => {
        const data = new Float32Array(length);
        return {
          numberOfChannels: _channels,
          length,
          sampleRate: sr,
          getChannelData: () => data,
        } as unknown as AudioBuffer;
      },
    } as unknown as AudioContext);

  const ctx44k = createMockContext(44100);
  const ctx48k = createMockContext(48000);

  // Generate 4 distinct variants at 44.1kHz
  const v0 = getNoiseBuffer(ctx44k, 0);
  const v1 = getNoiseBuffer(ctx44k, 1);
  const v2 = getNoiseBuffer(ctx44k, 2);
  const v3 = getNoiseBuffer(ctx44k, 3);

  assert.notStrictEqual(v0, v1);
  assert.notStrictEqual(v1, v2);
  assert.equal(getAudioBufferCacheSize(), 4);

  // Variant index wraps around modulo 4
  const v4 = getNoiseBuffer(ctx44k, 4);
  assert.strictEqual(v0, v4);
  assert.equal(getAudioBufferCacheSize(), 4);

  // Different sample rate uses separate cache key
  const v0_48k = getNoiseBuffer(ctx48k, 0);
  assert.notStrictEqual(v0, v0_48k);
  assert.equal(getAudioBufferCacheSize(), 5);

  clearAudioBufferCache();
  assert.equal(getAudioBufferCacheSize(), 0);
});

test("Switch Audio: edge volume states handle zero, negative, and extreme values safely", () => {
  const switchProfiles: SwitchSoundProfile[] = [
    "cherry_brown",
    "cherry_blue",
    "gateron_ink_black",
    "topre_capacitive",
    "typewriter",
    "holy_panda",
    "cream_linear",
    "box_navy",
  ];

  for (const profile of switchProfiles) {
    // Zero volume (mute state)
    assert.doesNotThrow(() => playMechanicalClick(0, profile));
    // Negative volumes
    assert.doesNotThrow(() => playMechanicalClick(-0.01, profile));
    assert.doesNotThrow(() => playMechanicalClick(-100, profile));
    // Extreme high volumes
    assert.doesNotThrow(() => playMechanicalClick(2.5, profile));
    // Tiny volume
    assert.doesNotThrow(() => playMechanicalClick(0.0001, profile));
  }
});


