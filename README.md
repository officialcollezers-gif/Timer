# Daywork — standalone Vercel app

This is a normal HTML/CSS/JavaScript frontend and a Node.js API. It does not use Apps Script or the Google-hosted frontend. No frontend build dependencies are required.

## Try the design locally

Install Node.js 22 or newer, open this folder in a terminal, and run:

```sh
npm run demo
```

Open http://127.0.0.1:3000. The clearly labeled demo uses temporary in-memory data, not your Sheet. Restarting clears demo data.

## Connect your Google Sheet

1. In Google Cloud, create/select a project and enable the **Google Sheets API**.
2. Create a service account and download its JSON key. Keep that file private; never upload it to a repository.
3. Share your existing spreadsheet with the service account's `client_email` as **Editor**. The sheet remains private; do not enable public sharing.
4. Create an Upstash Redis database. Copy its REST URL and REST token. Redis coordinates concurrent Vercel functions, limits login attempts, and prevents repeated request IDs from reapplying a successful change.
5. Add the variables from `.env.example` to Vercel Project Settings → Environment Variables. Use the JSON key's `client_email` and `private_key`. The private key can contain real newlines or literal `\n`. Use a strong unique `APP_PASSWORD` and a random `SESSION_SECRET` of at least 32 characters. Neither is sent to browser JavaScript.

Your target Sheet ID is already provided in `.env.example`. The app reads/writes tasks in **Sheet1**, columns A–E. Column E holds stable task IDs. Do not reuse that column. It creates **Web Sessions** for timer state/history; the old **Daily Sessions** tab is preserved. The old Apps Script timer is separate: use this app's timer after switching. Existing tasks are read from the same Sheet1 tab. The initial web timer starts fresh rather than copying an in-progress Apps Script session.

## Deploy to Vercel

1. Put this folder's contents in a GitHub repository (package.json must be at the repository root).
2. Import it in Vercel. Framework preset: **Other**. Build command: `npm run build`. Output directory: `public`. The included vercel.json sets these automatically and maps `/api` to the Node function.
3. Add all eight required environment variables from `.env.example`; `TIME_ZONE` is optional and defaults to America/Los_Angeles.
4. Deploy and open your Vercel URL. Sign in using `APP_PASSWORD`. Sessions use signed, HttpOnly cookies. Changing SESSION_SECRET invalidates existing cookies.

For a real local connection, copy `.env.example` to `.env.local`, fill its values, then run `npm run dev`. Do not commit .env.local.

## Behavior

- Start begins/resumes; Pause excludes breaks; End closes the date and prevents restarting that day.
- Midnight closes an unfinished previous day at its local boundary on the next API request, including daylight saving changes.
- Adding work defaults to Pending. Status options are Pending, Running, and Done.
- Work and session totals persist in Google Sheets. Closing/reloading the browser does not lose the timer.
- API writes use RAW values, so work titles are not evaluated as spreadsheet formulas.
- Status changes and new work are saved immediately. Sheet changes are fetched every 20 seconds when no form control is focused; use Refresh or reload for an immediate refresh.
- This is a single shared workspace with one password, not a multi-user employee tracker.

Avoid changing Sheet rows while a save is in progress. The Redis lock coordinates this application's requests; direct Sheet edits and the old Apps Script app do not participate in that lock. Designed for a personal, low-volume workspace, with reads bounded to 9,999 work/session rows. Google credentials are not included: the live connection must be configured before deployment can read/write the private Sheet.

## Checks

```sh
npm test
npm run build
```

Google's setup guide: https://developers.google.com/workspace/guides/create-credentials

Vercel environment variables: https://vercel.com/docs/environment-variables
