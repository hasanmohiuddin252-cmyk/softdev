# Sentinel — AI Code Review & Security Auditor

Sentinel is a Next.js workspace for loading source code from GitHub or local files and reviewing it for security findings.

## Features

- Resizable Monaco editor and audit dashboard with light/dark themes.
- Local file selection and drag-and-drop (up to 5 MB per file).
- Public GitHub repository browsing and file loading.
- Structured OpenAI security audits with validated findings and scoring.
- Severity-filtered findings synchronized with Monaco line highlights and navigation.
- AI-generated remediation suggestions reviewed in a side-by-side diff before applying.
- PostgreSQL audit history for finding details and file metadata.

## Requirements

- Node.js 20.9 or newer
- npm
- PostgreSQL 13 or newer
- An OpenAI API key to run audits

## Getting started

```bash
npm install
Copy-Item .env.example .env.local
```

On macOS or Linux, use `cp .env.example .env.local` instead of `Copy-Item`.

Set `DATABASE_URL` to a PostgreSQL database you control and set `OPENAI_API_KEY` in `.env.local`. Example local URL:

```env
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/DATABASE_NAME
```

Keep `.env.local` private; it is ignored by Git. Never use `NEXT_PUBLIC_` for secrets. `GITHUB_TOKEN` is optional and only increases the GitHub API rate limit. Anthropic integration is not enabled.

Apply database migrations:

```bash
npm run db:migrate
```

Then start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database and privacy

The migration creates `audit_reports`, `audit_findings`, and `schema_migrations`. Audit report metadata and findings are stored transactionally. **Submitted source code and `codeSnippet` values are never written to PostgreSQL.** The audit service sends source code to OpenAI for analysis; configure that provider according to your data-handling requirements.

The hosted preview uses GitHub OAuth with an explicit `ALLOWED_GITHUB_USERS` allow-list. Audit history is scoped to the signed-in GitHub account's stable numeric ID. Reports created before applying migration `002_scope_audit_history_to_users.sql` have no owner and are deliberately hidden from signed-in users. Do not add secrets to client-side environment variables or commit them to Git.

## Private Render preview

`render.yaml` defines a free Render Blueprint for a **private preview only**, not a reliable or market-ready production service. Render free web services can spin down after inactivity, and free PostgreSQL databases expire after 30 days; data can be deleted after the documented upgrade grace period. Free-tier availability, persistence, and support are not suitable for production. OpenAI usage is billed separately by the provider.

To create the preview:

1. Push this repository to GitHub and sign in to Render with an account that can access it.
2. In Render, create a **Blueprint Instance** for this repository and review the free web service and database before applying it.
3. Create a GitHub OAuth app. Set its authorization callback URL to `https://<your-render-service>.onrender.com/api/auth/callback/github`.
4. In the Render service environment, set `NEXTAUTH_URL` to `https://<your-render-service>.onrender.com`, `GITHUB_ID`, `GITHUB_SECRET`, `ALLOWED_GITHUB_USERS` (comma-separated GitHub usernames), and `OPENAI_API_KEY`. Optionally set `GITHUB_TOKEN` to improve GitHub API rate limits. Render generates `NEXTAUTH_SECRET` and wires the database connection.
5. Deploy and verify `https://<your-render-service>.onrender.com/api/health` returns `{"status":"ok"}`. Sign in with an allow-listed GitHub account and run the relevant manual cases in `TEST_CASES.md`.

The start command applies database migrations before starting Next.js. Keep all OAuth, database, GitHub, and OpenAI credentials in Render's private environment settings. Never place them in source control, chat, or a `NEXT_PUBLIC_` variable. The deployment remains inaccessible to users who are not on the allow-list.

The workspace requires GitHub OAuth for local and hosted use. For local development, configure `GITHUB_ID`, `GITHUB_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL=http://localhost:3000`, and your GitHub username in `ALLOWED_GITHUB_USERS` in `.env.local`; set the OAuth app callback URL to `http://localhost:3000/api/auth/callback/github`. Also configure `DATABASE_URL` and `OPENAI_API_KEY` for audits and history.

Moving beyond preview requires an explicit choice and setup of paid, persistent hosting/database plans, production monitoring and backups, and a production access policy.

## API

- `POST /api/audit` — accepts `{ "fileName": "...", "language": "...", "code": "...", "sourceType": "local" | "github" }`; returns a saved report.
- `POST /api/fix` — accepts the current file and a validated finding; returns a proposed complete-file patch. It never writes code to PostgreSQL.
- `GET /api/audits?limit=25` — lists recent reports (maximum 100).
- `GET /api/audits/{id}` — returns a report and its findings. Stored history omits code snippets.
- `GET /api/repo/tree` and `POST /api/repo/file` — load public GitHub repository files.
- `GET /api/health` — public health check used by the Render preview.

The audit, fix, history, and GitHub import routes require an authenticated, allow-listed GitHub user and return `401` otherwise. The audit endpoint returns a clear `503` when `OPENAI_API_KEY`, `DATABASE_URL`, the migration, or database connectivity is missing.

Findings from the currently open, unchanged source file can be selected to navigate to their reported lines. Editing or switching files clears those live highlights; historical reports remain viewable but do not navigate into source that was not saved.

For a live finding, choose **Suggest secure fix** to request a proposed patch. Review it in the side-by-side diff before applying; accepting updates the editor only and does not save or commit the file automatically. Re-run the audit after applying a patch. The remediation endpoint requires `OPENAI_API_KEY`, but does not require the database.

## QA status

Lint, TypeScript, and production build checks pass. The audit-to-fix editor flow, severity filtering, finding navigation, and patch accept/discard behavior have been exercised in the browser with mocked API responses. API input validation and missing-configuration responses have also been checked. A live OpenAI call and PostgreSQL migration/read-write test remain unverified until valid private provider credentials and a PostgreSQL instance are configured.

## Quality checks

```bash
npm run lint
npx tsc --noEmit
npm run build
```

See [TEST_CASES.md](./TEST_CASES.md) for the complete manual, API, integration, and release test checklist.
