// Paste the deployed Google Apps Script Web App URL between the quotation marks.
// Until it is configured, the page runs in preview mode and does not save data.
window.POLL_CONFIG = {
  // These two lines control the wording on the background-poll pages.
  pollTitle: "Tell us about your background",
  pollIntroduction:
    "This anonymous two-question poll will help us understand the class and support your learning more effectively.",

  // Google Apps Script Web App URL. It must end in /exec.
  submissionEndpoint:
    "https://script.google.com/macros/s/AKfycbxKQ-gUr7YTWkMD6E1xbTjD0kEQQymVWKp8VwpjsVHy94BfuvvnGk5Ewx94MGYQ88eY/exec",

  // How often the statistics page refreshes, in seconds.
  statisticsRefreshSeconds: 10,

  // -------------------------------------------------------------------------
  // Quick A/B/C/D classroom poll
  // Change pollId whenever you introduce a new question. Use only letters,
  // numbers, hyphens and underscores in pollId.
  // -------------------------------------------------------------------------
  quickPoll: {
    pollId: "class-check-01",
    title: "Quick Check",
    question: "Which option is correct?",
    instruction: "Choose one answer and submit.",
    options: [
      { key: "A", text: "Option A" },
      { key: "B", text: "Option B" },
      { key: "C", text: "Option C" },
      { key: "D", text: "Option D" }
    ]
  }
};
