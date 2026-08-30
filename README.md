# AMA1707 Student Background Poll

A mobile-friendly, anonymous two-question class poll.

It collects:

1. Where the student completed most of their secondary education.
2. Which mathematics/calculus curricula or levels they have studied.

No name, student ID, or email address is requested.

## Recommended publishing arrangement

- **GitHub Pages** hosts the webpage.
- **Google Apps Script + Google Sheets** receives and stores responses.

GitHub Pages alone cannot store submitted data because it only serves static files.

## 1. Create the response spreadsheet

1. Create a blank Google Sheet, for example `AMA1707 Student Background Poll`.
2. In the sheet, open **Extensions → Apps Script**.
3. Replace the editor contents with `google-apps-script/Code.gs` from this folder.
4. Save the project.
5. Select **Deploy → New deployment**.
6. Choose **Web app**.
7. Set **Execute as** to **Me**.
8. Set access to **Anyone**. If the PolyU Google account does not permit this,
   use a personal Google account or another approved form service.
9. Deploy, authorise the script, and copy the Web App URL ending in `/exec`.

## 2. Connect the webpage to the spreadsheet

Open `config.js` and paste the Web App URL:

```js
window.POLL_CONFIG = {
  submissionEndpoint: "https://script.google.com/macros/s/...../exec"
};
```

Test one submission and confirm that a `Responses` sheet is created with a new row.

## 3. Publish with GitHub Pages

1. Create a new GitHub repository, for example `ama1707-background-poll`.
2. Upload the contents of this folder to the repository root.
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Choose the `main` branch and `/ (root)`, then save.
6. GitHub will provide an address similar to:
   `https://YOUR-NAME.github.io/ama1707-background-poll/`

## 4. Create the classroom QR code

After the GitHub Pages address works, generate a QR code using a trusted QR-code
generator or the browser's “Create QR code for this page” feature. Put the QR
code on the lecture slide and keep the short web address below it as a backup.

Before class, test the QR code on both an iPhone and an Android phone, and make
one test submission using mobile data rather than campus Wi-Fi.

## Privacy and practical notes

- Tell students the poll is anonymous and ask them to submit once only.
- Because no login or identifier is collected, duplicate submissions cannot be
  reliably prevented.
- Avoid adding names, student IDs, emails, or sensitive demographic questions
  unless there is a clear educational need and an approved data-handling plan.
- Restrict access to the Google Sheet to the teaching team.
- The free-text “Other” answer is limited to 100 characters on the webpage and
  sanitised before it is written to the sheet.

## Local preview

The webpage can be opened locally for visual review. Without an endpoint in
`config.js`, it runs in preview mode and does not save responses.
