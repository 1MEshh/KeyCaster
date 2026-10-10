import test from "node:test";
import assert from "node:assert/strict";
import { formatBytes, getStorageHealthEstimate } from "../backupHealth";

test("backupHealth: formatBytes correctly formats KB, MB, and GB bounds", () => {
  assert.equal(formatBytes(0), "0 KB");
  assert.equal(formatBytes(-100), "0 KB");
  assert.equal(formatBytes(512 * 1024), "512.0 KB");
  assert.equal(formatBytes(2.5 * 1024 * 1024), "2.5 MB");
  assert.equal(formatBytes(4 * 1024 * 1024 * 1024), "4.0 GB");
});

test("backupHealth: getStorageHealthEstimate executes safely without throwing in node environment", async () => {
  const estimate = await getStorageHealthEstimate();
  assert.equal(typeof estimate.usedMb, "number");
  assert.equal(typeof estimate.percentUsed, "number");
  assert.equal(estimate.isAvailable, true);
  assert.equal(typeof estimate.tableCounts.words, "number");
});
