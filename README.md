<div align="center">

# 🎙️ KeyCaster 3.3

### Acoustic SRS Typing, Sentence Mastery, Arabic Dictation & Translation, and Human-Crafted Visuals

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js 15](https://img.shields.io/badge/Next.js-15.1.7-black?logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0.0-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-blueviolet)](https://github.com/1MEshh/KeyCaster)
[![Storage](https://img.shields.io/badge/Storage-IndexedDB_%2F_Dexie.js-orange)](https://dexie.org/)
[![Tests](https://img.shields.io/badge/Tests-109%20Passing-success)](https://github.com/1MEshh/KeyCaster)
[![Privacy](https://img.shields.io/badge/Privacy-100%25_Local--First-success)](https://github.com/1MEshh/KeyCaster)

<p align="center">
  <b>KeyCaster 3.3</b> elevates touch typing and spelling into a comprehensive <b>bilingual fluency & muscle memory platform</b>.<br/>
  Featuring <b>Live WPM Pace Car Ghost Tracking</b>, <b>Full Sentence Mastery</b>, a dedicated <b>Arabic-to-English Dictation & Translation Section (ترجمة وإملاء)</b>,<br/>
  <b>Procedural Mechanical Switch Synthesis with Keystroke Pitch Jitter</b>, <b>Cyber Aurora Canvas Shaders</b>, and local-first <b>SM-2 cognitive scheduling</b>.
</p>

[KeyCaster 3.3 Highlights](#-keycaster-33-highlights) • [4-in-1 Section Architecture](#-4-in-1-section-architecture) • [Anti-Slop Design Philosophy](#-anti-slop-design-philosophy) • [Global Shortcuts](#-global-shortcuts) • [Getting Started](#-getting-started) • [License](#-license)

---

</div>

## 🌟 KeyCaster 3.3 Highlights

KeyCaster 3.3 delivers an uncompromising, professional-grade typing experience:

1. **🏎️ Live WPM Pace Car Ghost Cursor & Speedrun Delta**:
   - Ghost caret tracks against your Personal Best (PB) or fixed target paces (60, 80, 100, 120 WPM) in real time.
   - Live split delta indicators (`-0.5s ▲` in emerald vs `+1.2s ▼` in rose) render directly beside the dynamic tachometer in Words, Sentences, and Translation stages.

2. **🌐 Arabic-to-English Translation & Dictation (قسم الترجمة والإملاء: العربية ⇄ الإنجليزية)**:
   - High-contrast Arabic prompt cards rendered in authentic **Thmanyah Sans** (`ثمانية`) with native RTL isolation.
   - Dual-speed natural speech synthesis: normal speed (<kbd>Tab</kbd>) and slow 0.72x speed (<kbd>Shift+Tab</kbd>) for fine phoneme disambiguation.
   - Intelligent diacritic tolerance and punctuation forgiveness for seamless bilingual typing.
   - 50+ curated bilingual sentence pairs across 4 domains (`daily`, `tech`, `wisdom`, `business`).

3. **🔊 Procedural Mechanical Switch Synthesizers with Keystroke Pitch Jitter**:
   - Web Audio API procedural synthesis with zero external audio samples or network latency.
   - Five distinct switch profiles: **Holy Panda** (tactile crisp bump), **Cream Linear** (silky POM pop), **Cherry MX Blue** (dual-stage click), **Gateron Ink Black** (deep creamy thock), and **Topre Capacitive** (electro-capacitive dome).
   - Character-based acoustic pitch jitter (±3.5% frequency micro-variance) eliminates acoustic repetition fatigue.

4. **📚 Curated Starter Vocabulary Packs & Deck Import/Export**:
   - Instant 1-click loading for 4 curated decks: *GRE & SAT High Frequency*, *Programming & Dev Syntax*, *Common Typing Demons*, and *Medical & Anatomical*.
   - Bidirectional JSON and plain-text (TXT) deck import/export with automated input sanitization.

5. **📊 Deep Analytics, CSV Export & Finger Ergonomics**:
   - Complete session history with RFC 4180 CSV export for external spreadsheet analysis.
   - **Finger Ergonomics Breakdown**: Error rate attribution across 8 touch typing finger zones with visual load distribution bars.
   - **1-Click Hardest Words Drill**: Launch targeted review sessions for words needing reinforcement straight from the dashboard.

6. **🌌 Zero AI-Slop Ambient Canvas Shaders (`AmbientCanvas.tsx`)**:
   - High-performance, GPU-accelerated HTML5 interactive background canvas.
   - Modes: **Cyber Aurora Borealis** (undulating chromatic wave mesh), **Matrix Digital Rain**, **Cyber Sine Wave**, **Cyber Horizon Grid**, and **Kinetic Constellations**.
   - Auto-adapts to active themes including **Matrix CRT Green**, **Tokyo Night Neon**, **Midnight Deep**, **Dracula**, **Nord**, and **Monochrome Minimal**.

7. **🛡️ 109 Comprehensive Unit & Integration Tests**:
   - 100% test pass rate covering SM-2 calculations, sentence WPM math, bilingual translations, contractions, audio synthesis, pace car splits, and privacy guards.

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
- **Accessible Contrast**: Strict adherence to WCAG AA contrast ratios ($\ge 4.5:1$) across all themes.

---

## ⌨️ Global Shortcuts

| Shortcut | Action |
|---|---|
| <kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd> | Open Raycast Command Palette |
| <kbd>Ctrl+M</kbd> / <kbd>⌘M</kbd> | Quick Mute / Unmute Audio (remembers previous volume level) |
| <kbd>Alt+Z</kbd> / <kbd>Ctrl+Shift+F</kbd> | Toggle Zen Distraction-Free Flow Mode |
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
