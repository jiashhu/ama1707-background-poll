const quickStatsConfig = window.POLL_CONFIG || {};
const quickStatsPoll = quickStatsConfig.quickPoll || {};
const quickPalette = ["#7a1736", "#d26483", "#24445f", "#d7a63c", "#4f8f72", "#8d6ab8"];
const quickTotal = document.querySelector("#quick-total");
const quickStatus = document.querySelector("#quick-stats-status");
const quickCard = document.querySelector("#quick-chart-card");
const quickDonut = document.querySelector("#quick-donut");
const quickUpdated = document.querySelector("#quick-updated");
const quickRefresh = document.querySelector("#quick-refresh");
const quickReset = document.querySelector("#quick-reset");
const quickResetDialog = document.querySelector("#quick-reset-dialog");
const quickResetForm = document.querySelector("#quick-reset-form");
const quickResetKey = document.querySelector("#quick-reset-key");
const quickResetError = document.querySelector("#quick-reset-error");
const quickCancelReset = document.querySelector("#quick-cancel-reset");
const quickConfirmReset = document.querySelector("#quick-confirm-reset");
const quickAdminMessage = document.querySelector("#quick-admin-message");
let quickRequestNumber = 0;
let quickTimer;
let quickPendingReset = false;
let quickDemoCleared = false;

function quickDemoMode() {
  return new URLSearchParams(window.location.search).get("demo") === "1";
}

function applyQuickStatsConfiguration() {
  const title = quickStatsPoll.title || "Quick Check";
  document.title = `${title} Results`;
  document.querySelector("#quick-stats-title").textContent = title;
  document.querySelector("#quick-stats-question").textContent =
    quickStatsPoll.question || "Which option is correct?";
}

function quickShowMessage(message, isError = false) {
  quickAdminMessage.textContent = message;
  quickAdminMessage.hidden = false;
  quickAdminMessage.classList.toggle("is-error", isError);
}

function renderQuickDonut(counts, total) {
  quickDonut.replaceChildren();
  const options = Array.isArray(quickStatsPoll.options) ? quickStatsPoll.options : [];
  let accumulated = 0;
  const segments = options.map((option, index) => {
    const count = Number(counts[option.key]) || 0;
    const start = accumulated;
    accumulated += total > 0 ? (count / total) * 100 : 0;
    return `${quickPalette[index % quickPalette.length]} ${start}% ${accumulated}%`;
  });

  const donut = document.createElement("div");
  donut.className = "donut-chart";
  donut.style.background = total > 0
    ? `conic-gradient(${segments.join(", ")})`
    : "#eee5e8";

  const center = document.createElement("div");
  center.className = "donut-center";
  center.innerHTML = `<strong>${total}</strong><span>responses</span>`;
  donut.append(center);

  const legend = document.createElement("div");
  legend.className = "donut-legend";
  options.forEach((option, index) => {
    const count = Number(counts[option.key]) || 0;
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    const row = document.createElement("div");
    row.className = "legend-row quick-legend-row";
    const swatch = document.createElement("span");
    swatch.className = "legend-swatch";
    swatch.style.background = quickPalette[index % quickPalette.length];
    const label = document.createElement("span");
    label.className = "legend-label";
    label.textContent = `${option.key}. ${option.text}`;
    const value = document.createElement("strong");
    value.textContent = `${count} · ${percentage}%`;
    row.append(swatch, label, value);
    legend.append(row);
  });
  quickDonut.append(donut, legend);
}

function renderQuickStatistics(data) {
  const total = Number(data.totalResponses) || 0;
  quickTotal.textContent = String(total);
  renderQuickDonut(data.choices || {}, total);
  quickStatus.hidden = true;
  quickCard.hidden = false;
  quickUpdated.textContent = `Last updated ${new Date().toLocaleTimeString([], {
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  })}`;

  if (quickPendingReset) {
    quickPendingReset = false;
    quickShowMessage(
      total === 0
        ? "The new round is ready. Previous answers were moved to Quick Poll Archive."
        : "Answers were not cleared. Check the reset code and Apps Script deployment.",
      total !== 0
    );
  }
}

function loadQuickStatistics() {
  if (quickDemoMode()) {
    renderQuickStatistics(
      quickDemoCleared
        ? { totalResponses: 0, choices: {} }
        : { totalResponses: 36, choices: { A: 5, B: 18, C: 9, D: 4 } }
    );
    return;
  }

  const endpoint = (quickStatsConfig.submissionEndpoint || "").trim();
  if (!endpoint) {
    quickStatus.textContent = "Add the Google Apps Script URL in config.js to load results.";
    quickStatus.classList.add("is-error");
    return;
  }

  quickRequestNumber += 1;
  const callbackName = `amaQuickStats${Date.now()}${quickRequestNumber}`;
  const script = document.createElement("script");
  let timeout;
  window[callbackName] = (data) => {
    clearTimeout(timeout);
    delete window[callbackName];
    script.remove();
    renderQuickStatistics(data || {});
  };
  script.onerror = () => {
    clearTimeout(timeout);
    delete window[callbackName];
    script.remove();
    quickStatus.hidden = false;
    quickStatus.classList.add("is-error");
    quickStatus.textContent = "Quick-poll results could not be loaded.";
  };
  timeout = window.setTimeout(() => {
    if (!window[callbackName]) return;
    delete window[callbackName];
    script.remove();
    quickStatus.hidden = false;
    quickStatus.classList.add("is-error");
    quickStatus.textContent = "The results service did not respond.";
  }, 12000);
  const separator = endpoint.includes("?") ? "&" : "?";
  script.src = `${endpoint}${separator}view=quick&pollId=${encodeURIComponent(
    quickStatsPoll.pollId || "quick-poll"
  )}&callback=${encodeURIComponent(callbackName)}&_=${Date.now()}`;
  document.body.append(script);
}

quickRefresh.addEventListener("click", loadQuickStatistics);
quickReset.addEventListener("click", () => {
  quickResetKey.value = "";
  quickResetError.textContent = "";
  quickResetDialog.showModal();
  quickResetKey.focus();
});
quickCancelReset.addEventListener("click", () => quickResetDialog.close());
quickResetDialog.addEventListener("click", (event) => {
  if (event.target === quickResetDialog) quickResetDialog.close();
});
quickResetForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const resetKey = quickResetKey.value.trim();
  if (resetKey.length < 8) {
    quickResetError.textContent = "The reset code must contain at least 8 characters.";
    return;
  }
  if (quickDemoMode()) {
    quickDemoCleared = true;
    quickResetDialog.close();
    renderQuickStatistics({ totalResponses: 0, choices: {} });
    quickShowMessage("Demo round cleared. No real data was changed.");
    return;
  }

  const endpoint = (quickStatsConfig.submissionEndpoint || "").trim();
  if (!endpoint) {
    quickResetError.textContent = "The Google Apps Script URL is missing from config.js.";
    return;
  }
  quickConfirmReset.disabled = true;
  quickConfirmReset.textContent = "Starting new round…";
  try {
    await fetch(endpoint, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: new URLSearchParams({
        action: "quickReset",
        pollId: String(quickStatsPoll.pollId || "quick-poll"),
        resetKey
      })
    });
    quickResetDialog.close();
    quickPendingReset = true;
    quickShowMessage("Reset request sent. Checking the new round…");
    window.setTimeout(loadQuickStatistics, 1800);
  } catch (error) {
    console.error(error);
    quickResetError.textContent = "The reset request could not be sent.";
  } finally {
    quickResetKey.value = "";
    quickConfirmReset.disabled = false;
    quickConfirmReset.textContent = "Archive and clear";
  }
});

applyQuickStatsConfiguration();
loadQuickStatistics();
quickTimer = window.setInterval(
  loadQuickStatistics,
  Math.max(Number(quickStatsConfig.statisticsRefreshSeconds) || 10, 5) * 1000
);
