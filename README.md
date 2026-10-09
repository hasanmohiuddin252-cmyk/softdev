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

Audit history is currently shared by anyone with access to the application because authentication and per-user ownership are not implemented. Deploy the app and database only in a trusted environment until authentication is added.

## API

- `POST /api/audit` — accepts `{ "fileName": "...", "language": "...", "code": "...", "sourceType": "local" | "github" }`; returns a saved report.
- `POST /api/fix` — accepts the current file and a validated finding; returns a proposed complete-file patch. It never writes code to PostgreSQL.
- `GET /api/audits?limit=25` — lists recent reports (maximum 100).
- `GET /api/audits/{id}` — returns a report and its findings. Stored history omits code snippets.
- `GET /api/repo/tree` and `POST /api/repo/file` — load public GitHub repository files.

The audit endpoint returns a clear `503` when `OPENAI_API_KEY`, `DATABASE_URL`, the migration, or database connectivity is missing.

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
