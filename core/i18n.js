(function (root) {
  const TRANSLATIONS = {
    en: {
      appTitle: "Pomodoro Timer",
      popupHeading: "🍅 Pomodoro",
      modeFocus: "Focus",
      modeShortBreak: "Short Break",
      modeLongBreak: "Long Break",
      start: "Start",
      pause: "Pause",
      resume: "Resume",
      stop: "Stop",
      settings: "⚙ Settings",
      stats: "📊 Stats",
      pomodoroCount: "Pomodoro {current}/{interval}",
      optionsTitle: "Pomodoro Timer - Settings",
      optionsHeading: "🍅 Pomodoro Timer Settings",
      focusDuration: "Focus Duration (minutes)",
      shortBreakDuration: "Short Break Duration (minutes)",
      longBreakDuration: "Long Break Duration (minutes)",
      longBreakInterval: "Long Break After (pomodoros)",
      autoPauseEnabled: "Enable auto-pause time window",
      autoPauseStart: "Auto-pause start time",
      autoPauseEnd: "Auto-pause end time",
      language: "Language",
      languageEnglish: "English",
      languageChinese: "中文",
      saveSettings: "Save Settings",
      resetDefaults: "Reset to Defaults",
      exportData: "Export Data (JSON)",
      importData: "Import Data (JSON)",
      backToTimer: "← Back to Timer",
      statusSaved: "Settings saved successfully!",
      statusReset: "Settings reset to defaults.",
      statusInvalid: "Please enter valid positive numbers.",
      statusImported: "Data imported successfully!",
      statusImportFailed: "Import failed. Please use a valid JSON file.",
      statusNoFile: "Please choose a JSON file.",
      statusExported: "Data exported successfully!",
      statsTitle: "Pomodoro Timer - Statistics",
      statsHeading: "📊 Pomodoro Statistics",
      totalPomodoros: "Total Pomodoros",
      totalFocusTime: "Total Focus Time",
      dayStreak: "Day Streak",
      today: "Today",
      recent7Days: "Recent 7 Days",
      annualHeatmap: "Annual Heatmap",
      dailyActivity: "Daily Activity",
      less: "Less",
      more: "More",
      mon: "Mon",
      wed: "Wed",
      fri: "Fri",
      noSessions: "No sessions recorded.",
      exportJson: "📥 Export JSON",
      clearAllData: "🗑 Clear All Data",
      noDataToExport: "No data to export.",
      clearConfirm: "Are you sure you want to clear all Pomodoro data? This cannot be undone.",
      focusLabel: "Focus",
      shortBreakLabel: "Short Break",
      longBreakLabel: "Long Break",
      minutesUnit: "min",
      barChartPomodoros: "Pomodoros",
      weekday0: "Sun",
      weekday1: "Mon",
      weekday2: "Tue",
      weekday3: "Wed",
      weekday4: "Thu",
      weekday5: "Fri",
      weekday6: "Sat",
      month0: "Jan",
      month1: "Feb",
      month2: "Mar",
      month3: "Apr",
      month4: "May",
      month5: "Jun",
      month6: "Jul",
      month7: "Aug",
      month8: "Sep",
      month9: "Oct",
      month10: "Nov",
      month11: "Dec",
      yearLabel: "Year",
    },
    zh: {
      appTitle: "番茄钟",
      popupHeading: "🍅 番茄钟",
      modeFocus: "专注",
      modeShortBreak: "短休息",
      modeLongBreak: "长休息",
      start: "开始",
      pause: "暂停",
      resume: "继续",
      stop: "停止",
      settings: "⚙ 设置",
      stats: "📊 报表",
      pomodoroCount: "番茄钟 {current}/{interval}",
      optionsTitle: "番茄钟 - 设置",
      optionsHeading: "🍅 番茄钟设置",
      focusDuration: "专注时长（分钟）",
      shortBreakDuration: "短休息时长（分钟）",
      longBreakDuration: "长休息时长（分钟）",
      longBreakInterval: "每几次番茄钟后长休息",
      autoPauseEnabled: "启用自动暂停时段",
      autoPauseStart: "自动暂停开始时间",
      autoPauseEnd: "自动暂停结束时间",
      language: "语言",
      languageEnglish: "English",
      languageChinese: "中文",
      saveSettings: "保存设置",
      resetDefaults: "恢复默认",
      exportData: "导出数据（JSON）",
      importData: "导入数据（JSON）",
      backToTimer: "← 返回计时器",
      statusSaved: "设置已保存！",
      statusReset: "已恢复默认设置。",
      statusInvalid: "请输入有效的正整数。",
      statusImported: "数据导入成功！",
      statusImportFailed: "导入失败，请使用有效的 JSON 文件。",
      statusNoFile: "请选择一个 JSON 文件。",
      statusExported: "数据导出成功！",
      statsTitle: "番茄钟 - 报表",
      statsHeading: "📊 番茄钟报表",
      totalPomodoros: "累计番茄钟",
      totalFocusTime: "累计专注时长",
      dayStreak: "连续天数",
      today: "今日",
      recent7Days: "最近 7 天",
      annualHeatmap: "年度热力图",
      dailyActivity: "每日活跃度",
      less: "少",
      more: "多",
      mon: "一",
      wed: "三",
      fri: "五",
      noSessions: "暂无记录。",
      exportJson: "📥 导出 JSON",
      clearAllData: "🗑 清空全部数据",
      noDataToExport: "暂无可导出的数据。",
      clearConfirm: "确定要清空所有番茄钟数据吗？该操作无法撤销。",
      focusLabel: "专注",
      shortBreakLabel: "短休息",
      longBreakLabel: "长休息",
      minutesUnit: "分钟",
      barChartPomodoros: "番茄钟数",
      weekday0: "日",
      weekday1: "一",
      weekday2: "二",
      weekday3: "三",
      weekday4: "四",
      weekday5: "五",
      weekday6: "六",
      month0: "1月",
      month1: "2月",
      month2: "3月",
      month3: "4月",
      month4: "5月",
      month5: "6月",
      month6: "7月",
      month7: "8月",
      month8: "9月",
      month9: "10月",
      month10: "11月",
      month11: "12月",
      yearLabel: "年份",
    },
  };

  let currentLanguage = "en";

  function getNested(obj, key) {
    return obj[key];
  }

  function t(key, vars = {}) {
    const languageData = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
    const fallbackData = TRANSLATIONS.en;
    let value = getNested(languageData, key) || getNested(fallbackData, key) || key;
    Object.keys(vars).forEach((k) => {
      value = value.replace(`{${k}}`, vars[k]);
    });
    return value;
  }

  function applyTranslations() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
      el.title = t(el.dataset.i18nTitle);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      el.placeholder = t(el.dataset.i18nPlaceholder);
    });
  }

  async function loadLanguage(sendMessage) {
    if (typeof sendMessage === "function") {
      const settings = await sendMessage({ type: "getSettings" });
      currentLanguage = settings?.language || "en";
    } else if (root.chrome?.storage?.local) {
      const data = await root.chrome.storage.local.get("settings");
      currentLanguage = data.settings?.language || "en";
    }
    return currentLanguage;
  }

  function setLanguage(language) {
    currentLanguage = language === "zh" ? "zh" : "en";
  }

  root.I18N = {
    t,
    setLanguage,
    loadLanguage,
    applyTranslations,
    get language() {
      return currentLanguage;
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
