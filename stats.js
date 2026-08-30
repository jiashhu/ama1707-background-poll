const statsConfig = window.POLL_CONFIG || {};
const totalElement = document.querySelector("#total-responses");
const statusElement = document.querySelector("#stats-status");
const chartsElement = document.querySelector("#charts");
const originChart = document.querySelector("#origin-chart");
const mathChart = document.querySelector("#math-chart");
const updatedElement = document.querySelector("#last-updated");
const refreshButton = document.querySelector("#refresh-button");
let refreshTimer;
let requestNumber = 0;

function applyStatisticsConfiguration() {
  const courseCode = statsConfig.courseCode || "AMA1707";
  const courseTitle = statsConfig.courseTitle || "Introduction to Calculus";
  document.title = `${courseCode} Live Poll Results`;
  document.querySelectorAll("[data-course-code]").forEach((element) => {
    element.textContent = courseCode;
  });
  document.querySelectorAll("[data-course-title]").forEach((element) => {
    element.textContent = courseTitle;
  });
}

function sortedEntries(values) {
  return Object.entries(values || {}).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function renderBarChart(container, values, totalResponses) {
  container.replaceChildren();
  const entries = sortedEntries(values);

  if (entries.length === 0) {
    const message = document.createElement("p");
    message.className = "question-help";
    message.textContent = "No responses yet.";
    container.append(message);
    return;
  }

  const maximum = Math.max(...entries.map((entry) => entry[1]), 1);

  entries.forEach(([label, count]) => {
    const percentage = totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;
    const row = document.createElement("div");
    row.className = "bar-row";

    const labelElement = document.createElement("div");
    labelElement.className = "bar-label";
    labelElement.textContent = label;

    const track = document.createElement("div");
    track.className = "bar-track";
    track.setAttribute("aria-label", `${label}: ${count}, ${percentage}%`);

    const fill = document.createElement("div");
    fill.className = "bar-fill";
    fill.style.width = `${(count / maximum) * 100}%`;
    track.append(fill);

    const value = document.createElement("div");
    value.className = "bar-value";
    value.textContent = `${count} · ${percentage}%`;

    row.append(labelElement, track, value);
    container.append(row);
  });
}

function renderStatistics(data) {
  const total = Number(data.totalResponses) || 0;
  totalElement.textContent = String(total);
  renderBarChart(originChart, data.origins, total);
  renderBarChart(mathChart, data.mathematics, total);
  statusElement.hidden = true;
  statusElement.classList.remove("is-error");
  chartsElement.hidden = false;
  updatedElement.textContent = `Last updated ${new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  })}`;
}

function loadStatistics() {
  const endpoint = (statsConfig.submissionEndpoint || "").trim();
  requestNumber += 1;
  const currentRequest = requestNumber;

  if (new URLSearchParams(window.location.search).get("demo") === "1") {
    renderStatistics({
      totalResponses: 42,
      origins: { "Hong Kong": 24, "Mainland China": 13, Other: 5 },
      mathematics: {
        "HKDSE Core Mathematics only": 12,
        "HKDSE M1": 7,
        "HKDSE M2": 9,
        "Mainland Gaokao Mathematics": 13,
        "AP Calculus AB": 3,
        "AP Calculus BC": 2,
        "A-level Mathematics": 5,
        "No prior calculus": 10
      }
    });
    return;
  }

  if (!endpoint) {
    statusElement.hidden = false;
    statusElement.classList.add("is-error");
    statusElement.textContent = "Add the Google Apps Script URL in config.js to load results.";
    return;
  }

  const callbackName = `ama1707StatsCallback${Date.now()}${currentRequest}`;
  const script = document.createElement("script");
  const separator = endpoint.includes("?") ? "&" : "?";
  let timeout;

  window[callbackName] = (data) => {
    clearTimeout(timeout);
    delete window[callbackName];
    script.remove();
    renderStatistics(data || {});
  };

  script.onerror = () => {
    clearTimeout(timeout);
    delete window[callbackName];
    script.remove();
    statusElement.hidden = false;
    statusElement.classList.add("is-error");
    statusElement.textContent =
      "Results could not be loaded. Update and redeploy the Google Apps Script, then try again.";
  };

  timeout = window.setTimeout(() => {
    if (!window[callbackName]) return;
    delete window[callbackName];
    script.remove();
    statusElement.hidden = false;
    statusElement.classList.add("is-error");
    statusElement.textContent = "The results service did not respond. Please refresh and try again.";
  }, 12000);

  script.src = `${endpoint}${separator}callback=${encodeURIComponent(callbackName)}&_=${Date.now()}`;
  document.body.append(script);
}

function scheduleRefresh() {
  window.clearInterval(refreshTimer);
  const seconds = Math.max(Number(statsConfig.statisticsRefreshSeconds) || 10, 5);
  refreshTimer = window.setInterval(loadStatistics, seconds * 1000);
}

refreshButton.addEventListener("click", loadStatistics);
applyStatisticsConfiguration();
loadStatistics();
scheduleRefresh();
