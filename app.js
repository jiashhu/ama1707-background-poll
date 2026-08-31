const config = window.POLL_CONFIG || {};
const form = document.querySelector("#background-form");
const steps = [...document.querySelectorAll(".form-step")];
const nextButton = document.querySelector("#next-button");
const backButton = document.querySelector("#back-button");
const submitButton = document.querySelector("#submit-button");
const stepLabel = document.querySelector("#step-label");
const progressPercent = document.querySelector("#progress-percent");
const progressBar = document.querySelector("#progress-bar");
const originError = document.querySelector("#origin-error");
const backgroundError = document.querySelector("#background-error");
const otherWrap = document.querySelector("#other-wrap");
const otherInput = document.querySelector("#other-background");
const successView = document.querySelector("#success-view");
const backgroundInputs = [...document.querySelectorAll('input[name="mathBackground"]')];

function applyPageConfiguration() {
  const pollTitle = config.pollTitle || "Tell us about your background";
  const pollIntroduction =
    config.pollIntroduction ||
    "This anonymous two-question poll will help us understand the class and support your learning more effectively.";

  document.title = "Student Background Poll";
  document.querySelectorAll("[data-poll-title]").forEach((element) => {
    element.textContent = pollTitle;
  });
  document.querySelectorAll("[data-poll-introduction]").forEach((element) => {
    element.textContent = pollIntroduction;
  });
}

applyPageConfiguration();

function showStep(stepNumber) {
  steps.forEach((step) => {
    const isCurrent = Number(step.dataset.step) === stepNumber;
    step.hidden = !isCurrent;
    step.classList.toggle("is-active", isCurrent);
  });

  const percent = stepNumber === 1 ? 50 : 100;
  stepLabel.textContent = `Question ${stepNumber} of 2`;
  progressPercent.textContent = `${percent}%`;
  progressBar.style.width = `${percent}%`;
  document.querySelector(".poll-card").scrollIntoView({ behavior: "smooth", block: "start" });
}

function getOrigin() {
  return form.querySelector('input[name="origin"]:checked')?.value || "";
}

function getBackground() {
  return form.querySelector('input[name="mathBackground"]:checked')?.value || "";
}

nextButton.addEventListener("click", () => {
  if (!getOrigin()) {
    originError.textContent = "Please choose one option before continuing.";
    form.querySelector('input[name="origin"]')?.focus();
    return;
  }

  originError.textContent = "";
  showStep(2);
});

backButton.addEventListener("click", () => showStep(1));

form.addEventListener("change", (event) => {
  if (event.target.name === "origin") {
    originError.textContent = "";
  }

  if (event.target.name !== "mathBackground") return;

  const otherSelected = event.target.dataset.other === "true" && event.target.checked;
  otherWrap.hidden = !otherSelected;
  if (!otherSelected) otherInput.value = "";
  backgroundError.textContent = "";
});

async function sendResponse(payload) {
  const endpoint = (config.submissionEndpoint || "").trim();

  if (!endpoint) {
    console.info("Preview mode response:", payload);
    return { preview: true };
  }

  const body = new URLSearchParams();
  Object.entries(payload).forEach(([key, value]) => body.set(key, value));

  await fetch(endpoint, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body
  });

  return { preview: false };
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const background = getBackground();

  if (!background) {
    backgroundError.textContent = "Please choose one option.";
    backgroundInputs[0]?.focus();
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Submitting…";

  const payload = {
    origin: getOrigin(),
    mathBackground: background,
    otherBackground: otherInput.value.trim(),
    source: "Student background poll"
  };

  try {
    const result = await sendResponse(payload);
    form.hidden = true;
    successView.hidden = false;
    stepLabel.textContent = result.preview ? "Preview completed" : "Completed";
    progressPercent.textContent = "100%";
    progressBar.style.width = "100%";

    if (result.preview) {
      successView.querySelector("h2").textContent = "Preview completed";
      successView.querySelector("p:last-child").textContent =
        "The page is working. Add the Google Apps Script URL in config.js before sharing it with students.";
    }
  } catch (error) {
    console.error(error);
    backgroundError.textContent =
      "The response could not be sent. Please check your connection and try again.";
    submitButton.disabled = false;
    submitButton.textContent = "Submit anonymously";
  }
});
