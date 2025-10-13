# skynest-api

[![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/ci.yml)

Replace `OWNER/REPO` above after pushing to GitHub.

## Scripts

- `npm run dev` — start with Nodemon
- `npm start` — start server
- `npm test` — run Jest tests
- `npm run db:seed` — seed admin
- `npm run db:seed:sample` — seed sample data
- `npm run lint` — lint code

## Env

Copy `.env` from local or create one with Postgres credentials and `JWT_SECRET`.

## CI

GitHub Actions workflow in `.github/workflows/ci.yml` provisions Postgres, applies schema, seeds, and runs tests on Node 20 and 22.

