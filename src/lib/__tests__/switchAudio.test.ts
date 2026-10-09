import test from "node:test";
import assert from "node:assert/strict";
import { playMechanicalClick, type SwitchSoundProfile } from "../audio";

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
