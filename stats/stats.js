(function () {
  const heatmapGrid = document.getElementById("heatmap-grid");
  const monthLabels = document.getElementById("month-labels");
  const weekBarChart = document.getElementById("week-bar-chart");
  const yearSelect = document.getElementById("year-select");
  const totalPomodorosEl = document.getElementById("total-pomodoros");
  const totalHoursEl = document.getElementById("total-hours");
  const currentStreakEl = document.getElementById("current-streak");
  const todayPomodorosEl = document.getElementById("today-pomodoros");
  const detailSection = document.getElementById("detail-section");
  const detailDate = document.getElementById("detail-date");
  const detailSessions = document.getElementById("detail-sessions");
  const btnExport = document.getElementById("btn-export");
  const btnClear = document.getElementById("btn-clear");
  const btnBack = document.getElementById("btn-back");
  const tooltip = document.getElementById("heatmap-tooltip");

  let currentRecords = {};
  let selectedYear = new Date().getFullYear();

  function sendMessage(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, resolve);
    });
  }

  function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function getColor(minutes) {
    if (minutes === 0) return "#ebedf0";
    if (minutes <= 25) return "#9be9a8";
    if (minutes <= 50) return "#40c463";
    if (minutes <= 100) return "#30a14e";
    return "#216e39";
  }

  function getWeekdayLabel(day) {
    return I18N.t(`weekday${day}`);
  }

  function getMonthLabel(monthIndex) {
    return I18N.t(`month${monthIndex}`);
  }

  function getYearWeeksData(records, year) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const firstSunday = new Date(startDate);
    firstSunday.setDate(firstSunday.getDate() - firstSunday.getDay());

    const weeks = [];
    const current = new Date(firstSunday);

    while (current <= endDate || current.getDay() !== 0) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = formatDate(current);
        const inYear = current.getFullYear() === year;
        const dayData = inYear ? records[dateStr] || null : null;
        week.push({
          date: dateStr,
          inYear,
          data: dayData,
          minutes: dayData ? dayData.totalMinutes : 0,
        });
        current.setDate(current.getDate() + 1);
      }
      weeks.push(week);
      if (current > endDate && current.getDay() === 0) break;
    }

    return weeks;
  }

  function renderMonthLabels(weeks) {
    monthLabels.innerHTML = "";
    const labelContainer = document.createElement("div");
    labelContainer.style.display = "flex";
    labelContainer.style.width = "100%";
    let lastMonth = -1;

    weeks.forEach((week) => {
      const firstInYearDay = week.find((day) => day.inYear);
      const span = document.createElement("span");
      span.className = "month-label";
      if (firstInYearDay) {
        const month = new Date(firstInYearDay.date).getMonth();
        if (month !== lastMonth) {
          span.textContent = getMonthLabel(month);
          lastMonth = month;
        }
      }
      labelContainer.appendChild(span);
    });

    monthLabels.appendChild(labelContainer);
  }

  function renderHeatmap(records, year) {
    heatmapGrid.innerHTML = "";
    const weeks = getYearWeeksData(records, year);

    renderMonthLabels(weeks);

    weeks.forEach((week) => {
      const weekEl = document.createElement("div");
      weekEl.className = "heatmap-week";

      week.forEach((day) => {
        const cell = document.createElement("div");
        cell.className = "heatmap-cell";
        if (!day.inYear) {
          cell.classList.add("empty");
        } else {
          cell.style.background = getColor(day.minutes);
          cell.dataset.date = day.date;
          cell.addEventListener("mouseenter", () => {
            tooltip.textContent = `${day.date}: ${day.minutes} ${I18N.t("minutesUnit")}`;
            tooltip.classList.add("visible");
            const rect = cell.getBoundingClientRect();
            tooltip.style.left = `${rect.left + rect.width / 2}px`;
            tooltip.style.top = `${rect.top - 32}px`;
            tooltip.style.transform = "translateX(-50%)";
          });

          cell.addEventListener("mouseleave", () => {
            tooltip.classList.remove("visible");
          });

          cell.addEventListener("click", () => {
            showDayDetail(day.date, day.data);
          });
        }
        weekEl.appendChild(cell);
      });

      heatmapGrid.appendChild(weekEl);
    });
  }

  function getRecent7Days(records) {
    const list = [];
    const current = new Date();
    current.setHours(0, 0, 0, 0);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(current);
      d.setDate(d.getDate() - i);
      const key = formatDate(d);
      list.push({
        date: key,
        label: getWeekdayLabel(d.getDay()),
        pomodoros: records[key]?.pomodoros || 0,
      });
    }
    return list;
  }

  function renderRecentBarChart(records) {
    weekBarChart.innerHTML = "";
    const data = getRecent7Days(records);
    const max = Math.max(...data.map((d) => d.pomodoros), 1);
    data.forEach((d) => {
      const item = document.createElement("div");
      item.className = "week-bar-item";
      const value = document.createElement("div");
      value.className = "week-bar-value";
      value.textContent = `${d.pomodoros}`;
      const bar = document.createElement("div");
      bar.className = "week-bar";
      bar.style.height = `${Math.max((d.pomodoros / max) * 160, 4)}px`;
      const label = document.createElement("div");
      label.className = "week-bar-label";
      label.textContent = d.label;
      item.appendChild(value);
      item.appendChild(bar);
      item.appendChild(label);
      weekBarChart.appendChild(item);
    });
  }

  function updateSummary(records) {
    let totalPomodoros = 0;
    let totalMinutes = 0;
    let streak = 0;
    const todayStr = formatDate(new Date());

    Object.keys(records).forEach((date) => {
      totalPomodoros += records[date].pomodoros || 0;
      totalMinutes += records[date].totalMinutes || 0;
    });

    const checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);
    while (true) {
      const dateStr = formatDate(checkDate);
      if (records[dateStr] && records[dateStr].pomodoros > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (dateStr === todayStr) {
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    totalPomodorosEl.textContent = totalPomodoros;
    totalHoursEl.textContent = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    currentStreakEl.textContent = streak;
    todayPomodorosEl.textContent = records[todayStr] ? records[todayStr].pomodoros : 0;
  }

  function showDayDetail(date, data) {
    detailSection.style.display = "block";
    detailDate.textContent = date;

    if (!data || !data.sessions || data.sessions.length === 0) {
      detailSessions.innerHTML = `<p style="color:#888;font-size:13px;">${I18N.t("noSessions")}</p>`;
      return;
    }

    detailSessions.innerHTML = "";
    data.sessions.forEach((session) => {
      const item = document.createElement("div");
      item.className = "session-item";
      const sessionMode = session.mode || session.type;
      const typeLabel = {
        pomodoro: I18N.t("focusLabel"),
        shortBreak: I18N.t("shortBreakLabel"),
        longBreak: I18N.t("longBreakLabel"),
      }[sessionMode] || sessionMode;
      const durationMin = Math.round(session.duration / 60);
      const completedAt = session.completedAt
        ? new Date(session.completedAt).toLocaleTimeString()
        : "";

      item.innerHTML = `
        <span class="session-type ${sessionMode}">${typeLabel}</span>
        <span class="session-duration">${durationMin} ${I18N.t("minutesUnit")}</span>
        <span class="session-time">${completedAt}</span>
      `;
      detailSessions.appendChild(item);
    });
  }

  function exportJSON(data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pomodoro-data-${formatDate(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function buildYearSelect(records) {
    const years = new Set([new Date().getFullYear()]);
    Object.keys(records).forEach((date) => {
      years.add(new Date(date).getFullYear());
    });
    const sorted = Array.from(years).sort((a, b) => b - a);
    yearSelect.innerHTML = "";
    sorted.forEach((year) => {
      const option = document.createElement("option");
      option.value = String(year);
      option.textContent = String(year);
      yearSelect.appendChild(option);
    });
    if (!sorted.includes(selectedYear)) selectedYear = sorted[0];
    yearSelect.value = String(selectedYear);
  }

  function renderAll() {
    renderRecentBarChart(currentRecords);
    renderHeatmap(currentRecords, selectedYear);
    updateSummary(currentRecords);
  }

  btnExport.addEventListener("click", async () => {
    const result = await sendMessage({ type: "exportData" });
    if (result?.data) {
      exportJSON(result.data);
    } else {
      alert(I18N.t("noDataToExport"));
    }
  });

  btnClear.addEventListener("click", async () => {
    if (confirm(I18N.t("clearConfirm"))) {
      await chrome.storage.local.remove("records");
      detailSection.style.display = "none";
      await loadStats();
    }
  });

  yearSelect.addEventListener("change", () => {
    selectedYear = parseInt(yearSelect.value, 10);
    renderHeatmap(currentRecords, selectedYear);
  });

  btnBack.addEventListener("click", (e) => {
    e.preventDefault();
    window.close();
  });

  async function loadStats() {
    const records = await sendMessage({ type: "getRecords" });
    currentRecords = records || {};
    buildYearSelect(currentRecords);
    renderAll();
  }

  async function init() {
    await I18N.loadLanguage(sendMessage);
    I18N.applyTranslations();
    await loadStats();
  }

  init();
})();
