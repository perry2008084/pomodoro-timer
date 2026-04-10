(function () {
  const pomodoroInput = document.getElementById("pomodoro-duration");
  const shortBreakInput = document.getElementById("short-break-duration");
  const longBreakInput = document.getElementById("long-break-duration");
  const longBreakIntervalInput = document.getElementById("long-break-interval");
  const btnSave = document.getElementById("btn-save");
  const btnReset = document.getElementById("btn-reset");
  const statusMessage = document.getElementById("status-message");
  const btnBack = document.getElementById("btn-back");

  function sendMessage(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, resolve);
    });
  }

  function showStatus(text, type) {
    statusMessage.textContent = text;
    statusMessage.className = "status-message " + type;
    setTimeout(() => {
      statusMessage.className = "status-message";
    }, 3000);
  }

  async function loadSettings() {
    const settings = await sendMessage({ type: "getSettings" });
    if (settings) {
      pomodoroInput.value = settings.pomodoroDuration;
      shortBreakInput.value = settings.shortBreakDuration;
      longBreakInput.value = settings.longBreakDuration;
      longBreakIntervalInput.value = settings.longBreakInterval;
    }
  }

  function validateInputs() {
    const values = [
      pomodoroInput.value,
      shortBreakInput.value,
      longBreakInput.value,
      longBreakIntervalInput.value,
    ];
    for (const v of values) {
      const n = parseInt(v, 10);
      if (isNaN(n) || n <= 0) return false;
    }
    return true;
  }

  btnSave.addEventListener("click", async () => {
    if (!validateInputs()) {
      showStatus("Please enter valid positive numbers.", "error");
      return;
    }
    const settings = {
      pomodoroDuration: parseInt(pomodoroInput.value, 10),
      shortBreakDuration: parseInt(shortBreakInput.value, 10),
      longBreakDuration: parseInt(longBreakInput.value, 10),
      longBreakInterval: parseInt(longBreakIntervalInput.value, 10),
    };
    await sendMessage({ type: "updateSettings", settings });
    showStatus("Settings saved successfully!", "success");
  });

  btnReset.addEventListener("click", async () => {
    pomodoroInput.value = 25;
    shortBreakInput.value = 5;
    longBreakInput.value = 15;
    longBreakIntervalInput.value = 4;
    const settings = {
      pomodoroDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      longBreakInterval: 4,
    };
    await sendMessage({ type: "updateSettings", settings });
    showStatus("Settings reset to defaults.", "success");
  });

  btnBack.addEventListener("click", (e) => {
    e.preventDefault();
    window.close();
  });

  loadSettings();
})();
