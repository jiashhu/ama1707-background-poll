# Class Poll

A mobile-friendly, anonymous two-question class poll.

It collects:

1. Where the student completed most of their secondary education.
2. The highest or most relevant mathematics/calculus course they have studied.

No name, student ID, or email address is requested.

The project also contains `stats.html`, a live aggregate-results page. It shows
counts and percentages only; it never displays individual response rows.

The statistics page includes a teacher-only **Start next round** button. Before
clearing the current charts, it moves all current response rows to an `Archive`
sheet. The operation requires a private reset code.

The project also includes a reusable A/B/C/D classroom poll:

- `quick-poll.html` - the student answer page;
- `quick-stats.html` - the live doughnut-chart results page.

Both pages read the question and options from `quickPoll` in `config.js`. Change
the `pollId`, question, or option text there; the answer page and chart update
automatically. Adding an option such as E to the `options` array also adds it to
both pages.

## Quickly change the poll wording

Edit only `config.js`:

```js
pollTitle: "Tell us about your background",
pollIntroduction: "..."
```

On GitHub, open `config.js`, click the pencil icon, edit the text, and commit the
change. GitHub Pages normally updates within one or two minutes.

## Recommended publishing arrangement

- **GitHub Pages** hosts the webpage.
- **Google Apps Script + Google Sheets** receives and stores responses.

GitHub Pages alone cannot store submitted data because it only serves static files.

## 1. Create the response spreadsheet

1. Create a blank Google Sheet, for example `Class Poll Responses`.
2. In the sheet, open **Extensions → Apps Script**.
3. Replace the editor contents with `google-apps-script/Code.gs` from this folder.
4. Save the project.
5. Select **Deploy → New deployment**.
6. Choose **Web app**.
7. Set **Execute as** to **Me**.
8. Set access to **Anyone**. If the PolyU Google account does not permit this,
   use a personal Google account or another approved form service.
9. Deploy, authorise the script, and copy the Web App URL ending in `/exec`.

### Configure the private reset code

In the Apps Script project:

1. Open **Project Settings** (the gear icon).
2. Under **Script properties**, click **Add script property**.
3. Set the property name to `ADMIN_KEY`.
4. Set its value to a private code containing at least 8 characters.
5. Save it. Do not put this code in `config.js` or GitHub.

The statistics page will ask for this code whenever **Start next round** is
used. Current rows are archived rather than permanently deleted.

When `Code.gs` is changed later, go to **Deploy → Manage deployments**, click
the pencil icon, select **New version**, and deploy again. Keep the same Web App
URL unless Google explicitly issues a different one.

## 2. Connect the webpage to the spreadsheet

Open `config.js` and paste the Web App URL:

```js
window.POLL_CONFIG = {
  submissionEndpoint: "https://script.google.com/macros/s/...../exec"
};
```

Test one submission and confirm that a `Responses` sheet is created with a new row.

## 3. Publish with GitHub Pages

1. Create a new GitHub repository, for example `class-poll`.
2. Upload the contents of this folder to the repository root.
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Choose the `main` branch and `/ (root)`, then save.
6. GitHub will provide an address similar to:
   `https://YOUR-NAME.github.io/class-poll/`

The live results page will be at:

`https://YOUR-NAME.github.io/class-poll/stats.html`

The reusable quick-poll pages will be at:

```text
https://YOUR-NAME.github.io/class-poll/quick-poll.html
https://YOUR-NAME.github.io/class-poll/quick-stats.html
```

Both pages are part of the same GitHub Pages deployment. A second repository is
not required.

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
- `stats.html` is a public aggregate page if someone knows its address. It does
  not expose names or individual rows, but do not use it for sensitive data.
- The free-text “Other” answer is limited to 100 characters on the webpage and
  sanitised before it is written to the sheet.

## Local preview

The webpage can be opened locally for visual review. Without an endpoint in
`config.js`, it runs in preview mode and does not save responses.
