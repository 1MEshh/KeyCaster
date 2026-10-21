<div align="center">

# 🎙️ KeyCaster 3.5

### Acoustic SRS Typing, Bilingual Arabic Dictation, CDPR Cyberpunk Aesthetics & Speedrun Mastery

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js 15](https://img.shields.io/badge/Next.js-15.1.7-black?logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0.0-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-blueviolet)](https://github.com/1MEshh/KeyCaster)
[![Storage](https://img.shields.io/badge/Storage-IndexedDB_%2F_Dexie.js-orange)](https://dexie.org/)
[![Tests](https://img.shields.io/badge/Tests-115%20Passing-success)](https://github.com/1MEshh/KeyCaster)
[![Privacy](https://img.shields.io/badge/Privacy-100%25_Local--First-success)](https://github.com/1MEshh/KeyCaster)

<p align="center">
  <b>KeyCaster 3.5</b> elevates touch typing and spelling into a comprehensive <b>bilingual fluency & speedrun platform</b>.<br/>
  Featuring <b>80 Bilingual Sentences with Phonetics & Vocab</b>, <b>CDPR Cyberpunk 2077 Telemetry HUD</b>, <b>Workman & Colemak-DH Keyboards</b>,<br/>
  <b>Kailh Box Navy Switch Synthesis</b>, <b>Interactive Speech Rate & Pitch Tuning</b>, <b>Self-Healing Error Boundary</b>, and <b>Markdown & CSV Scorecard Exports</b>.
</p>

[KeyCaster 3.5 Highlights](#-keycaster-35-highlights) • [4-in-1 Section Architecture](#-4-in-1-section-architecture) • [Anti-Slop Design Philosophy](#-anti-slop-design-philosophy) • [Global Shortcuts](#-global-shortcuts) • [Getting Started](#-getting-started) • [License](#-license)

---

</div>

## 🌟 KeyCaster 3.5 Highlights

KeyCaster 3.5 delivers an uncompromising, professional-grade typing experience:

1. **🌐 Expanded Bilingual Arabic Dictation (80 Curated Sentences)**:
   - 80 bilingual sentence pairs across 4 core domains (`daily`, `tech`, `wisdom`, `business`).
   - Authentic **Thmanyah Sans** (`ثمانية`) typography with native RTL rendering.
   - Arabic Tashkeel (diacritics / تشكيل) toggle button to switch between vowelled and simplified script.
   - Syllable and phonetic breakdowns with vocabulary flashcards and interactive search filter.

2. **🤖 Authentic CDPR Cyberpunk 2077 Theme & Telemetry HUD**:
   - Electric Yellow (`#fcee09`), Kiroshi Cyan (`#00f0ff`), and Arasaka Red (`#ff003c`) authentic CDPR palette.
   - Real-time Netrunner HUD telemetry ribbon, cyber reticle crosshairs cursor, and CRT scanlines.

3. **⌨️ Expanded Ergonomic Keyboard Layouts (Workman & Colemak-DH)**:
   - Dynamic virtual keyboard with real-time finger placement and error heatmaps.
   - Native support for QWERTY, Dvorak, Colemak, Workman, and Colemak-DH layouts.

4. **🔊 Acoustic Mechanical Switch Synthesis & Kailh Box Navy**:
   - Web Audio procedural synthesis: **Kailh Box Navy** (thick clickbar pop), **Holy Panda**, **Cream Linear**, **Cherry MX Blue**, and **Gateron Ink Black**.
   - Interactive HUD speech rate badge (`0.8x`–`1.25x`), speech pitch adjustment slider (`0.5x`–`1.8x`), and auto-replay on error toggle.
   - Interactive audio feedback on volume adjustments.

5. **🏎️ Speedrun Gates, Caret Customization & Live HUD**:
   - Minimum WPM speed gate threshold alerts (30, 50, 70, 90 WPM).
   - Real-time Keystrokes-Per-Second (KPS) chip alongside Live WPM and Accuracy.
   - Customizable caret blink styles (`smooth`, `rapid`, `solid`) across all 4 stages including Arcade Speedrun.
   - Streak milestone tier badges (Rookie, Apprentice, Specialist, Grandmaster, Legendary).

6. **🔍 Dynamic Command Matrix Dictionary Lookup & Scorecard Exports**:
   - Instant vocabulary lookups directly inside Command Palette (<kbd>⌘K</kbd>) with quick jump to dictation.
   - 1-click Markdown scorecard report (`.md`), PNG summary card, and RFC 4180 CSV spreadsheet export across all stages.
   - Solarized Dark and Espresso Roast warm themes exposed in both TopNav and Settings pickers.

7. **🛡️ Resilient Client Architecture & 115 Automated Tests**:
   - Strict React 19 hook-order invariants, defensive `localStorage` theme fallbacks, and self-healing `AppErrorBoundary` recovery.
   - 100% test pass rate across SM-2 calculations, sentence WPM math, bilingual schemas, Markdown/CSV exporters, and layout engines.

---

## 🎯 4-in-1 Section Architecture

| Section | Focus | Audio / Visual Experience |
|---|---|---|
| **SRS Words** | Vocabulary & orthographic muscle memory | Speech synthesis + procedural mechanical switch sounds + SM-2 spaced repetition |
| **Sentences** | Natural typing cadence, punctuation, and rhythm | Full sentence TTS narration + multi-line caret tracking + pace car ghost |
| **Arabic Dictation** | Bilingual fluency & cognitive translation | Arabic cue in Thmanyah Sans + English TTS dictation + vocab cards (<kbd>Alt+H</kbd>) |
| **Arcade Modes** | High-intensity reaction & endurance | 60s Time Attack, Sudden Death (1 error = game over), and Zen Endless mode with XP progression |

---

## 💎 Anti-Slop Design Philosophy

KeyCaster strictly adheres to production-grade, human-crafted frontend aesthetics:
- **No Card Soup**: Clean spatial rhythm using an authentic 8pt layout grid.
- **High-Density Utility (Linear / Raycast)**: Subtle 1px borders (`border-white/[0.08]`), deep charcoal surfaces, and tactile micro-interactions.
- **Typography Excellence**: High-contrast pairing of **Thmanyah Sans** (for Arabic cues) and **JetBrains Mono** / **Geist Mono** (for English monospace typing).
- **Accessible Contrast**: Strict adherence to WCAG AA contrast ratios ($\ge 4.5:1$) with `aria-live` screen reader stage progress announcements.

---

## ⌨️ Global Shortcuts

| Shortcut | Action |
|---|---|
| <kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd> | Open Raycast Command Palette & Dictionary Matrix |
| <kbd>Ctrl+M</kbd> / <kbd>⌘M</kbd> | Quick Mute / Unmute Audio (remembers previous volume level) |
| <kbd>Alt+Z</kbd> / <kbd>Ctrl+Shift+F</kbd> | Toggle Zen Distraction-Free Flow Mode |
| <kbd>Alt+G</kbd> | Toggle Guided Mode (faint target words) in Translation Stage |
| <kbd>Alt+S</kbd> | Cycle Speech Rate (0.8x → 0.95x → 1.1x → 1.25x) |
| <kbd>Ctrl+B</kbd> | Toggle Virtual Keyboard with Finger Placement & Error Heatmap |
| <kbd>Tab</kbd> | Replay remaining audio cue to end of sentence |
| <kbd>Shift</kbd> + <kbd>Tab</kbd> | Replay slow-motion audio pronunciation (0.72x) |
| <kbd>Alt</kbd> + <kbd>H</kbd> / <kbd>Ctrl</kbd> + <kbd>H</kbd> | Toggle vocabulary flashcards & hints |
| <kbd>Ctrl</kbd> + <kbd>1</kbd> | Switch to **SRS Words** |
| <kbd>Ctrl</kbd> + <kbd>2</kbd> | Switch to **Sentences** |
| <kbd>Ctrl</kbd> + <kbd>3</kbd> | Switch to **Arabic Dictation & Translation** |
| <kbd>Ctrl</kbd> + <kbd>4</kbd> | Switch to **Arcade Speedrun** |
| <kbd>Ctrl</kbd> + <kbd>,</kbd> | Open Settings Drawer |
| <kbd>Ctrl</kbd> + <kbd>D</kbd> | Open Progress & Analytics Dashboard |
| <kbd>Esc</kbd> | Exit Zen Mode / Close Modals |

---

## 📄 License

KeyCaster is open-source software licensed under the [MIT License](LICENSE).

