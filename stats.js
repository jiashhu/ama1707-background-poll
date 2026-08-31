const statsConfig = window.POLL_CONFIG || {};
const totalElement = document.querySelector("#total-responses");
const statusElement = document.querySelector("#stats-status");
const chartsElement = document.querySelector("#charts");
const originChart = document.querySelector("#origin-chart");
const mathChart = document.querySelector("#math-chart");
const updatedElement = document.querySelector("#last-updated");
const refreshButton = document.querySelector("#refresh-button");
const resetButton = document.querySelector("#reset-button");
const resetDialog = document.querySelector("#reset-dialog");
const resetForm = document.querySelector("#reset-form");
const resetKeyInput = document.querySelector("#reset-key");
const resetError = document.querySelector("#reset-error");
const cancelResetButton = document.querySelector("#cancel-reset-button");
const confirmResetButton = document.querySelector("#confirm-reset-button");
const adminMessage = document.querySelector("#admin-message");
let refreshTimer;
let requestNumber = 0;
let pendingResetCheck = false;
let demoRoundCleared = false;

function isDemoMode() {
  return new URLSearchParams(window.location.search).get("demo") === "1";
}

function showAdminMessage(message, isError = false) {
  adminMessage.textContent = message;
  adminMessage.hidden = false;
  adminMessage.classList.toggle("is-error", isError);
}

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

  if (pendingResetCheck) {
    pendingResetCheck = false;
    if (total === 0) {
      showAdminMessage("The new round is ready. Previous responses were moved to Archive.");
    } else {
      showAdminMessage(
        "Responses were not cleared. Check the reset code and confirm that the latest Apps Script version is deployed.",
        true
      );
    }
  }
}

function loadStatistics() {
  const endpoint = (statsConfig.submissionEndpoint || "").trim();
  requestNumber += 1;
  const currentRequest = requestNumber;

  if (isDemoMode()) {
    if (demoRoundCleared) {
      renderStatistics({ totalResponses: 0, origins: {}, mathematics: {} });
      return;
    }
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
        "A-level / International A-level Mathematics": 5,
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

resetButton.addEventListener("click", () => {
  resetError.textContent = "";
  resetKeyInput.value = "";
  resetDialog.showModal();
  resetKeyInput.focus();
});

cancelResetButton.addEventListener("click", () => resetDialog.close());

resetDialog.addEventListener("click", (event) => {
  if (event.target === resetDialog) resetDialog.close();
});

resetForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const resetKey = resetKeyInput.value.trim();

  if (resetKey.length < 8) {
    resetError.textContent = "The reset code must contain at least 8 characters.";
    resetKeyInput.focus();
    return;
  }

  if (isDemoMode()) {
    demoRoundCleared = true;
    resetDialog.close();
    renderStatistics({ totalResponses: 0, origins: {}, mathematics: {} });
    showAdminMessage("Demo round cleared. No real data was changed.");
    return;
  }

  const endpoint = (statsConfig.submissionEndpoint || "").trim();
  if (!endpoint) {
    resetError.textContent = "The Google Apps Script URL is missing from config.js.";
    return;
  }

  confirmResetButton.disabled = true;
  confirmResetButton.textContent = "Starting new round…";

  const body = new URLSearchParams({ action: "reset", resetKey });

  try {
    await fetch(endpoint, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body
    });

    resetDialog.close();
    pendingResetCheck = true;
    showAdminMessage("Reset request sent. Checking the new round…");
    window.setTimeout(loadStatistics, 1800);
  } catch (error) {
    console.error(error);
    resetError.textContent = "The reset request could not be sent. Please try again.";
  } finally {
    resetKeyInput.value = "";
    confirmResetButton.disabled = false;
    confirmResetButton.textContent = "Archive and clear";
  }
});

applyStatisticsConfiguration();
loadStatistics();
scheduleRefresh();
