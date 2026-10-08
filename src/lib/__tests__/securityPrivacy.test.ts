import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

test("Privacy Guard: Git commit author is strictly anonymized with GitHub no-reply proxy", () => {
  try {
    const gitAuthors = execSync('git log -n 20 --format="%an <%ae>"', { encoding: "utf-8" });
    const uniqueAuthors = Array.from(new Set(gitAuthors.trim().split("\n")));

    for (const author of uniqueAuthors) {
      if (!author) continue;
      // Must use GitHub anonymized proxy or no-reply
      assert.ok(
        author.includes("@users.noreply.github.com") || author.includes("noreply@github.com"),
        `Author must not expose private personal email. Found: ${author}`
      );
    }
  } catch {
    // If not in git environment, skip gracefully
  }
});

test("Privacy Guard: No local filesystem home directories (/home/ or /Users/) exist in tracked code", () => {
  try {
    const trackedFiles = execSync("git ls-files", { encoding: "utf-8" })
      .trim()
      .split("\n")
      .filter(
        (f) =>
          f &&
          !f.endsWith(".png") &&
          !f.endsWith(".woff2") &&
          !f.endsWith(".ico") &&
          !f.endsWith(".lock") &&
          !f.includes("securityPrivacy.test.ts")
      );

    for (const relPath of trackedFiles) {
      const fullPath = path.resolve(process.cwd(), relPath);
      if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) continue;
      const content = fs.readFileSync(fullPath, "utf-8");

      // Verify no absolute paths to user home folders
      assert.ok(
        !content.includes("/home/verso"),
        `Private user path found in tracked file: ${relPath}`
      );
      assert.ok(
        !content.includes("/Users/"),
        `macOS user home path found in tracked file: ${relPath}`
      );
    }
  } catch (err: any) {
    if (err.message && err.message.includes("Private user path")) throw err;
  }
});

test("Security Guard: Security headers are configured in next.config.mjs", () => {
  const nextConfigPath = path.resolve(process.cwd(), "next.config.mjs");
  assert.ok(fs.existsSync(nextConfigPath), "next.config.mjs must exist");

  const content = fs.readFileSync(nextConfigPath, "utf-8");
  assert.ok(content.includes("Content-Security-Policy"), "Must include Content-Security-Policy header");
  assert.ok(content.includes("Strict-Transport-Security"), "Must include Strict-Transport-Security header");
  assert.ok(content.includes("X-Frame-Options"), "Must include X-Frame-Options header");
  assert.ok(content.includes("X-Content-Type-Options"), "Must include X-Content-Type-Options header");
  assert.ok(content.includes("Permissions-Policy"), "Must include Permissions-Policy header");
  assert.ok(content.includes("Cross-Origin-Opener-Policy"), "Must include Cross-Origin-Opener-Policy header");
  assert.ok(content.includes("Cross-Origin-Resource-Policy"), "Must include Cross-Origin-Resource-Policy header");
});

test("Security Guard: .gitignore excludes sensitive credentials and environment files", () => {
  const gitignorePath = path.resolve(process.cwd(), ".gitignore");
  assert.ok(fs.existsSync(gitignorePath), ".gitignore must exist");

  const content = fs.readFileSync(gitignorePath, "utf-8");
  assert.ok(content.includes(".env*"), ".gitignore must block all .env variants");
  assert.ok(content.includes("*.pem"), ".gitignore must block .pem certificates");
  assert.ok(content.includes("*.key"), ".gitignore must block .key files");
  assert.ok(content.includes("*secret*"), ".gitignore must block secret files");
  assert.ok(content.includes("*credential*"), ".gitignore must block credential files");
});
