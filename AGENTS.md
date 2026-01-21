# Repository Guidelines

## Project Structure & Module Organization
- `client/` is the Vite + React frontend. Core code lives in `client/src/` (components, hooks, services, types).
- `server/` is the Express API. Core code lives in `server/src/` (routes, services, db, types).
- Shared TypeScript settings live in `tsconfig.base.json`.

## Build, Test, and Development Commands
- `npm run dev` starts both client and server in watch mode.
- `npm run dev:client` or `npm run dev:server` runs a single workspace.
- `npm run build` builds all workspaces; `npm run build:prod` sets `NODE_ENV=production`.
- `npm run start:prod` starts the compiled server from `server/dist/index.js`.
- `npm run lint` runs ESLint across workspaces; `npm run typecheck` runs TypeScript checks.
- `npm run db:init` initializes server-side database schema.

## Coding Style & Naming Conventions
- TypeScript is strict (`strict: true`). Prefer typed boundaries and avoid `any` (warned in server lint rules).
- ESLint is configured per workspace (`client/eslint.config.js`, `server/eslint.config.js`). Fix lint warnings before opening a PR.
- Follow established naming patterns: React components in `PascalCase`, hooks prefixed with `use`, and files grouped by feature when possible.

## Testing Guidelines
- Server tests run with Vitest: `npm run test --workspace=server` (also invoked by root `npm run test`).
- Client tests run with Vitest: `npm run test --workspace=client`.

## Commit & Pull Request Guidelines
- Commit history uses Conventional Commits (e.g., `feat(ui): ...`, `fix(lint): ...`). Keep scope short and meaningful.
- PRs should describe user impact, list key changes, and include screenshots for UI changes.

## Security & Configuration Tips
- Copy `.env.example` to `.env` and keep secrets out of version control.
- Gmail and OpenAI keys are required for email and AI features; see README for setup details.
