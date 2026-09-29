/**
 * OmniStudy Focus & Study Timer Module
 * Fully adjustable countdown timer with presets, direct H:M:S spin controls,
 * Web Audio API alarm sound on completion, and persistent multi-tab floating bottom pill.
 */

let timerTotalSeconds = 25 * 60;
let timerRemainingSeconds = 25 * 60;
let isTimerRunning = false;
let timerInterval = null;
let isAlarmActive = false;
let alarmAudioInterval = null;
let audioCtx = null;
let currentView = "view-dashboard";

/**
 * Initialize Timer Module and attach event handlers
 */
export function initLearningModule(showToastFn) {
  setupTimerInputs();
  setupPresets();
  setupSteppers();
  setupActionButtons(showToastFn);
  setupFloatingTimerControls(showToastFn);
  updateDisplays();
  updateTimerFloatingVisibility(localStorage.getItem("omnistudy_active_view") || "view-dashboard");
}

/**
 * Format total seconds into H:MM:SS or MM:SS
 */
function formatSeconds(totalSecs) {
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Update all DOM displays (main view, floating widget, document title)
 */
function updateDisplays() {
  const formatted = formatSeconds(timerRemainingSeconds);

  // Main timer display
  const mainDisplay = document.getElementById("timer-display-digits");
  if (mainDisplay) mainDisplay.textContent = formatted;

  // Floating timer display
  const floatingDisplay = document.getElementById("floating-timer-digits");
  if (floatingDisplay) floatingDisplay.textContent = formatted;

  // Document title
  if (isAlarmActive) {
    document.title = `🚨 (00:00) Time is Up! - ScholarFlow`;
  } else if (isTimerRunning) {
    document.title = `⏱️ (${formatted}) ScholarFlow`;
  } else {
    document.title = `ScholarFlow - Academic & Focus Workspace`;
  }
}

/**
 * Sync H:M:S input boxes with a given number of seconds
 */
function syncInputBoxes(secs) {
  const hInput = document.getElementById("timer-input-hours");
  const mInput = document.getElementById("timer-input-mins");
  const sInput = document.getElementById("timer-input-secs");

  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;

  if (hInput) hInput.value = h;
  if (mInput) mInput.value = m;
  if (sInput) sInput.value = s;
}

/**
 * Read current H:M:S spin inputs and convert to total seconds
 */
function getSecondsFromInputs() {
  const h = parseInt(document.getElementById("timer-input-hours")?.value || "0", 10) || 0;
  const m = parseInt(document.getElementById("timer-input-mins")?.value || "0", 10) || 0;
  const s = parseInt(document.getElementById("timer-input-secs")?.value || "0", 10) || 0;
  return Math.max(1, h * 3600 + m * 60 + s);
}

/**
 * Direct Hours, Minutes, Seconds spinners and keyboard adjustments
 */
function setupTimerInputs() {
  const hInput = document.getElementById("timer-input-hours");
  const mInput = document.getElementById("timer-input-mins");
  const sInput = document.getElementById("timer-input-secs");

  function onInputChange() {
    if (isAlarmActive) stopAlarm();
    timerTotalSeconds = getSecondsFromInputs();
    if (!isTimerRunning) {
      timerRemainingSeconds = timerTotalSeconds;
      clearActivePreset();
      updateDisplays();
    }
  }

  hInput?.addEventListener("input", onInputChange);
  mInput?.addEventListener("input", onInputChange);
  sInput?.addEventListener("input", onInputChange);

  // Spin Buttons (+ / -)
  document.getElementById("spin-h-up")?.addEventListener("click", () => adjustInputBy(hInput, 1, 0, 99));
  document.getElementById("spin-h-down")?.addEventListener("click", () => adjustInputBy(hInput, -1, 0, 99));
  document.getElementById("spin-m-up")?.addEventListener("click", () => adjustInputBy(mInput, 1, 0, 59));
  document.getElementById("spin-m-down")?.addEventListener("click", () => adjustInputBy(mInput, -1, 0, 59));
  document.getElementById("spin-s-up")?.addEventListener("click", () => adjustInputBy(sInput, 5, 0, 59));
  document.getElementById("spin-s-down")?.addEventListener("click", () => adjustInputBy(sInput, -5, 0, 59));
}

function adjustInputBy(inputElem, delta, min, max) {
  if (!inputElem) return;
  let val = parseInt(inputElem.value || "0", 10) + delta;
  if (val < min) val = min;
  if (val > max) val = max;
  inputElem.value = val;
  inputElem.dispatchEvent(new Event("input"));
}

/**
 * Quick Presets (5m, 10m, 15m, 20m, 25m, 30m, 45m, 60m)
 */
function setupPresets() {
  const presetBtns = document.querySelectorAll(".timer-preset-btn");
  presetBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const secs = parseInt(btn.dataset.seconds, 10);
      if (isNaN(secs) || secs <= 0) return;

      if (isAlarmActive) stopAlarm();
      if (isTimerRunning) pauseTimer();

      timerTotalSeconds = secs;
      timerRemainingSeconds = secs;
      syncInputBoxes(secs);

      presetBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const badge = document.getElementById("timer-status-badge");
      if (badge) badge.textContent = `Set to ${formatSeconds(secs)}`;

      updateDisplays();
    });
  });
}

function clearActivePreset() {
  document.querySelectorAll(".timer-preset-btn").forEach(b => b.classList.remove("active"));
}

/**
 * Quick Steppers (-5m, -1m, +1m, +5m, +10m)
 */
function setupSteppers() {
  const stepBtns = document.querySelectorAll(".timer-step-btn");
  stepBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const delta = parseInt(btn.dataset.delta, 10);
      if (isNaN(delta)) return;

      if (isAlarmActive) stopAlarm();

      timerRemainingSeconds = Math.max(0, timerRemainingSeconds + delta);
      if (!isTimerRunning) {
        timerTotalSeconds = Math.max(1, timerRemainingSeconds);
        syncInputBoxes(timerRemainingSeconds);
      }
      clearActivePreset();
      updateDisplays();
    });
  });
}

/**
 * Main Timer Actions (Start/Pause, Reset, Stop Alarm)
 */
function setupActionButtons(showToastFn) {
  const toggleBtn = document.getElementById("timer-toggle-btn");
  const resetBtn = document.getElementById("timer-reset-btn");
  const stopAlarmBtn = document.getElementById("timer-stop-alarm-btn");

  toggleBtn?.addEventListener("click", () => {
    if (isAlarmActive) {
      stopAlarm();
      resetTimer();
      return;
    }
    if (!isTimerRunning) {
      startTimer(showToastFn);
    } else {
      pauseTimer();
    }
  });

  resetBtn?.addEventListener("click", () => {
    resetTimer();
  });

  stopAlarmBtn?.addEventListener("click", () => {
    stopAlarm();
  });
}

/**
 * Global Floating Timer Widget Controls (Bottom right)
 */
function setupFloatingTimerControls(showToastFn) {
  const floatingToggleBtn = document.getElementById("floating-timer-toggle-btn");
  const floatingResetBtn = document.getElementById("floating-timer-reset-btn");
  const floatingStopAlarmBtn = document.getElementById("floating-timer-stop-alarm-btn");
  const floatingJumpBtn = document.getElementById("floating-timer-jump-btn");
  const floatingOpenBtn = document.getElementById("floating-timer-open-view");

  floatingToggleBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (isAlarmActive) {
      stopAlarm();
      resetTimer();
      return;
    }
    if (!isTimerRunning) {
      startTimer(showToastFn);
    } else {
      pauseTimer();
    }
  });

  floatingResetBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    resetTimer();
  });

  floatingStopAlarmBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    stopAlarm();
  });

  // Clicking floating widget or ↗️ jumps directly to Timer view
  function jumpToTimerView() {
    const navBtn = document.querySelector('.nav-item[data-view="view-learning"]');
    if (navBtn) navBtn.click();
  }

  floatingJumpBtn?.addEventListener("click", jumpToTimerView);
  floatingOpenBtn?.addEventListener("click", jumpToTimerView);
}

/**
 * Start or resume countdown
 */
function startTimer(showToastFn) {
  if (timerRemainingSeconds <= 0) {
    timerRemainingSeconds = timerTotalSeconds > 0 ? timerTotalSeconds : 25 * 60;
  }
  if (isAlarmActive) stopAlarm();

  // Prime Web Audio context on user gesture
  getAudioContext();

  isTimerRunning = true;
  updateTimerUIState();

  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (timerRemainingSeconds > 0) {
      timerRemainingSeconds--;
      updateDisplays();
      if (timerRemainingSeconds === 0) {
        clearInterval(timerInterval);
        isTimerRunning = false;
        triggerAlarm(showToastFn);
      }
    }
  }, 1000);
}

/**
 * Pause countdown
 */
function pauseTimer() {
  isTimerRunning = false;
  clearInterval(timerInterval);
  updateTimerUIState();
}

/**
 * Reset countdown to initial set duration
 */
function resetTimer() {
  isTimerRunning = false;
  clearInterval(timerInterval);
  if (isAlarmActive) stopAlarm();

  timerRemainingSeconds = timerTotalSeconds;
  syncInputBoxes(timerTotalSeconds);
  updateTimerUIState();
  updateDisplays();
}

/**
 * Synchronize UI elements (buttons, badges, indicators)
 */
function updateTimerUIState() {
  const toggleBtn = document.getElementById("timer-toggle-btn");
  const floatingToggleBtn = document.getElementById("floating-timer-toggle-btn");
  const badge = document.getElementById("timer-status-badge");
  const floatingDot = document.getElementById("floating-timer-dot");

  if (isTimerRunning) {
    if (toggleBtn) {
      toggleBtn.textContent = "⏸️ Pause Timer";
      toggleBtn.className = "btn-secondary timer-big-btn";
    }
    if (floatingToggleBtn) floatingToggleBtn.textContent = "⏸️";
    if (badge) {
      badge.textContent = "Counting Down...";
      badge.className = "timer-status-badge running";
    }
    if (floatingDot) {
      floatingDot.className = "floating-timer-dot running";
    }
  } else {
    if (toggleBtn) {
      toggleBtn.textContent = timerRemainingSeconds < timerTotalSeconds && timerRemainingSeconds > 0 ? "▶️ Resume Timer" : "▶️ Start Timer";
      toggleBtn.className = "btn-primary timer-big-btn";
    }
    if (floatingToggleBtn) floatingToggleBtn.textContent = "▶️";
    if (badge) {
      badge.textContent = timerRemainingSeconds < timerTotalSeconds && timerRemainingSeconds > 0 ? "Paused" : "Ready to Start";
      badge.className = "timer-status-badge";
    }
    if (floatingDot) {
      floatingDot.className = timerRemainingSeconds < timerTotalSeconds && timerRemainingSeconds > 0 ? "floating-timer-dot paused" : "floating-timer-dot";
    }
  }
}

/**
 * Audio Alarm Trigger when Timer reaches 00:00
 */
function triggerAlarm(showToastFn) {
  isAlarmActive = true;
  updateDisplays();

  // Badges & Actions
  const badge = document.getElementById("timer-status-badge");
  if (badge) {
    badge.textContent = "🚨 Time's Up! Alarm Ringing";
    badge.className = "timer-status-badge alarm";
  }

  const stopBtn = document.getElementById("timer-stop-alarm-btn");
  if (stopBtn) stopBtn.style.display = "inline-flex";

  const floatingStopBtn = document.getElementById("floating-timer-stop-alarm-btn");
  if (floatingStopBtn) floatingStopBtn.style.display = "inline-flex";

  const floatingDot = document.getElementById("floating-timer-dot");
  if (floatingDot) floatingDot.className = "floating-timer-dot alarm";

  const floatingWidget = document.getElementById("global-floating-timer");
  if (floatingWidget) floatingWidget.classList.add("alarm-ringing");

  const timerCard = document.querySelector(".timer-card");
  if (timerCard) timerCard.classList.add("alarm-ringing");

  // Play Web Audio chime loop
  playAlarmChime();
  clearInterval(alarmAudioInterval);
  alarmAudioInterval = setInterval(playAlarmChime, 1400);

  if (showToastFn) {
    showToastFn("⏰ Time is up! Focus timer reached 00:00.");
  }
}

/**
 * Stop alarm sound & reset alarm visual indicators
 */
function stopAlarm() {
  isAlarmActive = false;
  clearInterval(alarmAudioInterval);

  const stopBtn = document.getElementById("timer-stop-alarm-btn");
  if (stopBtn) stopBtn.style.display = "none";

  const floatingStopBtn = document.getElementById("floating-timer-stop-alarm-btn");
  if (floatingStopBtn) floatingStopBtn.style.display = "none";

  const floatingWidget = document.getElementById("global-floating-timer");
  if (floatingWidget) floatingWidget.classList.remove("alarm-ringing");

  const timerCard = document.querySelector(".timer-card");
  if (timerCard) timerCard.classList.remove("alarm-ringing");

  updateTimerUIState();
  updateDisplays();
}

/**
 * Web Audio API synthesizer for clean chime alarm
 */
function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(frequency, startTime, duration) {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(frequency, startTime);

    gain.gain.setValueAtTime(0.28, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  } catch (err) {
    console.warn("Audio chime error:", err);
  }
}

function playAlarmChime() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  // Multi-tone chime: A5 (880Hz), C#6 (1108.7Hz), E6 (1318.5Hz)
  playTone(880, now, 0.22);
  playTone(1108.7, now + 0.22, 0.22);
  playTone(1318.5, now + 0.44, 0.38);
}

/**
 * Control floating bottom widget visibility based on active tab
 * Visible across all tabs EXCEPT the dedicated Timer tab itself.
 */
export function updateTimerFloatingVisibility(viewId) {
  currentView = viewId;
  const floatingWidget = document.getElementById("global-floating-timer");
  if (!floatingWidget) return;

  if (viewId === "view-learning") {
    // When on full Timer view, hide bottom floating bar
    floatingWidget.style.display = "none";
  } else {
    // Show on all other tabs so user sees timer ticking down
    floatingWidget.style.display = "flex";
  }
}
