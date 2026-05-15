(function () {
  const timerMinutes = document.getElementById("timer-minutes");
  const timerSeconds = document.getElementById("timer-seconds");
  const progressFill = document.getElementById("progress-fill");
  const sessionCount = document.getElementById("session-count");
  const btnStart = document.getElementById("btn-start");
  const btnPause = document.getElementById("btn-pause");
  const btnResume = document.getElementById("btn-resume");
  const btnStop = document.getElementById("btn-stop");
  const btnSettings = document.getElementById("btn-settings");
  const btnStats = document.getElementById("btn-stats");
  const modeTabs = document.querySelectorAll(".mode-tab");
  const timerDisplay = document.querySelector(".timer-display");

  let currentState = null;
  let updateInterval = null;

  function sendMessage(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, resolve);
    });
  }

  function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return {
      minutes: String(minutes).padStart(2, "0"),
      seconds: String(seconds).padStart(2, "0"),
    };
  }

  function updateUI(state) {
    if (!state) return;
    currentState = state;

    const { minutes, seconds } = formatTime(state.remainingSeconds);
    timerMinutes.textContent = minutes;
    timerSeconds.textContent = seconds;

    const progress = state.totalSeconds > 0
      ? (state.remainingSeconds / state.totalSeconds) * 100
      : 100;
    progressFill.style.width = progress + "%";

    progressFill.className = "progress-fill";
    if (state.mode === "shortBreak") progressFill.classList.add("shortBreak");
    if (state.mode === "longBreak") progressFill.classList.add("longBreak");

    timerDisplay.className = "timer-display";
    if (state.status === "running") timerDisplay.classList.add("running");
    if (state.status === "paused") timerDisplay.classList.add("paused");

    const completedPomodoros = state.completedPomodoros || 0;
    const rawInterval = Number(state.settings?.longBreakInterval);
    const interval = Number.isFinite(rawInterval) && rawInterval > 0 ? rawInterval : 4;
    const progressInCycle = getCycleProgress(completedPomodoros, interval);
    sessionCount.textContent = I18N.t("pomodoroCount", {
      current: progressInCycle,
      interval,
    });

    modeTabs.forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.mode === state.mode);
      tab.disabled = state.status !== "idle";
    });

    btnStart.style.display = state.status === "idle" ? "inline-block" : "none";
    btnPause.style.display = state.status === "running" ? "inline-block" : "none";
    btnResume.style.display = state.status === "paused" ? "inline-block" : "none";
    btnStop.style.display = state.status !== "idle" ? "inline-block" : "none";

    if (state.status === "running") {
      startLocalUpdate();
    } else {
      stopLocalUpdate();
    }
  }

  function startLocalUpdate() {
    stopLocalUpdate();
    updateInterval = setInterval(async () => {
      const state = await sendMessage({ type: "getState" });
      if (state) updateUI(state);
    }, 1000);
  }

  function stopLocalUpdate() {
    if (updateInterval) {
      clearInterval(updateInterval);
      updateInterval = null;
    }
  }

  function getCycleProgress(completedPomodoros, interval) {
    if (interval <= 0) return completedPomodoros;
    const cycleProgress = completedPomodoros % interval;
    if (cycleProgress === 0 && completedPomodoros > 0) return interval;
    return cycleProgress;
  }

  btnStart.addEventListener("click", async () => {
    const state = await sendMessage({ type: "start" });
    updateUI(state);
  });

  btnPause.addEventListener("click", async () => {
    const state = await sendMessage({ type: "pause" });
    updateUI(state);
  });

  btnResume.addEventListener("click", async () => {
    const state = await sendMessage({ type: "start" });
    updateUI(state);
  });

  btnStop.addEventListener("click", async () => {
    const state = await sendMessage({ type: "stop" });
    updateUI(state);
  });

  modeTabs.forEach((tab) => {
    tab.addEventListener("click", async () => {
      const state = await sendMessage({ type: "setMode", mode: tab.dataset.mode });
      updateUI(state);
    });
  });

  btnSettings.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  btnStats.addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("stats/stats.html") });
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "timerUpdate") {
      updateUI(message.state);
    }
  });

  async function init() {
    await I18N.loadLanguage(sendMessage);
    I18N.applyTranslations();
    const state = await sendMessage({ type: "getState" });
    updateUI(state);
  }

  init();
})();
