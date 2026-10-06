<div align="center">

# 🎙️ KeyCaster 3.0

### Acoustic SRS Typing, Sentence Mastery, Arabic Dictation & Translation, and Human-Crafted Visuals

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js 15](https://img.shields.io/badge/Next.js-15.1.7-black?logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0.0-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-blueviolet)](https://github.com/1MEshh/KeyCaster)
[![Storage](https://img.shields.io/badge/Storage-IndexedDB_%2F_Dexie.js-orange)](https://dexie.org/)
[![Tests](https://img.shields.io/badge/Tests-59%20Passing-success)](https://github.com/1MEshh/KeyCaster)
[![Privacy](https://img.shields.io/badge/Privacy-100%25_Local--First-success)](https://github.com/1MEshh/KeyCaster)

<p align="center">
  <b>KeyCaster 3.0</b> elevates spelling and typing practice into a comprehensive <b>bilingual fluency & muscle memory platform</b>.<br/>
  Featuring <b>Full Sentence Mastery</b>, a dedicated <b>Arabic-to-English Dictation & Translation Section (ترجمة وإملاء)</b>,<br/>
  a GPU-accelerated <b>Interactive Ambient Canvas Backdrop</b> (Zero AI Slop), and local-first <b>SM-2 cognitive scheduling</b>.
</p>

[KeyCaster 3.0 Highlights](#-keycaster-30-highlights) • [4-in-1 Section Architecture](#-4-in-1-section-architecture) • [Anti-Slop Design Philosophy](#-anti-slop-design-philosophy) • [Global Shortcuts](#-global-shortcuts) • [Getting Started](#-getting-started) • [License](#-license)

---

</div>

## 🌟 KeyCaster 3.0 Highlights

KeyCaster 3.0 takes the app to the next level with groundbreaking features:

1. **✍️ Full Sentence Typing Engine**:
   - Multi-line word-wrap fluid caret tracking with zero layout shifts.
   - Intelligent space advancement: completes valid words and handles punctuation gracefully.
   - Punctuation & contraction tolerance: smart matching for curly vs straight quotes (`’` ↔ `'`, `“”` ↔ `"`), hyphens, and dashes.
   - Curated English sentence dataset (40+ sentences across conversation, programming, philosophy, and literature).

2. **🌐 Arabic-to-English Translation & Dictation (قسم الترجمة والإملاء: العربية ⇄ الإنجليزية)**:
   - High-contrast Arabic prompt cards rendered in authentic **Thmanyah Sans** (`ثمانية`) with native RTL isolation.
   - **Dual Dictation Modes**:
     - *Audio Dictation*: Listen to the English pronunciation via TTS while reading the Arabic contextual prompt.
     - *Blind Translation*: Translate the Arabic sentence into English from memory with hints via <kbd>Alt+H</kbd>.
   - 50+ curated bilingual sentence pairs across 4 domains (`daily`, `tech`, `wisdom`, `business`).
   - Contraction expansion (`don't` ↔ `do not`, `I'm` ↔ `I am`), alternative translations support, and bilingual vocabulary flashcards.

3. **🎨 Zero AI-Slop Ambient Canvas Backdrop (`AmbientCanvas.tsx`)**:
   - High-performance, GPU-accelerated HTML5 interactive background canvas.
   - **Zero AI Clichés**: No generic purple/cyan blur blobs. Pure mathematical kinetic geometry.
   - 3 dynamic styles:
     - **Constellation**: Connected kinetic nodes reacting to typing energy.
     - **Grid**: Linear-inspired high-density dot mesh with concentric keystroke shockwaves.
     - **Particles**: Subtle organic drifting dust motes.
   - Auto-adapts to active theme colors (`Midnight`, `Nord`, `Dracula`, `Serika Dark`, `Monochrome`).
   - Pauses when tab is hidden; respects `prefers-reduced-motion`.

4. **🚀 Unified 4-in-1 Navigation**:
   - High-density Linear/Raycast top navigation with instant section switching:
     - 📖 **SRS Words** (<kbd>Ctrl+1</kbd>)
     - ✍️ **Sentences** (<kbd>Ctrl+2</kbd>)
     - 🌐 **Arabic Dictation** (<kbd>Ctrl+3</kbd>)
     - ⚡ **Arcade Speedrun** (<kbd>Ctrl+4</kbd>)

5. **🐢 Slow-Motion Pronunciation Engine**:
   - Dual-speed speech synthesis: normal speed and slow 0.72x speed via <kbd>Shift+Tab</kbd>.
   - Instant auditory phonetic disambiguation for homophones and subtle phonemes.

6. **🛡️ 59 Comprehensive Unit & Integration Tests**:
   - 100% test pass rate covering SM-2 calculations, sentence WPM math, bilingual translations, contractions, and error boundaries.

---

## 🎯 4-in-1 Section Architecture

| Section | Focus | Audio / Visual Experience |
|---|---|---|
| **SRS Words** | Vocabulary & orthographic muscle memory | Speech synthesis + procedural mechanical switch sounds + SM-2 spaced repetition |
| **Sentences** | Natural typing cadence, punctuation, and rhythm | Full sentence TTS narration + multi-line caret tracking |
| **Arabic Dictation** | Bilingual fluency & cognitive translation | Arabic cue in Thmanyah Sans + English TTS dictation + vocab cards (<kbd>Alt+H</kbd>) |
| **Arcade Modes** | High-intensity reaction & endurance | 60s Time Attack, Sudden Death (1 error = game over), and Zen Endless mode |

---

## 💎 Anti-Slop Design Philosophy

KeyCaster 3.0 strictly adheres to production-grade, human-crafted frontend aesthetics:
- **No Card Soup**: Clean spatial rhythm using an authentic 8pt layout grid.
- **High-Density Utility (Linear / Raycast)**: Subtle 1px borders (`border-white/[0.08]`), deep charcoal surfaces, and tactile micro-interactions.
- **Typography Excellence**: High-contrast pairing of **Thmanyah Sans** (for Arabic cues) and **JetBrains Mono** / **Geist Mono** (for English monospace typing).
- **Accessible Contrast**: Strict adherence to WCAG AA contrast ratios ($\ge 4.5:1$) across all themes.

---

## ⌨️ Global Shortcuts

| Shortcut | Action |
|---|---|
| <kbd>Tab</kbd> | Replay normal-speed audio pronunciation |
| <kbd>Shift</kbd> + <kbd>Tab</kbd> | Replay slow-motion audio pronunciation (0.72x) |
| <kbd>Alt</kbd> + <kbd>H</kbd> / <kbd>Ctrl</kbd> + <kbd>H</kbd> | Toggle vocabulary flashcards & hints |
| <kbd>Ctrl</kbd> + <kbd>1</kbd> | Switch to **SRS Words** |
| <kbd>Ctrl</kbd> + <kbd>2</kbd> | Switch to **Sentences** |
| <kbd>Ctrl</kbd> + <kbd>3</kbd> | Switch to **Arabic Dictation & Translation** |
| <kbd>Ctrl</kbd> + <kbd>4</kbd> | Switch to **Arcade Speedrun** |
| <kbd>Ctrl</kbd> + <kbd>,</kbd> | Open Settings Drawer |
| <kbd>Ctrl</kbd> + <kbd>D</kbd> | Open Progress & Analytics Dashboard |
| <kbd>Ctrl</kbd> + <kbd>K</kbd> | Toggle Virtual Keyboard |
| <kbd>Esc</kbd> | Skip current item / Exit to main stage |

---

## 🛠️ Getting Started

### Local Setup
```bash
git clone https://github.com/1MEshh/KeyCaster.git
cd KeyCaster
npm install
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000) in your browser.

### Running Test Suite
```bash
npm test
```
Executes all **59 unit and integration tests** covering linguistic dictionaries, SM-2 scheduling, sentence grading, and translation resilience.

### Production Build
```bash
npm run build
npm start
```

---

## 📄 License

KeyCaster is open-source software licensed under the [MIT License](LICENSE).
