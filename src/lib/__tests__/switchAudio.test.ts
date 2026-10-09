import test from "node:test";
import assert from "node:assert/strict";
import {
  playMechanicalClick,
  playStreakChord,
  playSuccessChime,
  TTSController,
  type SwitchSoundProfile,
} from "../audio";

test("Switch Audio: gracefully handles execution without audio context (SSR / headless)", () => {
  const switchProfiles: SwitchSoundProfile[] = [
    "cherry_brown",
    "cherry_blue",
    "gateron_ink_black",
    "topre_capacitive",
    "typewriter",
  ];

  for (const profile of switchProfiles) {
    assert.doesNotThrow(() => {
      playMechanicalClick(0.5, profile);
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
