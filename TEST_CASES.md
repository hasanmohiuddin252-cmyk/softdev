# Sentinel Test Cases

This checklist covers the user interface, APIs, provider integrations, PostgreSQL persistence, and release checks. Tests marked **Live setup required** need a working OpenAI API key and PostgreSQL database. Use only synthetic source code and disposable test data.

## 1. Setup and configuration

| ID | Test | Expected result |
|---|---|---|
| SET-01 | Install dependencies and run `npm run dev`. | App starts and the workspace loads at `http://localhost:3000`. |
| SET-02 | Run `npm run lint`, `npx tsc --noEmit`, and `npm run build`. | All three commands pass. |
| SET-03 | Run `npm run db:migrate` without `DATABASE_URL`. | Migration stops with a clear missing-configuration error. |
| SET-04 | Run migration with a valid database URL and an empty database. **Live setup required** | Migration creates the schema successfully and records the migration. |
| SET-05 | Run migration again against the same database. **Live setup required** | It completes without recreating or damaging already-migrated tables. |
| SET-06 | Start with no `OPENAI_API_KEY` or `DATABASE_URL`. | The app remains usable; audit/history features show clear configuration errors rather than crashing. |

## 2. Workspace, editor, and themes

| ID | Test | Expected result |
|---|---|---|
| UI-01 | Load the home page at desktop size. | Header, file explorer, Monaco editor, and audit dashboard render. |
| UI-02 | Toggle light and dark themes. | Workspace and editor change theme correctly. |
| UI-03 | Reload after selecting a theme. | The saved theme preference is restored. |
| UI-04 | Open a small local source file. | File appears in the explorer and editor; name and language are shown correctly. |
| UI-05 | Open multiple local files, then select each in the explorer. | The selected file's content and metadata are displayed. |
| UI-06 | Edit the current file. | Editor content updates and the status bar indicates unsaved edits. |
| UI-07 | Load a local file larger than 5 MB. | The file is rejected or skipped with a clear size message. |
| UI-08 | Drag and drop a supported source file into the workspace. | File loads as if selected through the file picker. |
| UI-09 | Resize the editor/dashboard split using pointer and keyboard. | Split adjusts within its permitted bounds; keyboard resizing works. |
| UI-10 | Use the app at tablet and mobile widths. | Layout remains usable; editor and dashboard stack appropriately. |

## 3. GitHub file ingestion

| ID | Test | Expected result |
|---|---|---|
| GH-01 | Load a valid public GitHub repository URL. | Repository tree loads and source files are selectable. |
| GH-02 | Load a valid GitHub `/blob/` file URL. | That file loads directly into the editor. |
| GH-03 | Select a different file from the repository tree. | Correct file content, path, and language are shown. |
| GH-04 | Enter an invalid or unsupported GitHub URL. | A helpful validation error appears; no app crash. |
| GH-05 | Load a nonexistent or private repository without authorization. | A clear GitHub/API error appears. |
| GH-06 | Load a repository with no eligible source files. | Empty state is shown without breaking the workspace. |
| GH-07 | Attempt to load an oversized or unsupported file. | It is rejected or reported clearly; other workspace functions still work. |

## 4. Audit API and result validation

Use a small synthetic file for audit tests:

```ts
const userId = input;
const query = `SELECT * FROM users WHERE id = '${userId}'`;
db.query(query);
```

| ID | Test | Expected result |
|---|---|---|
| AUD-01 | Send valid JSON to `POST /api/audit` with a configured provider and database. **Live setup required** | Returns a validated report, score, severity counts, and findings. |
| AUD-02 | Send malformed JSON. | Returns HTTP 400 with a readable error. |
| AUD-03 | Omit `fileName`, `language`, or `code`. | Returns HTTP 400. |
| AUD-04 | Send empty or whitespace-only code. | Returns HTTP 400. |
| AUD-05 | Send code longer than 100,000 characters. | Returns HTTP 400. |
| AUD-06 | Send unexpected request fields. | Strict request validation rejects the payload. |
| AUD-07 | Request audit without `OPENAI_API_KEY`. | Returns HTTP 503 with a configuration message. |
| AUD-08 | Request audit without `DATABASE_URL`. | Returns HTTP 503 with a database configuration message. |
| AUD-09 | Configure an invalid or unavailable database. | Audit stops with a clear database availability error. |
| AUD-10 | Test a clean source file with a valid setup. **Live setup required** | A no-findings report is handled correctly, with an appropriate score and counts. |
| AUD-11 | Test findings covering multiple severities. **Live setup required** | Counts match the findings, and score remains between 0 and 100. |
| AUD-12 | Verify returned finding line ranges against the submitted source. | Lines are 1-indexed and within the source file; invalid model ranges are rejected. |
| AUD-13 | Submit source containing text that looks like instructions to the model. **Live setup required** | The text is treated as untrusted source, not followed as instructions. |
| AUD-14 | Simulate model refusal, invalid structured output, or rate limiting. | API returns a clear non-success response; it does not return a fake successful report. |

## 5. Findings, filters, and Monaco synchronization

| ID | Test | Expected result |
|---|---|---|
| FIND-01 | Run an audit that returns a finding on a known line. | Monaco shows the severity-colored line highlight, gutter marker, and hover title at the reported line. |
| FIND-02 | Select a finding card. | Editor scrolls to and centers the finding's starting line. |
| FIND-03 | Select the same finding again. | Selection highlight toggles off; source remains unchanged. |
| FIND-04 | Filter by a severity that has findings. | Only matching finding cards and editor markers remain visible. |
| FIND-05 | Filter by a severity with no findings. | An appropriate empty-filter message appears; no unrelated markers remain. |
| FIND-06 | Select "All" after filtering. | All findings and markers return. |
| FIND-07 | Edit source after an audit. | Live findings and line markers clear so stale line references aren't shown. |
| FIND-08 | Change files after an audit. | Previous file's findings and highlights clear. |
| FIND-09 | Change the source while an audit is in progress. | The completed audit is not linked to the changed source; a notice explains this. |
| FIND-10 | Open an older report from history. | Report is viewable, but cards do not navigate into unrelated current source. |

## 6. PostgreSQL history and privacy

| ID | Test | Expected result |
|---|---|---|
| DB-01 | Save a successful audit. **Live setup required** | Report and findings are written transactionally. |
| DB-02 | Cause a persistence error during audit save. **Live setup required** | API reports failure; no partial report/findings remain. |
| DB-03 | Call `GET /api/audits` with no `limit`. **Live setup required** | Returns recent reports using the default limit. |
| DB-04 | Call with limits below, at, and above the allowed maximum. **Live setup required** | Limit is validated/capped as documented; response shape remains valid. |
| DB-05 | Call `GET /api/audits/{id}` for a saved report. **Live setup required** | Report and finding metadata load successfully. |
| DB-06 | Request a nonexistent or malformed report ID. | Returns an appropriate not-found or validation error. |
| DB-07 | Delete a report in a disposable test database. **Live setup required** | Associated findings are removed according to the configured cascade. |
| DB-08 | Inspect database columns and stored rows after an audit. **Live setup required** | No submitted source code or code snippets are present in stored history. |
| DB-09 | Inspect history API responses. | Stored history does not reconstruct source snippets; snippets are empty/omitted as designed. |

## 7. AI remediation and diff review

| ID | Test | Expected result |
|---|---|---|
| FIX-01 | Send malformed JSON to `POST /api/fix`. | Returns HTTP 400. |
| FIX-02 | Omit a required field or send an invalid finding. | Returns HTTP 400. |
| FIX-03 | Send source over 100,000 characters or blank source. | Returns HTTP 400. |
| FIX-04 | Send a finding whose line range exceeds the submitted source. | Returns HTTP 400. |
| FIX-05 | Request a fix without `OPENAI_API_KEY`. | Returns HTTP 503; no provider call is made. |
| FIX-06 | Request a fix for a valid finding with a configured provider. **Live setup required** | Returns a complete proposed file, not a diff or markdown fences. |
| FIX-07 | Simulate model refusal, rate limit, malformed output, unchanged output, or oversized output. | Returns an explicit error; it does not claim a successful patch. |
| FIX-08 | Include instruction-like content in source and finding text. **Live setup required** | Inputs are treated as untrusted data, not as model instructions. |
| DIFF-01 | Choose **Suggest secure fix** for a live finding. | A side-by-side original/proposed diff appears. |
| DIFF-02 | Choose **Discard patch**. | Diff closes; editor content remains unchanged. |
| DIFF-03 | Choose **Accept and apply**. | Proposed content replaces editor content; unsaved status is shown. |
| DIFF-04 | Accept a patch, then run audit again. | New audit uses patched editor content. |
| DIFF-05 | Close the diff with Escape, close button, or backdrop click. | Dialog closes without applying the patch. |
| DIFF-06 | Change/switch the source while patch generation is pending. | Patch is rejected as stale and is not applied. |
| DIFF-07 | Verify accepted patch persistence. | Patch is not automatically saved to disk, GitHub, or PostgreSQL. |
| DIFF-08 | Use the diff modal in light and dark themes. | Diff editor follows selected theme and remains readable. |

## 8. Security, reliability, and release checks

| ID | Test | Expected result |
|---|---|---|
| SEC-01 | Search production client bundles for `OPENAI_API_KEY`. | No provider key or secret is present in client assets. |
| SEC-02 | Inspect `.gitignore` and repository history. | `.env.local` is ignored and no real credentials are committed. |
| SEC-03 | Inspect migration and history SQL. | No source-code or code-snippet columns or writes exist. |
| SEC-04 | Test malformed and oversized API requests. | Requests fail with clear client errors; server does not crash. |
| SEC-05 | Test GitHub URL parsing with unrelated hosts and malformed paths. | Only supported GitHub URLs are accepted. |
| SEC-06 | Test app with database/provider unavailable. | Workspace remains usable, and failures are surfaced honestly. |
| REG-01 | Run lint, TypeScript, and production build after changes. | All pass. |
| REG-02 | Run browser tests with mocked API responses. | Ingestion, highlights/filtering, navigation, diff, accept/discard work without external credentials. |
| REG-03 | Run live audit, fix, and DB round-trip tests. **Live setup required** | Real integration succeeds and stored data meets the no-source-code privacy rule. |

## Current verification status

Lint, TypeScript, build, browser workflow with mocked responses, API validation/configuration responses, and the client-bundle secret scan have passed. Live OpenAI and PostgreSQL cases remain to be run after configuring those services.
