const {
  TimerEngine,
  getDefaultSettings,
  formatDate,
  formatTime,
  createRecord,
  DEFAULT_SETTINGS,
} = require("../../core/timer-engine");

describe("TimerEngine", () => {
  let engine;

  beforeEach(() => {
    engine = new TimerEngine();
  });

  describe("constructor", () => {
    test("should initialize with default settings", () => {
      expect(engine.mode).toBe("pomodoro");
      expect(engine.status).toBe("idle");
      expect(engine.completedPomodoros).toBe(0);
      expect(engine.settings.pomodoroDuration).toBe(25);
      expect(engine.settings.shortBreakDuration).toBe(5);
      expect(engine.settings.longBreakDuration).toBe(15);
      expect(engine.settings.longBreakInterval).toBe(4);
      expect(engine.settings.language).toBe("en");
      expect(engine.settings.autoPauseEnabled).toBe(false);
    });

    test("should accept custom settings", () => {
      const custom = new TimerEngine({ pomodoroDuration: 30 });
      expect(custom.settings.pomodoroDuration).toBe(30);
      expect(custom.settings.shortBreakDuration).toBe(5);
    });
  });

  describe("start", () => {
    test("should start the timer from idle", () => {
      const state = engine.start();
      expect(state).not.toBeNull();
      expect(state.status).toBe("running");
      expect(state.mode).toBe("pomodoro");
      expect(engine.startedAt).not.toBeNull();
    });

    test("should return null if already running", () => {
      engine.start();
      const state = engine.start();
      expect(state).toBeNull();
    });

    test("should resume if paused", () => {
      engine.start();
      engine.pause();
      const state = engine.start();
      expect(state.status).toBe("running");
    });
  });

  describe("pause", () => {
    test("should pause a running timer", () => {
      engine.start();
      const state = engine.pause();
      expect(state).not.toBeNull();
      expect(state.status).toBe("paused");
    });

    test("should return null if not running", () => {
      const state = engine.pause();
      expect(state).toBeNull();
    });

    test("should preserve remaining time when paused", () => {
      engine.start();
      const remainingBefore = engine.getRemainingSeconds();
      engine.pause();
      expect(engine._pausedRemaining).toBe(remainingBefore);
    });
  });

  describe("stop", () => {
    test("should stop and reset to idle", () => {
      engine.start();
      const state = engine.stop();
      expect(state.status).toBe("idle");
      expect(engine.startedAt).toBeNull();
    });

    test("should reset remaining time to full duration", () => {
      engine.start();
      engine.stop();
      expect(engine.getRemainingSeconds()).toBe(25 * 60);
    });
  });

  describe("complete", () => {
    test("should switch to short break after pomodoro", () => {
      engine.start();
      const result = engine.complete();
      expect(result.state.mode).toBe("shortBreak");
      expect(result.state.status).toBe("idle");
      expect(result.completedSession.mode).toBe("pomodoro");
    });

    test("should switch to long break after interval", () => {
      engine.settings.longBreakInterval = 2;
      engine.start();
      engine.complete();
      engine.setMode("pomodoro");
      engine.start();
      const result = engine.complete();
      expect(result.state.mode).toBe("longBreak");
      expect(result.state.completedPomodoros).toBe(2);
    });

    test("should switch to pomodoro after break", () => {
      engine.mode = "shortBreak";
      engine.start();
      const result = engine.complete();
      expect(result.state.mode).toBe("pomodoro");
    });

    test("should increment completed pomodoros", () => {
      engine.start();
      engine.complete();
      expect(engine.completedPomodoros).toBe(1);
    });
  });

  describe("setMode", () => {
    test("should change mode when idle", () => {
      const state = engine.setMode("shortBreak");
      expect(state).not.toBeNull();
      expect(state.mode).toBe("shortBreak");
      expect(state.remainingSeconds).toBe(5 * 60);
    });

    test("should return null when not idle", () => {
      engine.start();
      const state = engine.setMode("shortBreak");
      expect(state).toBeNull();
    });

    test("should reject invalid mode", () => {
      const state = engine.setMode("invalid");
      expect(state).toBeNull();
    });

    test("should update duration for new mode", () => {
      engine.setMode("longBreak");
      expect(engine.duration).toBe(15 * 60);
    });
  });

  describe("getRemainingSeconds", () => {
    test("should return full duration when idle", () => {
      expect(engine.getRemainingSeconds()).toBe(25 * 60);
    });

    test("should return paused remaining when paused", () => {
      engine.start();
      engine.pause();
      const paused = engine._pausedRemaining;
      expect(engine.getRemainingSeconds()).toBe(paused);
    });

    test("should return decreasing time when running", () => {
      engine.start();
      const before = engine.getRemainingSeconds();
      expect(before).toBeLessThanOrEqual(25 * 60);
      expect(before).toBeGreaterThan(0);
    });
  });

  describe("updateSettings", () => {
    test("should update settings", () => {
      engine.updateSettings({ pomodoroDuration: 30 });
      expect(engine.settings.pomodoroDuration).toBe(30);
    });

    test("should update idle timer duration", () => {
      engine.updateSettings({ pomodoroDuration: 30 });
      expect(engine.duration).toBe(30 * 60);
    });

    test("should not change running timer duration", () => {
      engine.start();
      engine.updateSettings({ pomodoroDuration: 30 });
      expect(engine.duration).toBe(25 * 60);
    });
  });

  describe("serialize/deserialize", () => {
    test("should serialize and deserialize state", () => {
      engine.start();
      engine.pause();
      const serialized = engine.serialize();
      const restored = TimerEngine.deserialize(serialized);

      expect(restored.mode).toBe(engine.mode);
      expect(restored.status).toBe(engine.status);
      expect(restored.completedPomodoros).toBe(engine.completedPomodoros);
      expect(restored._pausedRemaining).toBe(engine._pausedRemaining);
    });

    test("should create default engine from null data", () => {
      const restored = TimerEngine.deserialize(null);
      expect(restored.mode).toBe("pomodoro");
      expect(restored.status).toBe("idle");
    });

    test("should preserve settings through serialization", () => {
      engine.updateSettings({ pomodoroDuration: 45 });
      const serialized = engine.serialize();
      const restored = TimerEngine.deserialize(serialized);
      expect(restored.settings.pomodoroDuration).toBe(45);
    });
  });
});

describe("Utility functions", () => {
  describe("getDefaultSettings", () => {
    test("should return default settings", () => {
      const settings = getDefaultSettings();
      expect(settings.pomodoroDuration).toBe(25);
      expect(settings.shortBreakDuration).toBe(5);
      expect(settings.longBreakDuration).toBe(15);
      expect(settings.longBreakInterval).toBe(4);
      expect(settings.language).toBe("en");
      expect(settings.autoPauseEnabled).toBe(false);
    });
  });

  describe("formatDate", () => {
    test("should format date as YYYY-MM-DD", () => {
      const date = new Date(2026, 3, 10);
      expect(formatDate(date)).toBe("2026-04-10");
    });
  });

  describe("formatTime", () => {
    test("should format seconds as MM:SS", () => {
      expect(formatTime(1500)).toBe("25:00");
      expect(formatTime(0)).toBe("00:00");
      expect(formatTime(65)).toBe("01:05");
    });

    test("should pad single digits", () => {
      expect(formatTime(5)).toBe("00:05");
      expect(formatTime(600)).toBe("10:00");
    });
  });

  describe("createRecord", () => {
    test("should create a record object", () => {
      const record = createRecord("2026-04-10", { mode: "pomodoro", duration: 1500 });
      expect(record.date).toBe("2026-04-10");
      expect(record.type).toBe("pomodoro");
      expect(record.duration).toBe(1500);
      expect(record.completedAt).toBeDefined();
    });
  });
});
