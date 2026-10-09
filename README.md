# Sentinel — AI Code Review & Security Auditor

Sentinel is a Next.js workspace for loading source code from GitHub or local files and reviewing it for security findings.

## Features

- Resizable Monaco editor and audit dashboard with light/dark themes.
- Local file selection and drag-and-drop (up to 5 MB per file).
- Public GitHub repository browsing and file loading.
- Structured OpenAI security audits with validated findings and scoring.
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
- `GET /api/audits?limit=25` — lists recent reports (maximum 100).
- `GET /api/audits/{id}` — returns a report and its findings. Stored history omits code snippets.
- `GET /api/repo/tree` and `POST /api/repo/file` — load public GitHub repository files.

The audit endpoint returns a clear `503` when `OPENAI_API_KEY`, `DATABASE_URL`, the migration, or database connectivity is missing.

## Quality checks

```bash
npm run lint
npx tsc --noEmit
npm run build
```
