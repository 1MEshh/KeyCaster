<div align="center">

# 🎙️ KeyCaster

### Audio-First SRS Typing Engine & Orthographic Muscle Memory Trainer

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js 15](https://img.shields.io/badge/Next.js-15.1.7-black?logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0.0-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Storage](https://img.shields.io/badge/Storage-IndexedDB_%2F_Dexie.js-orange)](https://dexie.org/)
[![Security](https://img.shields.io/badge/Audit-0_Vulnerabilities-brightgreen)](https://github.com/1MEshh/KeyCaster)
[![Privacy](https://img.shields.io/badge/Privacy-100%25_Local--First-success)](https://github.com/1MEshh/KeyCaster)

<p align="center">
  <b>KeyCaster</b> bridges the gap between auditory recall, phonetics, and touch-typing muscle memory.<br/>
  Powered by an exact implementation of the <b>SuperMemo-2 (SM-2)</b> spaced repetition algorithm, real-time <b>Web Audio procedural synthesis</b>, and a zero-latency DOM keystroke pipeline.
</p>

[Key Features](#-key-features) • [Why I Built KeyCaster](#-why-i-built-keycaster) • [Technical Architecture](#-technical-architecture) • [Getting Started](#-getting-started) • [Global Shortcuts](#-global-shortcuts) • [License](#-license)

---

</div>



---

## 🚀 Key Features

### 🎧 Audio-First Dictation & Procedural Audio Synthesis
- **Web Speech Synthesis**: Immediately enunciates words and phrases on display. Hit <kbd>Tab</kbd> anytime to replay pronunciation without losing typing focus.
- **Synthesized Mechanical Switches**: Custom Web Audio API synthesizer modeling tactile mechanical switches (Cherry MX Brown acoustic profile) using bandpass-filtered noise bursts and damped sine oscillation.
- **Sub-Bass Error Cues**: Instantaneous 150Hz triangle-wave low-pass acoustic thud triggered on typo with zero external audio assets loaded.
- **Multi-Word Natural Phrases**: Native support for idiomatic phrases (*"as soon as"*, *"in the meantime"*, *"on the other hand"*) with dedicated spacebar acoustic feedback and seamless word-boundary handling.

### 🧠 SuperMemo-2 (SM-2) Spaced Repetition Core
- **Mathematical Cognitive Scheduling**: Implements the official SM-2 algorithm:
  $$\text{EF}' = \text{EF} + \left(0.1 - (5 - q) \times (0.08 + (5 - q) \times 0.02)\right)$$
- **Quality Grading ($q \in [0, 5]$)**: Dynamically calculated using a combined metric of raw accuracy, backspace count, and response latency.
- **Intra-Day Mastery Loop**: Any word failed ($q < 3$) is immediately recycled into the active session queue for instant reinforcement before advancing.
- **Pure Random Draw Engine**: Sessions are drawn randomly from your selected deck to eliminate positional memorization while recording individual word SRS intervals in IndexedDB.

### ⌨️ Professional-Grade Typing Customization
- **Blind Mode by Default**: Conceals upcoming letters behind clean underscore placeholders (`_`) while displaying your typed letters in real-time. Automatically advances to the next word upon completion with zero disruptive popups.
- **Strict Letter Mode**: Halts cursor progression on error, illuminates the typo in vivid warning crimson, triggers a CSS shake animation, and requires <kbd>Backspace</kbd> to correct.
- **Precision Caret Engine**: 4 caret geometries (`line`, `block`, `underline`, `outline`) paired with 4 transition speeds (`off`, `fast`, `medium`, `slow`).
- **Curated Colorways**: Built-in high-contrast themes:
  - 🖤 **Monochrome (B&W)** (Default — pure obsidian black `#09090b` and crisp paper-white `#f4f4f5`)
  - 🌌 **Midnight** (Deep navy obsidian with warm cyan accents)
  - ❄️ **Nord** (Arctic blue & muted slate)
  - 🧛 **Dracula** (Vibrant vampire purple & neon pink)
  - 🟡 **Serika Dark** (Classic dark charcoal & amber yellow)
- **Typography Engine**: Integrated **Thmanyah Sans (خط ثمانية)** locally as the application-wide default typography, paired with selectable monospace options (JetBrains Mono, Roboto Mono, Fira Code).
- **Session Completion & Queue Progress**:
  - **Sleek Queue Progress Bar**: Real-time progress bar under `QUEUE X / 15` smoothly animating toward completion.
  - **15-Word Completion Flow**: An inline animated completion screen offering **Preview 15 Words** (with audio pronunciation replays) and **Next 15 Words** (<kbd>Enter</kbd> hotkey).
- **Virtual Keyboard**: Real-time visual layout supporting **QWERTY**, **Dvorak**, and **Colemak** with dynamic key illumination and finger-zone indicators.

### 📚 Pre-Configured Curated Decks
1. **Daily (500 Words & Phrases)**: Comprehensive lexical repertoire across 14 linguistic categories:
   - *Limiting & Focus Words* (`only`, `just`, `merely`, `simply`, `solely`...)
   - *Frequency & Time Adverbs* (`always`, `seldom`, `frequently`, `eventually`...)
   - *Degree & Intensity* (`deeply`, `thoroughly`, `incredibly`, `utterly`...)
   - *Viewpoint & Stance* (`obviously`, `undoubtedly`, `frankly`, `allegedly`...)
   - *Sequencing & Discourse Connectors* (`furthermore`, `consequently`, `meanwhile`...)
   - *Common Idiomatic Phrases* (`in addition to`, `as a matter of fact`, `by all means`...)
2. **Common Misspellings (250+ Words)**: High-frequency orthographic pitfalls (*accommodate, definitely, embarrass, maneuver, rhythm, vacuum, calendar, conscientiousness, rendezvous...*).
3. **Gaming Lexicon**: Tactical esports terminology, streaming slang, and competitive jargon.
4. **Custom Deck Studio**: Paste comma- or newline-separated wordlists with automated client-side sanitization, deduplication, and instant SRS queue generation.

---

## 🏗️ Technical Architecture

```
KeyCaster/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root HTML shell, meta tags, font loading
│   │   ├── page.tsx                # Main application orchestrator & deck selector
│   │   └── globals.css             # Theme variables, custom animations, typography
│   ├── components/
│   │   ├── TypingEngine/
│   │   │   └── TypingStage.tsx     # Zero-latency typing stage, caret tracking, audio cues
│   │   ├── VirtualKeyboard/
│   │   │   └── VirtualKeyboard.tsx # Interactive QWERTY / Dvorak / Colemak keymap
│   │   ├── HUD/
│   │   │   ├── LiveStats.tsx       # Real-time WPM, accuracy, streak, progress
│   │   │   └── AudioIndicator.tsx  # Dynamic speech & audio status indicator
│   │   ├── Navigation/
│   │   │   └── TopNav.tsx          # Brand header, deck badges, quick controls
│   │   └── Modals/
│   │       ├── SettingsModal.tsx   # Monkeytype-grade preferences drawer
│   │       ├── SessionSummaryModal.tsx # Post-session analytics & retry workflow
│   │       └── CustomDeckModal.tsx # Wordlist parser & custom deck creator
│   ├── lib/
│   │   ├── sm2.ts                  # Pure SuperMemo-2 mathematical algorithm
│   │   ├── grader.ts               # Accuracy & latency grading engine
│   │   ├── audio.ts                # Web Audio API procedural sound synthesizer
│   │   ├── db.ts                   # Dexie.js IndexedDB schema & migrations
│   │   ├── sessionQueue.ts         # Intra-session retry & queue management
│   │   └── __tests__/              # Automated unit tests for SM-2 & Grader
│   ├── store/
│   │   ├── useSessionStore.ts      # Active session state & queue transitions
│   │   ├── useSettingsStore.ts     # Persistent user preferences & theme manager
│   │   └── useKeyStore.ts          # Real-time keyboard press listener
│   └── data/
│       └── categories.json         # Static seed data (Daily 500, Misspellings, Gaming)
```

### Procedural Web Audio Engine (`src/lib/audio.ts`)
Instead of loading external `.mp3` or `.wav` sound files that add HTTP latency and bundle bloat, KeyCaster generates tactile switch clicks entirely at runtime:
```typescript
// Tactile Switch Audio Synthesis: Bandpass noise burst + damped sine transient
const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
const data = buffer.getChannelData(0);
for (let i = 0; i < bufferSize; i++) {
  data[i] = Math.random() * 2 - 1; // High-frequency white noise
}
// Filtered through BiquadFilter (bandpass at 2400Hz, Q=3.0)
// Blended with a sub-millisecond 400Hz sine oscillation for key switch bottom-out
```

---

## 🛠️ Getting Started

### Prerequisites
- **Node.js**: `v18.18.0` or higher
- **npm**: `v9.0.0` or higher

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/1MEshh/KeyCaster.git
cd KeyCaster

# 2. Install dependencies
npm install

# 3. Launch local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to start typing.

### Running Unit Tests

The test suite validates the mathematical correctness of the SM-2 algorithm, ease-factor degradation, and grading thresholds:

```bash
npm test
```

### Production Build

```bash
npm run build
npm run start
```

---

## ⌨️ Global Shortcuts

| Keybinding | Action |
| :--- | :--- |
| <kbd>Tab</kbd> | **Replay Pronunciation** (auditory dictation repeat) |
| <kbd>Escape</kbd> | **Skip Word** (marks as failed & queues for intra-session retry) |
| <kbd>Ctrl</kbd> + <kbd>,</kbd> | **Settings Drawer** (theme, caret, blind mode, sound) |
| <kbd>Ctrl</kbd> + <kbd>D</kbd> | **SRS Dashboard** (retention breakdown & word stats) |
| <kbd>Ctrl</kbd> + <kbd>K</kbd> | **Toggle Virtual Keyboard** |
| <kbd>Ctrl</kbd> + <kbd>Enter</kbd> | **Restart Session** (draws fresh random queue) |

---

## 📊 SuperMemo-2 Grading Matrix

| Accuracy / Error Pattern | Latency | Grade ($q$) | Interval Multiplier |
| :--- | :--- | :---: | :--- |
| 100% Accuracy, 0 Backspaces | $< 1.8\text{s}$ | **5** (Perfect) | $\text{EF} \times 1.3$ |
| 100% Accuracy, 0 Backspaces | $> 1.8\text{s}$ | **4** (Good) | $\text{EF} \times 1.0$ |
| Minor hesitation or 1 backspace | Any | **3** (Pass) | $\text{EF} \times 0.85$ |
| Incorrect spelling or skipped | Any | **1 - 2** (Fail) | Reset to Day 1 + Re-queued |

---

## 🧑‍💻 Author

Crafted with dedication by **[1MEshh](https://github.com/1MEshh)**.

If you find KeyCaster useful for your spelling, language learning, or touch-typing practice, please consider giving the repository a ⭐ on GitHub!

---

## 📄 License

This project is licensed under the **MIT License** — feel free to use, modify, and distribute it in your own projects.
