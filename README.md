# Merhaba Order Desk

Merhaba Order Desk is a restaurant operations MVP. This repository currently contains only the project foundation: a minimal Next.js frontend and an Express API with a health check.

## Prerequisites

- Node.js 20.19 or newer
- npm 10 or newer
- PostgreSQL

## Setup

Install all workspace dependencies from the repository root:

```bash
npm install
```

Create the backend environment file if one does not already exist:

```bash
cp backend/.env.example backend/.env
```

Update `DATABASE_URL` in `backend/.env` for your local PostgreSQL instance.

Apply the prepared database migration:

```bash
npm run prisma:migrate:dev --workspace backend
```

Generate Prisma Client after future schema changes:

```bash
npm run prisma:generate --workspace backend
```

## Development

Run the frontend at `http://localhost:3000`:

```bash
npm run dev:frontend
```

In a second terminal, run the backend at `http://localhost:4000`:

```bash
npm run dev:backend
```

The API health check is available at `GET http://localhost:4000/api/health`.

## Quality checks

```bash
npm run lint
npm run type-check
npm run build
```

## Workspace layout

- `frontend/` — Next.js App Router application
- `backend/` — Express API and Prisma configuration

Authentication, menu, table, and order features are intentionally outside this foundation task.
# monorepo
