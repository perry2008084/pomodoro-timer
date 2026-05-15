(function () {
  const pomodoroInput = document.getElementById("pomodoro-duration");
  const shortBreakInput = document.getElementById("short-break-duration");
  const longBreakInput = document.getElementById("long-break-duration");
  const longBreakIntervalInput = document.getElementById("long-break-interval");
  const autoPauseEnabledInput = document.getElementById("auto-pause-enabled");
  const autoPauseStartInput = document.getElementById("auto-pause-start");
  const autoPauseEndInput = document.getElementById("auto-pause-end");
  const languageSelect = document.getElementById("language-select");
  const btnSave = document.getElementById("btn-save");
  const btnReset = document.getElementById("btn-reset");
  const btnExport = document.getElementById("btn-export");
  const importFileInput = document.getElementById("import-file");
  const statusMessage = document.getElementById("status-message");
  const btnBack = document.getElementById("btn-back");

  function sendMessage(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, resolve);
    });
  }

  function showStatusKey(key, type) {
    statusMessage.textContent = I18N.t(key);
    statusMessage.className = "status-message " + type;
    setTimeout(() => {
      statusMessage.className = "status-message";
    }, 3000);
  }

  function getSettingsFromInputs() {
    return {
      pomodoroDuration: parseInt(pomodoroInput.value, 10),
      shortBreakDuration: parseInt(shortBreakInput.value, 10),
      longBreakDuration: parseInt(longBreakInput.value, 10),
      longBreakInterval: parseInt(longBreakIntervalInput.value, 10),
      autoPauseEnabled: autoPauseEnabledInput.checked,
      autoPauseStart: autoPauseStartInput.value || "00:00",
      autoPauseEnd: autoPauseEndInput.value || "00:00",
      language: languageSelect.value || "en",
    };
  }

  function applySettingsToInputs(settings) {
    pomodoroInput.value = settings.pomodoroDuration;
    shortBreakInput.value = settings.shortBreakDuration;
    longBreakInput.value = settings.longBreakDuration;
    longBreakIntervalInput.value = settings.longBreakInterval;
    autoPauseEnabledInput.checked = !!settings.autoPauseEnabled;
    autoPauseStartInput.value = settings.autoPauseStart || "00:00";
    autoPauseEndInput.value = settings.autoPauseEnd || "00:00";
    languageSelect.value = settings.language || "en";
  }

  async function loadSettings() {
    const settings = await sendMessage({ type: "getSettings" });
    if (settings) {
      I18N.setLanguage(settings.language || "en");
      I18N.applyTranslations();
      applySettingsToInputs(settings);
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
    const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timePattern.test(autoPauseStartInput.value || "")) return false;
    if (!timePattern.test(autoPauseEndInput.value || "")) return false;
    return true;
  }

  async function exportData() {
    const result = await sendMessage({ type: "exportData" });
    if (!result?.data) return;
    const blob = new Blob([JSON.stringify(result.data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pomodoro-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showStatusKey("statusExported", "success");
  }

  async function importData(file) {
    if (!file) {
      showStatusKey("statusNoFile", "error");
      return;
    }
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const result = await sendMessage({ type: "importData", data: parsed });
      if (result?.error) {
        showStatusKey("statusImportFailed", "error");
        return;
      }
      await loadSettings();
      showStatusKey("statusImported", "success");
    } catch (error) {
      showStatusKey("statusImportFailed", "error");
    }
  }

  btnSave.addEventListener("click", async () => {
    if (!validateInputs()) {
      showStatusKey("statusInvalid", "error");
      return;
    }
    const settings = getSettingsFromInputs();
    await sendMessage({ type: "updateSettings", settings });
    I18N.setLanguage(settings.language);
    I18N.applyTranslations();
    showStatusKey("statusSaved", "success");
  });

  btnReset.addEventListener("click", async () => {
    const settings = {
      pomodoroDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      longBreakInterval: 4,
      autoPauseEnabled: false,
      autoPauseStart: "00:00",
      autoPauseEnd: "00:00",
      language: "en",
    };
    applySettingsToInputs(settings);
    await sendMessage({ type: "updateSettings", settings });
    I18N.setLanguage("en");
    I18N.applyTranslations();
    showStatusKey("statusReset", "success");
  });

  btnExport.addEventListener("click", exportData);

  importFileInput.addEventListener("change", async () => {
    const file = importFileInput.files?.[0];
    await importData(file);
    importFileInput.value = "";
  });

  languageSelect.addEventListener("change", () => {
    I18N.setLanguage(languageSelect.value);
    I18N.applyTranslations();
  });

  btnBack.addEventListener("click", (e) => {
    e.preventDefault();
    window.close();
  });

  async function init() {
    await I18N.loadLanguage(sendMessage);
    I18N.applyTranslations();
    await loadSettings();
  }

  init();
})();
