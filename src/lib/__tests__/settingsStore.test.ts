import test from "node:test";
import assert from "node:assert/strict";
import { useSettingsStore } from "../../store/useSettingsStore";

test("useSettingsStore: manages Zen Mode toggle and state updates correctly", () => {
  const store = useSettingsStore.getState();

  // Initially false by default
  store.setIsZenMode(false);
  assert.equal(useSettingsStore.getState().isZenMode, false);

  // Toggle to true
  store.toggleZenMode();
  assert.equal(useSettingsStore.getState().isZenMode, true);

  // Toggle back to false
  store.toggleZenMode();
  assert.equal(useSettingsStore.getState().isZenMode, false);

  // Direct setter
  store.setIsZenMode(true);
  assert.equal(useSettingsStore.getState().isZenMode, true);
  store.setIsZenMode(false);
  assert.equal(useSettingsStore.getState().isZenMode, false);
});

test("useSettingsStore: handles toggleMute and preserves previous volume", () => {
  const store = useSettingsStore.getState();

  // Set known volume
  store.setSoundVolume(0.8);
  assert.equal(useSettingsStore.getState().soundVolume, 0.8);

  // Mute
  store.toggleMute();
  assert.equal(useSettingsStore.getState().soundVolume, 0);

  // Unmute should restore previous volume (0.8)
  store.toggleMute();
  assert.equal(useSettingsStore.getState().soundVolume, 0.8);

  // If set to 0 directly, toggleMute should restore 0.8 or fallback
  store.setSoundVolume(0);
  assert.equal(useSettingsStore.getState().soundVolume, 0);
  store.toggleMute();
  assert.equal(useSettingsStore.getState().soundVolume, 0.8);
});

test("useSettingsStore: handles matrix_rain and sine_wave ambientBackdrop updates", () => {
  const store = useSettingsStore.getState();

  store.setAmbientBackdrop("matrix_rain");
  assert.equal(useSettingsStore.getState().ambientBackdrop, "matrix_rain");

  store.setAmbientBackdrop("sine_wave");
  assert.equal(useSettingsStore.getState().ambientBackdrop, "sine_wave");

  store.setAmbientBackdrop("cyber_grid");
  assert.equal(useSettingsStore.getState().ambientBackdrop, "cyber_grid");
});

