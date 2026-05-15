export const DEFAULT_SETTINGS = {
  pomodoroDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  language: "en",
  autoPauseEnabled: false,
  autoPauseStart: "00:00",
  autoPauseEnd: "00:00",
};

export class TimerEngine {
  constructor(settings = {}) {
    this.mode = "pomodoro";
    this.status = "idle";
    this.startedAt = null;
    this.duration = (settings.pomodoroDuration || DEFAULT_SETTINGS.pomodoroDuration) * 60;
    this.completedPomodoros = 0;
    this.settings = { ...DEFAULT_SETTINGS, ...settings };
    this._pausedRemaining = null;
  }

  start() {
    if (this.status === "running") return null;
    if (this.status === "paused") return this.resume();
    this.status = "running";
    this.startedAt = Date.now();
    this.duration = this.getModeDuration() * 60;
    return this.getState();
  }

  pause() {
    if (this.status !== "running") return null;
    this._pausedRemaining = this.getRemainingSeconds();
    this.status = "paused";
    this.startedAt = null;
    return this.getState();
  }

  resume() {
    if (this.status !== "paused") return null;
    this.status = "running";
    this.startedAt = Date.now();
    this.duration = this._pausedRemaining;
    this._pausedRemaining = null;
    return this.getState();
  }

  stop() {
    this.status = "idle";
    this.startedAt = null;
    this._pausedRemaining = null;
    this.duration = this.getModeDuration() * 60;
    return this.getState();
  }

  complete() {
    const completedMode = this.mode;
    const completedDuration = this.status === "running"
      ? this.duration
      : this.getModeDuration() * 60;

    if (this.mode === "pomodoro") {
      this.completedPomodoros++;
      if (this.completedPomodoros % this.settings.longBreakInterval === 0) {
        this.mode = "longBreak";
      } else {
        this.mode = "shortBreak";
      }
    } else {
      this.mode = "pomodoro";
    }

    this.status = "idle";
    this.startedAt = null;
    this._pausedRemaining = null;
    this.duration = this.getModeDuration() * 60;

    return {
      state: this.getState(),
      completedSession: {
        mode: completedMode,
        duration: completedDuration,
      },
    };
  }

  setMode(mode) {
    if (this.status !== "idle") return null;
    const validModes = ["pomodoro", "shortBreak", "longBreak"];
    if (!validModes.includes(mode)) return null;
    this.mode = mode;
    this.duration = this.getModeDuration() * 60;
    return this.getState();
  }

  getRemainingSeconds() {
    if (this.status === "idle") return this.getModeDuration() * 60;
    if (this.status === "paused") return this._pausedRemaining || 0;
    if (this.status === "running" && this.startedAt) {
      const elapsed = (Date.now() - this.startedAt) / 1000;
      return Math.max(0, Math.ceil(this.duration - elapsed));
    }
    return 0;
  }

  getModeDuration() {
    switch (this.mode) {
      case "pomodoro":
        return this.settings.pomodoroDuration;
      case "shortBreak":
        return this.settings.shortBreakDuration;
      case "longBreak":
        return this.settings.longBreakDuration;
      default:
        return this.settings.pomodoroDuration;
    }
  }

  updateSettings(settings) {
    this.settings = { ...this.settings, ...settings };
    if (this.status === "idle") {
      this.duration = this.getModeDuration() * 60;
    }
    return this.getState();
  }

  getState() {
    return {
      mode: this.mode,
      status: this.status,
      startedAt: this.startedAt,
      duration: this.duration,
      remainingSeconds: this.getRemainingSeconds(),
      totalSeconds: this.getModeDuration() * 60,
      completedPomodoros: this.completedPomodoros,
      settings: { ...this.settings },
    };
  }

  getExpirationDelaySeconds() {
    if (this.status !== "running") return null;
    return this.getRemainingSeconds();
  }

  serialize() {
    return {
      mode: this.mode,
      status: this.status,
      startedAt: this.startedAt,
      duration: this.duration,
      completedPomodoros: this.completedPomodoros,
      pausedRemaining: this._pausedRemaining,
      settings: this.settings,
    };
  }

  static deserialize(data) {
    if (!data) return new TimerEngine();
    const engine = new TimerEngine(data.settings || {});
    engine.mode = data.mode || "pomodoro";
    engine.status = data.status || "idle";
    engine.startedAt = data.startedAt || null;
    engine.duration = data.duration || engine.getModeDuration() * 60;
    engine.completedPomodoros = data.completedPomodoros || 0;
    engine._pausedRemaining = data.pausedRemaining || null;
    return engine;
  }
}

export function getDefaultSettings() {
  return { ...DEFAULT_SETTINGS };
}

export function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function createRecord(date, session) {
  return {
    date,
    mode: session.mode,
    type: session.mode,
    duration: session.duration,
    completedAt: new Date().toISOString(),
  };
}

// ES module exports (Manifest V3 service worker uses import)
// TimerEngine is available as a global from the import above
