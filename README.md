# Merhaba Order Desk

Merhaba Order Desk is a restaurant operations MVP. This repository currently contains only the project foundation: a minimal Next.js frontend and an Express API with a health check.

## Prerequisites

- Node.js 20.19 or newer
- npm 10 or newer
- PostgreSQL

## Setup

Install frontend and backend dependencies separately:

```bash
cd frontend
npm install

cd ../backend
npm install
```

Create the backend environment file if one does not already exist:

```bash
cp backend/.env.example backend/.env
```

Update `DATABASE_URL` in `backend/.env` for your local PostgreSQL instance and
set `JWT_SECRET` to a strong random value. For example:

```bash
openssl rand -base64 48
```

Apply the prepared database migration:

```bash
cd backend
npm run prisma:migrate:dev
```

For reviewer/demo accounts, run the seed and enter development-only passwords
when prompted. Input is hidden and the passwords are not written to a file:

```bash
cd backend
npm run db:seed
```

For non-interactive environments such as CI, provide `SEED_ADMIN_PASSWORD` and
`SEED_STAFF_PASSWORD` through the environment or secret manager running the
command. Do not commit either value.

The command safely creates or updates these accounts and can be run repeatedly:

- `admin@merhaba.test` (`ADMIN`)
- `staff@merhaba.test` (`STAFF`)

Passwords are hashed before they are stored. No menu, table, or order demo data
is added by this seed.

Generate Prisma Client after future schema changes:

```bash
cd backend
npm run prisma:generate
```

## Development

Run the frontend at `http://localhost:3000`:

```bash
cd frontend
npm run dev
```

In a second terminal, run the backend at `http://localhost:4000`:

```bash
cd backend
npm run dev
```

The API health check is available at `GET http://localhost:4000/api/health`.

Authentication endpoints:

- `POST /api/V1/auth/register`
- `POST /api/V1/auth/login`
- `GET /api/auth/me` — requires `Authorization: Bearer <access-token>`

## Quality checks

```bash
cd frontend
npm run lint
npm run type-check
npm run build

cd ../backend
npm run type-check
npm run build
```

## Project layout

- `frontend/` — Next.js App Router application
- `backend/` — Express API and Prisma configuration

Frontend authentication and menu, table, and order APIs are not implemented yet.
