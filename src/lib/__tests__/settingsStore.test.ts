import test from "node:test";
import assert from "node:assert/strict";
import { useSettingsStore, THEME_VARIABLES } from "../../store/useSettingsStore";

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

  store.setAmbientBackdrop("aurora");
  assert.equal(useSettingsStore.getState().ambientBackdrop, "aurora");

  store.setAmbientBackdrop("cyber_grid");
  assert.equal(useSettingsStore.getState().ambientBackdrop, "cyber_grid");

  store.setAmbientBackdrop("kiroshi_netrunner");
  assert.equal(useSettingsStore.getState().ambientBackdrop, "kiroshi_netrunner");
});

test("useSettingsStore: automatically engages kiroshi_netrunner backdrop when switching to cyberpunk theme", () => {
  const store = useSettingsStore.getState();

  store.setAmbientBackdrop("constellation");
  store.setTheme("cyberpunk");
  assert.equal(useSettingsStore.getState().ambientBackdrop, "kiroshi_netrunner");

  // Preserves off state if user explicitly disabled backdrops
  store.setAmbientBackdrop("off");
  store.setTheme("matrix_crt");
  store.setTheme("cyberpunk");
  assert.equal(useSettingsStore.getState().ambientBackdrop, "off");
});

test("useSettingsStore: supports matrix_crt and tokyo_night themes", () => {
  const store = useSettingsStore.getState();

  store.setTheme("matrix_crt");
  assert.equal(useSettingsStore.getState().theme, "matrix_crt");

  store.setTheme("tokyo_night");
  assert.equal(useSettingsStore.getState().theme, "tokyo_night");
});

test("useSettingsStore: cycles pace car modes through sequential sequence", () => {
  const store = useSettingsStore.getState();

  store.setPaceCarMode("off");
  assert.equal(useSettingsStore.getState().paceCarMode, "off");

  store.cyclePaceCarMode();
  assert.equal(useSettingsStore.getState().paceCarMode, "pb");

  store.cyclePaceCarMode();
  assert.equal(useSettingsStore.getState().paceCarMode, "target_60");

  store.cyclePaceCarMode();
  assert.equal(useSettingsStore.getState().paceCarMode, "target_80");

  store.cyclePaceCarMode();
  assert.equal(useSettingsStore.getState().paceCarMode, "target_100");

  store.cyclePaceCarMode();
  assert.equal(useSettingsStore.getState().paceCarMode, "target_120");

  store.cyclePaceCarMode();
  assert.equal(useSettingsStore.getState().paceCarMode, "off");
});

test("useSettingsStore: authentic CDPR Cyberpunk 2077 color palette", () => {
  assert.equal(THEME_VARIABLES.cyberpunk.main, "#fcee09"); // Electric Yellow
  assert.equal(THEME_VARIABLES.cyberpunk.caret, "#00f0ff"); // Kiroshi Cyan
  assert.equal(THEME_VARIABLES.cyberpunk.error, "#ff003c"); // Arasaka Threat Red
  assert.equal(THEME_VARIABLES.cyberpunk.bg, "#08080c"); // Braindance Obsidian
  assert.equal(THEME_VARIABLES.cyberpunk.sub, "#5a6878"); // Militech Gunmetal
});

test("useSettingsStore: manages speechPitch and cycles speechRate correctly", () => {
  const store = useSettingsStore.getState();

  store.setSpeechPitch(1.2);
  assert.equal(useSettingsStore.getState().speechPitch, 1.2);

  store.setSpeechRate(0.8);
  assert.equal(useSettingsStore.getState().speechRate, 0.8);

  store.cycleSpeechRate();
  assert.equal(useSettingsStore.getState().speechRate, 0.95);

  store.cycleSpeechRate();
  assert.equal(useSettingsStore.getState().speechRate, 1.1);

  store.cycleSpeechRate();
  assert.equal(useSettingsStore.getState().speechRate, 1.25);

  store.cycleSpeechRate();
  assert.equal(useSettingsStore.getState().speechRate, 0.8);
});

test("useSettingsStore: supports workman and colemak_dh keyboard layouts", () => {
  const store = useSettingsStore.getState();

  store.setKeyboardLayout("workman");
  assert.equal(useSettingsStore.getState().keyboardLayout, "workman");

  store.setKeyboardLayout("colemak_dh");
  assert.equal(useSettingsStore.getState().keyboardLayout, "colemak_dh");
});

test("useSettingsStore: manages autoReplayOnError and minWpmGate thresholds", () => {
  const store = useSettingsStore.getState();

  store.setAutoReplayOnError(true);
  assert.equal(useSettingsStore.getState().autoReplayOnError, true);

  store.setAutoReplayOnError(false);
  assert.equal(useSettingsStore.getState().autoReplayOnError, false);

  store.setMinWpmGate(50);
  assert.equal(useSettingsStore.getState().minWpmGate, 50);

  store.setMinWpmGate(70);
  assert.equal(useSettingsStore.getState().minWpmGate, 70);

  store.setMinWpmGate(0);
  assert.equal(useSettingsStore.getState().minWpmGate, 0);
});




