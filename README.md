# skynest-api

[![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/ci.yml)

Replace `OWNER/REPO` above after pushing to GitHub.

## Database Docs

For the complete PostgreSQL schema, triggers, functions, and reporting views used by this API, see `docs/README_DB.md`.

## Scripts

- `npm run dev` — start with Nodemon
- `npm run dev:react` — start API using React build toggle
- `npm start` — start server
- `npm run start:react` — start server and prefer React build under `/app`
- `npm test` — run Jest tests
- `npm run db:seed` — seed admin
- `npm run db:seed:sample` — seed sample data
- `npm run lint` — lint code
- `npm run build:frontend` — build React app in `frontend/`
- `npm run build-and-start` — build React and serve it under `/app`
- `npm run setup:build:start` — seed DB, build React, then start API

## Env

Copy `.env` from local or create one with Postgres credentials and `JWT_SECRET`.

## CI

GitHub Actions workflow in `.github/workflows/ci.yml` provisions Postgres, applies schema, seeds, and runs tests on Node 20 and 22. It also builds the React app and uploads the artifact.

## Frontend

React app is under `frontend/` (Vite + React Router).

- Dev:
  - Terminal 1: `$env:PORT=4000; npm run dev`
  - Terminal 2: `cd frontend && npm run dev`
  - Open the printed URL (e.g. `http://localhost:5173/app/`)
- Prod-like via API:
  - `npm run build-and-start`
  - Open `http://localhost:4000/app`

The React dev server bundles its own CSS (no proxy needed).
