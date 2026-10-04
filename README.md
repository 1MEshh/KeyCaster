<div align="center">

# 🎙️ KeyCaster 2.0

### Audio-First SRS Typing Engine, Arcade Modes & Orthographic Muscle Memory Trainer

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js 15](https://img.shields.io/badge/Next.js-15.1.7-black?logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0.0-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-blueviolet)](https://github.com/1MEshh/KeyCaster)
[![Storage](https://img.shields.io/badge/Storage-IndexedDB_%2F_Dexie.js-orange)](https://dexie.org/)
[![Privacy](https://img.shields.io/badge/Privacy-100%25_Local--First-success)](https://github.com/1MEshh/KeyCaster)

<p align="center">
  <b>KeyCaster 2.0</b> bridges the gap between auditory recall, phonetics, and touch-typing muscle memory.<br/>
  Powered by an exact implementation of the <b>SuperMemo-2 (SM-2)</b> spaced repetition algorithm, real-time <b>Web Audio procedural synthesis</b>, <b>Arcade Game Modes</b>, and an offline-first PWA architecture.
</p>

[Key Features](#-key-features) • [KeyCaster 2.0 Highlights](#-keycaster-20-highlights) • [Technical Architecture](#-technical-architecture) • [Getting Started](#-getting-started) • [Global Shortcuts](#-global-shortcuts) • [License](#-license)

---

</div>



## 🌟 KeyCaster 2.0 Highlights

KeyCaster 2.0 transforms the client into a full-fledged typing suite with 20 major features:

1. **📱 iOS Audio Unlock Overlay**: Single-tap gesture unlock for both Web Audio API and SpeechSynthesis on Safari/iOS.
2. **📲 Progressive Web App (PWA)**: Installable on iOS, Android, macOS, and Windows with standalone fullscreen mode.
3. **📶 100% Offline-First**: Service worker caching and Dexie.js IndexedDB storage ensure zero external server reliance.
4. **💾 Full Backup & Restore**: One-click JSON data export and import for seamless multi-device progress migration.
5. **⚡ Arcade Game Modes**: 60s Time Attack, Sudden Death (1 error = game over), and Zen/Endless mode.
6. **💻 Coding Syntax Deck**: 80+ software engineering terms, keywords, and terminal commands.
7. **💬 Phrase Mode**: Practice multi-word idioms and expressions with natural spacing.
8. **🧠 Adaptive SM-2 Tuning**: Intelligent review interval tightening for words with persistent mistake history.
9. **⌨️ Keyboard Mistake Heatmap**: Visual QWERTY keyboard color-coded from clean to critical error hotspots.
10. **📈 Performance Trend Charts**: Pure zero-dependency SVG line charts tracking WPM and Accuracy progression.
11. **📜 Complete Session History**: Filterable, searchable log of all completed practice runs.
12. **🔥 Daily Streak Tracker**: Visual flame streak counter rewarding consistent daily practice.
13. **🏆 Leveling & XP Engine**: Scaled experience points rewarding speed, accuracy, and volume.
14. **🎖️ 11 Unlockable Badges**: Achievements ranging from *Flawless Cast* to *Mach 2 (120+ WPM)*.
15. **⚡ Dynamic Typing Ranks**: Automated ranking from Novice to Grandmaster based on lifetime speed.
16. **🎨 Shareable 16:9 PNG Scorecards**: Downloadable high-DPI social media summary cards generated client-side.
17. **🕶️ Blind Mode Pro**: Strict acoustic training that locks backspace to test pure phonetic recall.
18. **🗂️ Enhanced Custom Deck Studio**: Permanent deck picker tab with word count badges.
19. **🖤 Monochrome Obsidian Theme**: High-contrast minimal black & white aesthetic alongside Midnight, Dracula, and Nord.
20. **🖋️ Embedded Thmanyah Sans (خط ثمانية)**: Local typography fallback with zero Google Fonts telemetry.

---

## 🚀 Key Features

### 🎧 Audio-First Dictation & Procedural Synthesis
- **Web Speech Synthesis**: Immediately enunciates words and phrases on display. Hit <kbd>Tab</kbd> anytime to replay pronunciation without losing typing focus.
- **Synthesized Mechanical Switches**: Custom Web Audio API synthesizer modeling tactile mechanical switches (Cherry MX Brown profile) using bandpass-filtered noise bursts and damped sine oscillation.
- **Sub-Bass Error Cues**: Instantaneous 150Hz triangle-wave low-pass acoustic thud triggered on typo with zero external audio assets loaded.

### 🧠 SuperMemo-2 (SM-2) Spaced Repetition Core
- **Mathematical Cognitive Scheduling**: Implements the official SM-2 algorithm:
  $$\text{EF}' = \text{EF} + \left(0.1 - (5 - q) \times (0.08 + (5 - q) \times 0.02)\right)$$
- **Quality Grading ($q \in [0, 5]$)**: Dynamically calculated using a combined metric of raw accuracy, backspace count, and response latency.
- **Intra-Day Mastery Loop**: Any word failed ($q < 3$) is immediately recycled into the active session queue for instant reinforcement before advancing.

### 🎮 Arcade Game Modes
- **60s Time Attack**: High-energy countdown timer with score multipliers and dynamic streak tracking.
- **Sudden Death**: One typo ends the run. Tests maximum precision and nerve.
- **Zen / Endless Mode**: Relaxed infinite word stream without timers or fail conditions.

---

## 🏗️ Technical Architecture

```
KeyCaster/
├── public/
│   ├── manifest.json               # PWA configuration
│   ├── icons/                      # 192x192 & 512x512 PWA icons
│   └── fonts/thmanyah/             # Embedded Thmanyah Sans typography
├── src/
│   ├── app/
│   │   ├── layout.tsx              # PWA meta, theme-color, font variables
│   │   ├── page.tsx                # Master orchestrator & mode renderer
│   │   └── globals.css             # Theme tokens, custom caret animations
│   ├── components/
│   │   ├── TypingEngine/
│   │   │   ├── TypingStage.tsx     # Zero-latency SRS typing engine
│   │   │   ├── GameModeStage.tsx   # Arcade modes (Time Attack, Sudden Death, Zen)
│   │   │   ├── SessionEndActions.tsx # Post-session summary, preview & retry
│   │   │   └── ScoreCardCanvas.tsx # 16:9 canvas PNG social card generator
│   │   ├── Dashboard/
│   │   │   ├── ProgressDashboard.tsx # 4-tab analytics hub
│   │   │   ├── HeatmapTab.tsx      # Visual keyboard error heatmap
│   │   │   ├── ChartsTab.tsx       # Zero-dependency SVG trend charts
│   │   │   └── HistoryTab.tsx      # Full session history table
│   │   ├── HUD/
│   │   │   ├── LiveStats.tsx       # Real-time stats & animated queue bar
│   │   │   └── XPToastBadge.tsx    # Level-up & achievement toast notifications
│   │   ├── Navigation/
│   │   │   └── TopNav.tsx          # Deck picker, Arcade switcher, streaks & ranks
│   │   └── Onboarding/
│   │       └── AudioUnlockOverlay.tsx # iOS Safari gesture audio unlock
│   ├── lib/
│   │   ├── sm2.ts                  # SM-2 algorithm with adaptive difficulty
│   │   ├── audio.ts                # Web Audio synthesizer & speech controller
│   │   ├── db.ts                   # Dexie.js IndexedDB schema & v3 seeder
│   │   └── achievements.ts         # Badge definitions & unlock logic
│   └── store/
│       ├── useSessionStore.ts      # SRS session queue & word grader
│       ├── useSettingsStore.ts     # Monkeytype-grade preferences & themes
│       ├── useGameModeStore.ts     # Arcade game loop state
│       └── useProfileStore.ts      # XP, levels, daily streaks & ranks
```

---

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+ (tested on Node 20 & 22)
- npm, pnpm, or bun

### Local Installation
```bash
git clone https://github.com/1MEshh/KeyCaster.git
cd KeyCaster
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Test Suite
```bash
npm test
```
Runs 16 unit tests covering SM-2 calculations, word grading, adaptive difficulty tuning, and XP leveling.

### Building for Production
```bash
npm run build
npm start
```

---

## ⌨️ Global Shortcuts

| Shortcut | Action |
|---|---|
| <kbd>Tab</kbd> | Replay word audio pronunciation |
| <kbd>Esc</kbd> | Skip word / Exit arcade mode to SRS |
| <kbd>Enter</kbd> | Advance to Next 15 Words / Restart arcade game |
| <kbd>P</kbd> | Toggle preview grid on session completion |
| <kbd>R</kbd> | Practice mistakes from finished session |
| <kbd>Ctrl</kbd> + <kbd>,</kbd> | Open Settings Drawer |
| <kbd>Ctrl</kbd> + <kbd>D</kbd> | Open Analytics Dashboard |
| <kbd>Ctrl</kbd> + <kbd>K</kbd> | Toggle Virtual Keyboard |

---

## 📄 License

KeyCaster is open-source software licensed under the [MIT License](LICENSE).
