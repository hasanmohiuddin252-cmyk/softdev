# Sentinel — AI Code Review & Security Auditor

Sentinel is a Next.js workspace for loading source code from GitHub or local files and preparing it for security review.

## Phase 1 features

- Next.js App Router with TypeScript, Tailwind CSS, and ESLint.
- Resizable editor and audit-panel layout that adapts to smaller screens.
- Monaco Editor with syntax highlighting, line numbers, automatic resizing, and light/dark themes.
- Local multi-file selection and drag-and-drop (files up to 5 MB each).
- Public GitHub repository browsing and individual file loading.
- Optional server-side `GITHUB_TOKEN` support for higher GitHub API limits.

AI auditing and patch generation are not enabled yet; the dashboard clearly indicates that audit output is not available in this phase.

## Requirements

- Node.js 20.9 or newer
- npm

## Getting started

```bash
npm install
Copy-Item .env.example .env.local
npm run dev
```

On macOS or Linux, use `cp .env.example .env.local` instead of `Copy-Item`.
The app runs at [http://localhost:3000](http://localhost:3000).

Set `GITHUB_TOKEN` in `.env.local` if you want a higher GitHub API rate limit. Public repositories can be loaded without it. OpenAI and Anthropic keys are only needed in later phases and are not used by the Phase 1 app.

## Loading code

- Paste a repository URL such as `https://github.com/vercel/next.js` to browse its files.
- Paste a file URL such as `https://github.com/vercel/next.js/blob/canary/package.json` to load that file directly.
- Use **Open files** or drop one or more local text/source files onto the workspace.

Repository and file requests are handled by server-side routes at `/api/repo/tree` and `/api/repo/file`. These routes only accept HTTPS links from `github.com`; the GitHub token is never exposed to the browser.

GitHub's contents API limits file downloads to 1 MB. Local files are limited to 5 MB per file for editor responsiveness.

## Quality checks

```bash
npm run lint
npm run build
```
