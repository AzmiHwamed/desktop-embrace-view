# Security scan — September 8, 2026

Scope: current frontend working tree, including uncommitted error-translation changes; npm dependency audit against the live registry. No production probing, backend authorization testing, deployed Firebase rules inspection, or credential-use testing was performed. No fixes were applied.

## Findings

### 1. High: logout leaves the previous account's session/data available

`src/features/auth/authSlice.ts:201` clears only auth state and REST tokens. The root store has no logout reset for profile, history, receipts, budgets, or chat. `src/lib/firebase-session.ts:12` reuses any Firebase current user without checking it against the current REST account. Logout does not call Firebase signOut.

Impact: on a shared browser, the next login can reuse the prior account's cached data. Budget hydration is skipped when the old `hydrated` flag remains true; chat initially reuses the old conversation and messages. Independently, the previous Firebase credentials remain usable after app logout. This is a local account-switch/session-isolation problem, not evidence of arbitrary remote account access.

Fix: cancel in-flight account work and subscriptions, sign out of Firebase, reset all account-specific slices, and reject late results from the previous session. Verify A → logout → B using password login as well as OAuth. Reconcile Firebase identity before reuse.

### 2. Medium: CSV formula injection

`src/lib/csv-export.ts:18` quotes and escapes CSV cells but does not neutralize formulas. Shop/category strings can become spreadsheet formulas when a downloaded export is opened.

Verified with the actual export function in an isolated harness: a harmless shop value `=1+1` is emitted unchanged as a quoted formula cell. No spreadsheet formula was executed. Exploitation requires a malicious value to enter an expense and the user to open the export in a spreadsheet that evaluates it.

Fix: use a spreadsheet-safe encoding for untrusted text cells, covering formula prefixes and leading control characters; CSV quoting alone is insufficient. Reference: [OWASP CSV Injection](https://owasp.org/www-community/attacks/CSV_Injection).

### 3. Medium, conditional: Google Maps API key is stored in a tracked .env

`git ls-files` includes `.env`; its variable names include `GOOGLE_MAPS_API_KEY`. `.gitignore` does not exclude `.env`. Values were not printed in this report.

Impact depends on repository visibility, key validity, and Google Cloud restrictions. An unrestricted exposed key can be abused for API quota/billing. Those restrictions were not checked. Firebase web configuration also exists in this file; its public client API key is not by itself an authentication secret.

Fix: remove real environment configuration from tracking, ignore it, keep placeholders in `.env.example`, restrict the Maps key to intended APIs and callers, and rotate it if exposed. Removing a file in a new commit does not remove old copies; preserve the project's published history.

### 4. Medium, conditional: raw errors are forwarded for translation

The newly added `src/lib/error-translation.ts:28` sends the complete error message to `/guest/translation/json`. This covers server, authentication, and validation errors with no redaction.

If an upstream error includes personal data, credentials, or internal diagnostics, those details enter the translation processing path. No actual sensitive error payload or downstream provider retention was verified. This is a data-minimization concern in the recent implementation, not a confirmed external disclosure.

Fix: translate stable error codes/templates where possible. Redact sensitive parameters before translating unknown errors; keep diagnostics separate from user-facing messages.

## Dependency audit

`npm audit --json` reports **2 high-severity vulnerable packages, 0 critical**. Severity comes from the registry and does not establish exploitability in this application.

| Installed package | Finding | Fix | Application context |
| --- | --- | --- | --- |
| `fast-uri@3.1.5` | Four URL parsing/normalization advisories, including SSRF/host confusion | `3.1.6` or later compatible version | Optional peer dependency through AJV / hookform resolvers. No application URL authorization/fetch path using it was identified. |
| `nanoid@3.3.16` | Custom generators can loop indefinitely with size zero | `3.3.18` or later compatible version | Found through PostCSS/Vite. Inspected PostCSS code uses `nanoid/non-secure` with fixed size 6, not the vulnerable custom-generator pattern. |

Sources: [fast-uri advisory](https://github.com/advisories/GHSA-f65p-4m7j-42xc), [nanoid advisory](https://github.com/advisories/GHSA-2v37-7h3g-55p8). Update compatible transitive versions, rebuild, and rerun audit; avoid a blind forced upgrade.

## Additional hardening / limits

- Access and refresh tokens are stored in localStorage (`src/lib/api-client.ts:96`). Any successful same-origin script injection could steal them. This is exposure amplification; no working XSS chain was demonstrated. Consider an HttpOnly-cookie backend-for-frontend session design with CSRF protection.
- No CSP/HSTS/frame policy was found in application configuration. A reverse proxy may already supply those headers; production headers were not inspected.
- API-derived map URLs are rendered directly. Validate expected HTTPS destinations as defense in depth; no verified attacker-controlled navigation exploit was established.
- Client subscription/route gates cannot establish backend authorization. Backend enforcement was outside this scan.

Priority: fix logout isolation first, then CSV handling and key hygiene; review raw-error translation and update the two dependencies.
