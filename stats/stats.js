(function () {
  const heatmapGrid = document.getElementById("heatmap-grid");
  const monthLabels = document.getElementById("month-labels");
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

  function getWeeksData(records) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + (7 - endDate.getDay()) % 7);

    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 364);

    const adjustToSunday = startDate.getDay();
    startDate.setDate(startDate.getDate() - adjustToSunday);

    const weeks = [];
    let current = new Date(startDate);

    while (current <= endDate) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = formatDate(current);
        const dayData = records[dateStr] || null;
        week.push({
          date: dateStr,
          dayOfWeek: current.getDay(),
          data: dayData,
          minutes: dayData ? dayData.totalMinutes : 0,
        });
        current.setDate(current.getDate() + 1);
      }
      weeks.push(week);
    }

    return { weeks, startDate, endDate };
  }

  function renderMonthLabels(weeks) {
    monthLabels.innerHTML = "";
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    let lastMonth = -1;
    const labelContainer = document.createElement("div");
    labelContainer.style.display = "flex";
    labelContainer.style.width = "100%";

    weeks.forEach((week, i) => {
      const firstDay = new Date(week[0].date);
      const month = firstDay.getMonth();
      const span = document.createElement("span");
      span.className = "month-label";

      if (month !== lastMonth) {
        span.textContent = months[month];
        lastMonth = month;
      }
      labelContainer.appendChild(span);
    });

    monthLabels.appendChild(labelContainer);
  }

  function renderHeatmap(records) {
    heatmapGrid.innerHTML = "";
    const { weeks } = getWeeksData(records);

    renderMonthLabels(weeks);

    weeks.forEach((week) => {
      const weekEl = document.createElement("div");
      weekEl.className = "heatmap-week";

      week.forEach((day) => {
        const cell = document.createElement("div");
        cell.className = "heatmap-cell";
        cell.style.background = getColor(day.minutes);
        cell.dataset.date = day.date;

        cell.addEventListener("mouseenter", (e) => {
          tooltip.textContent = `${day.date}: ${day.minutes} min`;
          tooltip.classList.add("visible");
          const rect = cell.getBoundingClientRect();
          tooltip.style.left = (rect.left + rect.width / 2) + "px";
          tooltip.style.top = (rect.top - 32) + "px";
          tooltip.style.transform = "translateX(-50%)";
        });

        cell.addEventListener("mouseleave", () => {
          tooltip.classList.remove("visible");
        });

        cell.addEventListener("click", () => {
          showDayDetail(day.date, day.data);
        });

        weekEl.appendChild(cell);
      });

      heatmapGrid.appendChild(weekEl);
    });
  }

  function updateSummary(records) {
    let totalPomodoros = 0;
    let totalMinutes = 0;
    let streak = 0;

    const dates = Object.keys(records).sort().reverse();
    const todayStr = formatDate(new Date());

    dates.forEach((date) => {
      totalPomodoros += records[date].pomodoros || 0;
      totalMinutes += records[date].totalMinutes || 0;
    });

    const sortedDates = Object.keys(records).sort();
    let checkDate = new Date();
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

    const todayData = records[todayStr];
    todayPomodorosEl.textContent = todayData ? todayData.pomodoros : 0;
  }

  function showDayDetail(date, data) {
    detailSection.style.display = "block";
    detailDate.textContent = date;

    if (!data || !data.sessions || data.sessions.length === 0) {
      detailSessions.innerHTML = '<p style="color:#888;font-size:13px;">No sessions recorded.</p>';
      return;
    }

    detailSessions.innerHTML = "";
    data.sessions.forEach((session) => {
      const item = document.createElement("div");
      item.className = "session-item";

      const typeLabel = {
        pomodoro: "Focus",
        shortBreak: "Short Break",
        longBreak: "Long Break",
      }[session.mode] || session.mode;

      const durationMin = Math.round(session.duration / 60);
      const completedAt = session.completedAt
        ? new Date(session.completedAt).toLocaleTimeString()
        : "";

      item.innerHTML = `
        <span class="session-type ${session.mode}">${typeLabel}</span>
        <span class="session-duration">${durationMin} min</span>
        <span class="session-time">${completedAt}</span>
      `;
      detailSessions.appendChild(item);
    });
  }

  function exportJSON(records) {
    const exportData = {
      exportedAt: new Date().toISOString(),
      summary: {
        totalPomodoros: 0,
        totalMinutes: 0,
        totalDays: Object.keys(records).length,
      },
      dailyRecords: records,
    };

    Object.values(records).forEach((day) => {
      exportData.summary.totalPomodoros += day.pomodoros || 0;
      exportData.summary.totalMinutes += day.totalMinutes || 0;
    });

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pomodoro-stats-${formatDate(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  btnExport.addEventListener("click", async () => {
    const records = await sendMessage({ type: "getRecords" });
    if (records && Object.keys(records).length > 0) {
      exportJSON(records);
    } else {
      alert("No data to export.");
    }
  });

  btnClear.addEventListener("click", async () => {
    if (confirm("Are you sure you want to clear all Pomodoro data? This cannot be undone.")) {
      await chrome.storage.local.remove("records");
      detailSection.style.display = "none";
      await loadStats();
    }
  });

  btnBack.addEventListener("click", (e) => {
    e.preventDefault();
    window.close();
  });

  async function loadStats() {
    const records = await sendMessage({ type: "getRecords" });
    renderHeatmap(records || {});
    updateSummary(records || {});
  }

  loadStats();
})();
