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
