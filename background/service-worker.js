import { TimerEngine, getDefaultSettings, formatDate, createRecord } from "../core/timer-engine.js";

const ALARM_NAME = "pomodoro-timer";
const STORAGE_TIMER_KEY = "timerState";
const STORAGE_SETTINGS_KEY = "settings";
const STORAGE_RECORDS_KEY = "records";

let engine = null;
let initPromise = null;

async function init() {
  const data = await chrome.storage.local.get([
    STORAGE_TIMER_KEY,
    STORAGE_SETTINGS_KEY,
  ]);
  const settings = data[STORAGE_SETTINGS_KEY] || getDefaultSettings();
  engine = TimerEngine.deserialize(data[STORAGE_TIMER_KEY]);
  engine.settings = { ...getDefaultSettings(), ...settings };

  if (engine.status === "running" && engine.startedAt) {
    const remaining = engine.getRemainingSeconds();
    if (remaining <= 0) {
      await handleTimerComplete();
    } else {
      chrome.alarms.create(ALARM_NAME, { delayInMinutes: remaining / 60 });
    }
  }
}

initPromise = init();

async function saveState() {
  await chrome.storage.local.set({
    [STORAGE_TIMER_KEY]: engine.serialize(),
  });
}

async function saveSettings(settings) {
  await chrome.storage.local.set({
    [STORAGE_SETTINGS_KEY]: settings,
  });
}

async function saveRecord(session) {
  const date = formatDate(new Date());
  const data = await chrome.storage.local.get(STORAGE_RECORDS_KEY);
  const records = data[STORAGE_RECORDS_KEY] || {};
  if (!records[date]) {
    records[date] = {
      pomodoros: 0,
      totalMinutes: 0,
      sessions: [],
    };
  }
  const record = createRecord(date, session);
  records[date].sessions.push(record);
  if (session.mode === "pomodoro") {
    records[date].pomodoros++;
    records[date].totalMinutes += Math.round(session.duration / 60);
  }
  await chrome.storage.local.set({ [STORAGE_RECORDS_KEY]: records });
}

async function handleTimerComplete() {
  const result = engine.complete();
  if (result) {
    await saveRecord(result.completedSession);
    chrome.alarms.clear(ALARM_NAME);
    await saveState();
    chrome.notifications.create("pomodoro-complete", {
      type: "basic",
      iconUrl: "../icons/icon128.png",
      title:
        result.completedSession.mode === "pomodoro"
          ? "Pomodoro Complete!"
          : "Break Over!",
      message:
        result.completedSession.mode === "pomodoro"
          ? "Time for a break!"
          : "Time to focus!",
    });
    broadcastState();
  }
}

function broadcastState() {
  chrome.runtime.sendMessage({
    type: "timerUpdate",
    state: engine.getState(),
  }).catch(() => {});
}

function setAlarm(delaySeconds) {
  chrome.alarms.clear(ALARM_NAME, () => {
    if (delaySeconds > 0) {
      const delayInMinutes = Math.max(delaySeconds / 60, 0.01);
      chrome.alarms.create(ALARM_NAME, { delayInMinutes });
    }
  });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    handleTimerComplete();
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message).then(sendResponse).catch(console.error);
  return true;
});

async function handleMessage(message) {
  // Wait for init to complete before handling any messages
  if (initPromise) await initPromise;
  if (!engine) {
    console.error("TimerEngine not initialized");
    return { error: "Engine not ready" };
  }
  switch (message.type) {
    case "getState": {
      return engine.getState();
    }
    case "start": {
      const state = engine.start();
      if (state) {
        await saveState();
        const delay = engine.getExpirationDelaySeconds();
        if (delay !== null) setAlarm(delay);
        broadcastState();
      }
      return engine.getState();
    }
    case "pause": {
      const state = engine.pause();
      if (state) {
        chrome.alarms.clear(ALARM_NAME);
        await saveState();
        broadcastState();
      }
      return engine.getState();
    }
    case "stop": {
      const state = engine.stop();
      chrome.alarms.clear(ALARM_NAME);
      await saveState();
      broadcastState();
      return state;
    }
    case "setMode": {
      const state = engine.setMode(message.mode);
      if (state) {
        await saveState();
        broadcastState();
      }
      return engine.getState();
    }
    case "updateSettings": {
      const settings = { ...getDefaultSettings(), ...message.settings };
      engine.updateSettings(settings);
      await saveState();
      await saveSettings(settings);
      broadcastState();
      return engine.getState();
    }
    case "getRecords": {
      const data = await chrome.storage.local.get(STORAGE_RECORDS_KEY);
      return data[STORAGE_RECORDS_KEY] || {};
    }
    case "getSettings": {
      const data = await chrome.storage.local.get(STORAGE_SETTINGS_KEY);
      return data[STORAGE_SETTINGS_KEY] || getDefaultSettings();
    }
    default:
      return { error: "Unknown message type" };
  }
}

init();
