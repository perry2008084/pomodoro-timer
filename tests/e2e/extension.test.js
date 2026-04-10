/**
 * @jest-environment jsdom
 */

const path = require("path");
const fs = require("fs");

const EXTENSION_PATH = path.resolve(__dirname, "../..");

describe("E2E: Chrome Extension", () => {
  test("manifest.json should be valid", () => {
    const manifestPath = path.join(EXTENSION_PATH, "manifest.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

    expect(manifest.manifest_version).toBe(3);
    expect(manifest.name).toBe("Pomodoro Timer");
    expect(manifest.permissions).toContain("storage");
    expect(manifest.permissions).toContain("alarms");
    expect(manifest.action.default_popup).toBe("popup/popup.html");
    expect(manifest.background.service_worker).toBe("background/service-worker.js");
  });

  test("all extension files should exist", () => {
    const requiredFiles = [
      "manifest.json",
      "popup/popup.html",
      "popup/popup.css",
      "popup/popup.js",
      "background/service-worker.js",
      "options/options.html",
      "options/options.css",
      "options/options.js",
      "stats/stats.html",
      "stats/stats.css",
      "stats/stats.js",
      "core/timer-engine.js",
      "icons/icon16.png",
      "icons/icon48.png",
      "icons/icon128.png",
    ];

    requiredFiles.forEach((file) => {
      const filePath = path.join(EXTENSION_PATH, file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  test("popup HTML should contain required elements", () => {
    const html = fs.readFileSync(
      path.join(EXTENSION_PATH, "popup/popup.html"),
      "utf8"
    );
    expect(html).toContain('id="timer-minutes"');
    expect(html).toContain('id="timer-seconds"');
    expect(html).toContain('id="btn-start"');
    expect(html).toContain('id="btn-pause"');
    expect(html).toContain('id="btn-stop"');
    expect(html).toContain("mode-tab");
    expect(html).toContain('id="progress-fill"');
  });

  test("options HTML should contain settings form", () => {
    const html = fs.readFileSync(
      path.join(EXTENSION_PATH, "options/options.html"),
      "utf8"
    );
    expect(html).toContain('id="pomodoro-duration"');
    expect(html).toContain('id="short-break-duration"');
    expect(html).toContain('id="long-break-duration"');
    expect(html).toContain('id="long-break-interval"');
    expect(html).toContain('id="btn-save"');
    expect(html).toContain('id="btn-reset"');
  });

  test("stats HTML should contain heatmap and export elements", () => {
    const html = fs.readFileSync(
      path.join(EXTENSION_PATH, "stats/stats.html"),
      "utf8"
    );
    expect(html).toContain('id="heatmap-grid"');
    expect(html).toContain('id="btn-export"');
    expect(html).toContain('id="total-pomodoros"');
    expect(html).toContain('id="total-hours"');
    expect(html).toContain('id="current-streak"');
    expect(html).toContain('id="detail-section"');
  });

  test("popup CSS should have required styles", () => {
    const css = fs.readFileSync(
      path.join(EXTENSION_PATH, "popup/popup.css"),
      "utf8"
    );
    expect(css).toContain(".timer-display");
    expect(css).toContain(".mode-tab");
    expect(css).toContain(".progress-bar");
    expect(css).toContain(".btn-primary");
  });

  test("stats CSS should have heatmap styles", () => {
    const css = fs.readFileSync(
      path.join(EXTENSION_PATH, "stats/stats.css"),
      "utf8"
    );
    expect(css).toContain(".heatmap-cell");
    expect(css).toContain(".heatmap-grid");
    expect(css).toContain(".legend-cell");
  });

  test("timer engine module should export required functions", () => {
    const {
      TimerEngine,
      getDefaultSettings,
      formatDate,
      formatTime,
      createRecord,
    } = require(path.join(EXTENSION_PATH, "core/timer-engine.js"));

    expect(typeof TimerEngine).toBe("function");
    expect(typeof getDefaultSettings).toBe("function");
    expect(typeof formatDate).toBe("function");
    expect(typeof formatTime).toBe("function");
    expect(typeof createRecord).toBe("function");
  });

  test("popup JS should be valid and loadable", () => {
    const js = fs.readFileSync(
      path.join(EXTENSION_PATH, "popup/popup.js"),
      "utf8"
    );
    expect(js).toContain("btn-start");
    expect(js).toContain("btn-pause");
    expect(js).toContain("btn-stop");
    expect(js).toContain("updateUI");
    expect(js).toContain("sendMessage");
  });

  test("options JS should be valid and loadable", () => {
    const js = fs.readFileSync(
      path.join(EXTENSION_PATH, "options/options.js"),
      "utf8"
    );
    expect(js).toContain("btn-save");
    expect(js).toContain("btn-reset");
    expect(js).toContain("loadSettings");
    expect(js).toContain("updateSettings");
  });

  test("stats JS should be valid and loadable", () => {
    const js = fs.readFileSync(
      path.join(EXTENSION_PATH, "stats/stats.js"),
      "utf8"
    );
    expect(js).toContain("renderHeatmap");
    expect(js).toContain("exportJSON");
    expect(js).toContain("updateSummary");
    expect(js).toContain("btn-export");
  });

  test("service worker should contain message handlers", () => {
    const js = fs.readFileSync(
      path.join(EXTENSION_PATH, "background/service-worker.js"),
      "utf8"
    );
    expect(js).toContain("handleMessage");
    expect(js).toContain("handleTimerComplete");
    expect(js).toContain("saveRecord");
    expect(js).toContain('"start"');
    expect(js).toContain('"pause"');
    expect(js).toContain('"stop"');
    expect(js).toContain('"setMode"');
    expect(js).toContain('"getRecords"');
    expect(js).toContain('"updateSettings"');
  });
});

describe("E2E: DOM Structure Validation", () => {
  function parseHTML(html) {
    const parser = new DOMParser();
    return parser.parseFromString(html, "text/html");
  }

  test("popup page DOM should have timer display showing 25:00", () => {
    const html = fs.readFileSync(
      path.join(EXTENSION_PATH, "popup/popup.html"),
      "utf8"
    );
    const doc = parseHTML(html);

    const minutes = doc.getElementById("timer-minutes");
    const seconds = doc.getElementById("timer-seconds");
    expect(minutes).not.toBeNull();
    expect(seconds).not.toBeNull();
    expect(minutes.textContent).toBe("25");
    expect(seconds.textContent).toBe("00");

    const startBtn = doc.getElementById("btn-start");
    const pauseBtn = doc.getElementById("btn-pause");
    const stopBtn = doc.getElementById("btn-stop");
    expect(startBtn).not.toBeNull();
    expect(pauseBtn).not.toBeNull();
    expect(stopBtn).not.toBeNull();

    const modeTabs = doc.querySelectorAll(".mode-tab");
    expect(modeTabs.length).toBe(3);
    expect(modeTabs[0].dataset.mode).toBe("pomodoro");
    expect(modeTabs[1].dataset.mode).toBe("shortBreak");
    expect(modeTabs[2].dataset.mode).toBe("longBreak");
  });

  test("options page DOM should have settings inputs with defaults", () => {
    const html = fs.readFileSync(
      path.join(EXTENSION_PATH, "options/options.html"),
      "utf8"
    );
    const doc = parseHTML(html);

    const pomodoroInput = doc.getElementById("pomodoro-duration");
    const shortBreakInput = doc.getElementById("short-break-duration");
    const longBreakInput = doc.getElementById("long-break-duration");
    const intervalInput = doc.getElementById("long-break-interval");

    expect(pomodoroInput).not.toBeNull();
    expect(pomodoroInput.getAttribute("value")).toBe("25");
    expect(shortBreakInput.getAttribute("value")).toBe("5");
    expect(longBreakInput.getAttribute("value")).toBe("15");
    expect(intervalInput.getAttribute("value")).toBe("4");

    const saveBtn = doc.getElementById("btn-save");
    const resetBtn = doc.getElementById("btn-reset");
    expect(saveBtn).not.toBeNull();
    expect(resetBtn).not.toBeNull();
  });

  test("stats page DOM should have heatmap grid and export button", () => {
    const html = fs.readFileSync(
      path.join(EXTENSION_PATH, "stats/stats.html"),
      "utf8"
    );
    const doc = parseHTML(html);

    const heatmapGrid = doc.getElementById("heatmap-grid");
    const exportBtn = doc.getElementById("btn-export");
    const clearBtn = doc.getElementById("btn-clear");
    const totalPomodoros = doc.getElementById("total-pomodoros");
    const totalHours = doc.getElementById("total-hours");

    expect(heatmapGrid).not.toBeNull();
    expect(exportBtn).not.toBeNull();
    expect(clearBtn).not.toBeNull();
    expect(totalPomodoros).not.toBeNull();
    expect(totalHours).not.toBeNull();

    const legendCells = doc.querySelectorAll(".legend-cell");
    expect(legendCells.length).toBe(5);
  });

  test("popup page should link correct CSS and JS files", () => {
    const html = fs.readFileSync(
      path.join(EXTENSION_PATH, "popup/popup.html"),
      "utf8"
    );
    const doc = parseHTML(html);

    const links = doc.querySelectorAll('link[rel="stylesheet"]');
    expect(links.length).toBeGreaterThan(0);

    const scripts = doc.querySelectorAll("script");
    const srcList = Array.from(scripts).map((s) => s.getAttribute("src"));
    expect(srcList.some((s) => s && s.includes("timer-engine"))).toBe(true);
    expect(srcList.some((s) => s && s.includes("popup.js"))).toBe(true);
  });

  test("popup JS contains complete timer UI logic", () => {
    const js = fs.readFileSync(
      path.join(EXTENSION_PATH, "popup/popup.js"),
      "utf8"
    );

    expect(js).toContain("chrome.runtime.sendMessage");
    expect(js).toContain("chrome.runtime.onMessage");
    expect(js).toContain("formatTime");
    expect(js).toContain("updateUI");
    expect(js).toContain("btn-start");
    expect(js).toContain("btn-pause");
    expect(js).toContain("btn-stop");
    expect(js).toContain("mode-tab");
    expect(js).toContain("progressFill");
  });

  test("stats JS contains heatmap rendering and JSON export", () => {
    const js = fs.readFileSync(
      path.join(EXTENSION_PATH, "stats/stats.js"),
      "utf8"
    );

    expect(js).toContain("renderHeatmap");
    expect(js).toContain("renderMonthLabels");
    expect(js).toContain("updateSummary");
    expect(js).toContain("exportJSON");
    expect(js).toContain("showDayDetail");
    expect(js).toContain("JSON.stringify");
    expect(js).toContain("application/json");
    expect(js).toContain("getColor");
    expect(js).toContain("#216e39");
  });

  test("service worker handles all timer operations", () => {
    const js = fs.readFileSync(
      path.join(EXTENSION_PATH, "background/service-worker.js"),
      "utf8"
    );

    expect(js).toContain("chrome.alarms");
    expect(js).toContain("chrome.storage.local");
    expect(js).toContain("chrome.notifications");
    expect(js).toContain("chrome.runtime.onMessage");

    expect(js).toContain('"start"');
    expect(js).toContain('"pause"');
    expect(js).toContain('"stop"');
    expect(js).toContain('"setMode"');
    expect(js).toContain('"getState"');
    expect(js).toContain('"getRecords"');
    expect(js).toContain('"getSettings"');
    expect(js).toContain('"updateSettings"');

    expect(js).toContain("handleTimerComplete");
    expect(js).toContain("saveRecord");
    expect(js).toContain("broadcastState");
  });
});
