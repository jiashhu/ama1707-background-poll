const quickConfig = window.POLL_CONFIG || {};
const quickPoll = quickConfig.quickPoll || {};
const quickForm = document.querySelector("#quick-form");
const quickOptions = document.querySelector("#quick-options");
const quickError = document.querySelector("#quick-error");
const quickSubmit = document.querySelector("#quick-submit");
const quickSuccess = document.querySelector("#quick-success");
const quickPollDemoMode = new URLSearchParams(window.location.search).get("demo") === "1";

function applyQuickPollConfiguration() {
  const title = quickPoll.title || "Quick Check";
  const question = quickPoll.question || "Which option is correct?";
  const instruction = quickPoll.instruction || "Choose one answer and submit.";
  const options = Array.isArray(quickPoll.options) ? quickPoll.options : [];

  document.title = title;
  document.querySelector("#quick-title").textContent = title;
  document.querySelector("#quick-question").textContent = question;
  document.querySelector("#quick-instruction").textContent = instruction;

  quickOptions.replaceChildren();
  options.forEach((option) => {
    const key = String(option.key || "").trim().toUpperCase();
    if (!key) return;
    const label = document.createElement("label");
    label.className = "choice-card quick-choice";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "quickChoice";
    input.value = key;

    const badge = document.createElement("span");
    badge.className = "option-key";
    badge.textContent = key;

    const copy = document.createElement("span");
    copy.className = "choice-copy";
    const strong = document.createElement("strong");
    strong.textContent = String(option.text || `Option ${key}`);
    copy.append(strong);

    const mark = document.createElement("span");
    mark.className = "choice-mark";
    mark.setAttribute("aria-hidden", "true");
    label.append(input, badge, copy, mark);
    quickOptions.append(label);
  });
}

quickForm.addEventListener("change", () => {
  quickError.textContent = "";
});

quickForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const selected = quickForm.querySelector('input[name="quickChoice"]:checked');
  if (!selected) {
    quickError.textContent = "Please choose one answer.";
    quickForm.querySelector('input[name="quickChoice"]')?.focus();
    return;
  }

  const option = (quickPoll.options || []).find(
    (item) => String(item.key || "").toUpperCase() === selected.value
  );
  const endpoint = (quickConfig.submissionEndpoint || "").trim();
  quickSubmit.disabled = true;
  quickSubmit.textContent = "Submitting…";

  const payload = new URLSearchParams({
    action: "quickSubmit",
    pollId: String(quickPoll.pollId || "quick-poll"),
    question: String(quickPoll.question || ""),
    choice: selected.value,
    choiceText: String(option?.text || ""),
    source: "Classroom quick poll"
  });

  try {
    if (endpoint && !quickPollDemoMode) {
      await fetch(endpoint, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: payload
      });
    }
    quickForm.hidden = true;
    quickSuccess.hidden = false;
    if (!endpoint || quickPollDemoMode) {
      quickSuccess.querySelector("h2").textContent = "Preview completed";
      quickSuccess.querySelector("p:last-child").textContent =
        quickPollDemoMode
          ? "The quick-poll workflow is working. No real response was submitted in demo mode."
          : "The page is working, but no response was saved because the Apps Script URL is missing.";
    }
  } catch (error) {
    console.error(error);
    quickError.textContent = "The answer could not be sent. Please try again.";
    quickSubmit.disabled = false;
    quickSubmit.textContent = "Submit answer";
  }
});

applyQuickPollConfiguration();
