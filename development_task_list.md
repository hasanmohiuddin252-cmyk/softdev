# AI Code Review & Security Auditor Dashboard Task List

## Overview
This task list is derived from the implementation plan for the AI Code Review & Security Auditor Dashboard. It is organized into phases with clear dependencies so development can proceed in a predictable order.

## Ready to Start
- [x] Project Prerequisites — Initialize the Next.js + TypeScript app and install dependencies
- [x] Environment Configuration — Add a safe `.env.example` and document optional local secrets
- [ ] AI Schema Definition — Create Zod models for structured audit findings and validation
- [ ] Global Audit State — Implement the Zustand store for editor and findings state
- [ ] Fix API — Build the AI remediation patch generation endpoint

## Development Phases

### Phase 1: Base Application & Monaco Integration
- [x] 1. Project Prerequisites
  - Initialize the Next.js app with TypeScript and Tailwind
  - Install required packages: `@monaco-editor/react`, `zod`, `openai`, `@anthropic-ai/sdk`, `@octokit/rest`, `zustand`, `lucide-react`, `clsx`, and `tailwind-merge`
  - Verify the project boots cleanly
  - Depends on: none

- [x] 2. Environment Configuration
  - Add `.env.example` with variable names only; keep actual credentials in ignored `.env.local`
  - Document environment setup and clarify which Phase 1 variables are optional
  - Depends on: none

- [x] 3. Workspace Layout
  - Create the split-pane layout with editor on the left and audit dashboard on the right
  - Add header, status bar, and responsive shell
  - Depends on: Project Prerequisites

- [x] 4. Monaco Editor Integration
  - Add Monaco editor with dark theme, line numbers, and layout configuration
  - Prepare hooks for highlighting, scrolling, and editor selection
  - Depends on: Project Prerequisites, Workspace Layout

- [x] 5. Repository & File Ingestion
  - Support GitHub URL input and public repo file fetching
  - Implement file-loading routes and ingestion flow
  - Depends on: Project Prerequisites, Environment Configuration

### Phase 2: Backend LLM & Structured Schema Setup
- [x] 6. AI Schema Definition
  - Define Zod models for vulnerability findings and audit outputs
  - Enforce strong validation for structured LLM responses
  - Depends on: none

- [x] 7. Audit Prompt Layer
  - Build XML-wrapped prompts for code security reviews
  - Define scoring and OWASP-based instructions
  - Depends on: AI Schema Definition

- [x] 8. Audit API Endpoint
  - Create `POST /api/audit` to call the LLM and validate structured output
  - Return normalized audit results to the frontend
  - Depends on: AI Schema Definition, Audit Prompt Layer, Environment Configuration

### Phase 3: Dashboard UI & Monaco Synchronization
- [ ] 9. Global Audit State
  - Implement Zustand state for file content, findings, filters, and selected issue
  - Support synchronized editor and dashboard state updates
  - Depends on: none

- [ ] 10. Vulnerability Highlighting
  - Add Monaco gutter markers and background highlights by severity
  - Enable clicking cards to scroll to relevant lines in the editor
  - Depends on: Monaco Editor Integration, Global Audit State

### Phase 4: AI Remediation Engine & Diff Viewer
- [ ] 11. Fix API
  - Create `POST /api/fix` to patch a specific vulnerability in the current file
  - Return a secure code patch or fixed file content
  - Depends on: none

- [ ] 12. Diff Review Modal
  - Add a side-by-side diff viewer for original vs. AI-remediated code
  - Include accept and discard controls
  - Depends on: Fix API

### Phase 5: Testing & Quality Assurance
- [ ] 13. QA Validation
  - Run the end-to-end checklist for audit API, Monaco highlights, and line-number accuracy
  - Validate sample vulnerable code execution and patch flow
  - Confirm the implementation is ready to use
  - Depends on: Repository & File Ingestion, Audit API Endpoint, Vulnerability Highlighting, Diff Review Modal

## Dependency Summary

- `workspace-layout` depends on `project-prereqs`
- `monaco-editor` depends on `project-prereqs` and `workspace-layout`
- `repo-ingestion` depends on `project-prereqs` and `env-config`
- `audit-prompting` depends on `ai-schema`
- `audit-api` depends on `ai-schema`, `audit-prompting`, and `env-config`
- `monaco-decorations` depends on `monaco-editor` and `audit-state`
- `diff-review` depends on `fix-api`
- `qa-validation` depends on `repo-ingestion`, `audit-api`, `monaco-decorations`, and `diff-review`

## Suggested Execution Order
1. Project Prerequisites
2. Environment Configuration
3. AI Schema Definition
4. Global Audit State
5. Fix API
6. Workspace Layout
7. Monaco Editor Integration
8. Repository & File Ingestion
9. Audit Prompt Layer
10. Audit API Endpoint
11. Vulnerability Highlighting
12. Diff Review Modal
13. QA Validation

## Notes
This list is intended as a development backlog and is suitable for sprint planning, engineering execution, and explicit implementation progress tracking.
