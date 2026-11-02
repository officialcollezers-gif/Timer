# Daywork — direct panel on Vercel

The frontend opens immediately with no ID or password. Anyone with the website URL can view and change this shared workspace.

The Vercel API connects to the existing Google Sheet through its Apps Script project. No Google Cloud service account or Redis is required. The Sheet stays private. A server-only bridge key protects the Apps Script endpoint and is never sent to the browser.

Vercel framework: Other. Build: npm run build. Output: public. These settings are included in vercel.json.

Set APPS_SCRIPT_URL to the deployed web app /exec URL, and APPS_SCRIPT_KEY to the same private value saved in the script's VERCEL_BRIDGE_KEY property. Deploy the script to run as its owner, accessible to Anyone. Requests without the bridge key are rejected. Never put the key in the frontend or repository.

Tasks use Sheet1 and timer history uses Daily Sessions. Start resumes, Pause excludes breaks, End closes today, and new work is Pending. Dates follow the Sheet timezone.

Node.js 22 or newer: npm test; npm run build. npm run demo starts a temporary local demo. For a real local connection, put the two variables in .env.local and run npm run dev.

Direct Sheet edits do not participate in the script lock. Avoid rearranging rows while saving.
