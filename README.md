# 🎓 OmniStudy (ScholarFlow) - All-in-One Scholar & Professional Workspace

**OmniStudy** is an integrated, resilient web application designed specifically for students, researchers, and professionals. It brings together document compilation, voice recording, biometric photo resizing, spaced repetition, calendar alerts, peer matchmaking, and educational creator updates into a single workspace.

---

## ⚡ Key Highlights & Features

### 1. 🛡️ Sudden-Close & Crash Recovery (Zero Data Loss)
- **Dual-Layer Auto-Persistence**: Automatically captures every keystroke and state change into `localStorage` and `IndexedDB`.
- **Sudden Window Close Hook**: Hooks into `beforeunload`, `pagehide`, and `visibilitychange`. If you close the window or your computer restarts, simply reopen the browser: all open tabs, note drafts, audio memos, and selections will immediately restore right where you left off.

### 2. 📑 PDF Studio & Document Compiler
- **Compile & Merge PDFs**: Drop multiple PDF files to arrange their order (Up/Down/Remove).
- **Convert Notes to PDF**: Directly import any saved study note and compile it into a unified, formatted PDF document.
- **Pure Client-Side Synthesis**: Generates valid PDF standard binaries offline without needing third-party cloud services or CDNs.

### 3. 🖼️ Passport Photo Resizer & KB Precision Compressor
- **Exact Pixel Dimensions**: Supports official presets (US Visa 600×600 px, Indian Passport 413×531 px, Schengen/EU 35×45 mm, UK Passport) and custom width/height in pixels.
- **Exact Target File Size in KB**: Specify your strict portal file limit (e.g. 20 KB, 35 KB, 50 KB, 100 KB). Uses an iterative binary search compressor to match government/university upload thresholds.
- **Biometric Guidelines Overlay**: Interactive face centering oval, eye level, and chin positioning guides.
- **Instant Preview & Download**: Real-time side-by-side comparison of original vs processed dimensions and file size.

### 4. 📝 Rich Notes & 🎙️ Voice Studio
- **Rich Text & Markdown**: Organized by categories (Computer Science, Medicine, Law, Math, General) with tag search.
- **Voice Studio**: Built-in voice recorder with live animated audio waveform visualizer.
- **Variable Playback Speed**: Listen to recorded lectures and dictations at 0.75x, 1x, 1.25x, 1.5x, or 2x speed.
- **Seamless Note Sharing**: Generate instant share links or export as formatted PDF/Markdown.

### 5. 📅 Interactive Calendar & Audio Chime Reminders
- **Monthly Interactive Grid**: View and schedule study sessions, exams, and assignment deadlines.
- **Synthesized Audio Chimes**: Pleasant melodic bell chime generated via Web Audio API oscillators (no external audio files required).
- **Automated Alerts**: Real-time background checking triggers audio chimes and toast notifications when reminders are due.

### 6. 🧠 Learning Pattern Structurer & Spaced Repetition
- **Syllabus Breakdown**: Organize courses into structured tracks and topics with mastery completion meters.
- **Leitner Spaced Repetition**: Automatic calculation of review dates (Box 1: 1-day, Box 2: 3-day, Box 3: 7-day, Box 4: 14-day, Box 5: 30-day).
- **Integrated Pomodoro Focus Timer**: 25-minute focus sprints with 5-minute and 15-minute break modes, audio dings, and daily tally.

### 7. 👥 Study Partners & Collaborative Groups
- **Partner Matchmaking**: Filter peers by subject (Computer Science, Medicine, Law, Data Science, Finance), study style (Pomodoro, Flashcards, Case Analysis, Project-Based), and timezone.
- **Direct Study Chat**: Simulated instant messaging interface to connect with study buddies.
- **Collaborative Study Groups**: Join sprint groups, view pinned study materials, and access group study rooms.

### 8. 🔔 Followed Creator Side Panel (YouTube & Instagram)
- **Slide-out Side Panel**: Accessible via the notification bell in the top navbar.
- **Track Creators**: Followed channels and handles across YouTube and Instagram (e.g. 3Blue1Brown, Huberman Lab, CS50, Ali Abdaal).
- **Save to Notes**: Convert any creator lecture, reel, or study tip directly into an organized note with a single click.
- **Custom Creators**: Easily follow new YouTube channels or Instagram handles.

---

## 🚀 Getting Started

### Quick Start
To start the application server, navigate to the project directory and run:

```bash
cd /home/sonqt/Desktop/scholar-flow
./start.sh
```

Or run directly with Python 3:
```bash
python3 server.py
```

### Accessing the Web Application
Open your web browser (Chrome, Firefox, Edge, Safari) and navigate to:
```
http://localhost:8080
```

---

## 🏗️ Architecture & Technology Stack
- **Frontend**: HTML5, CSS3 Glassmorphism, ES6+ Modular Architecture.
- **Persistence**: Dual-layer storage (`localStorage` for instant synchronous state + `IndexedDB` for binary blobs).
- **Audio & Media**: Web Audio API (`AudioContext`, `AnalyserNode`, `MediaRecorder`).
- **Image Processing**: HTML5 Canvas with custom binary search quality tuning.
- **PDF Engine**: Standard PDF-1.4 binary compilation.
- **Backend**: Python 3 standard library (`http.server`, `sqlite3`, `json`) with RESTful API endpoints.
