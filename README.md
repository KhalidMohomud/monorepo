# Merhaba Order Desk

## Project Overview

Merhaba Order Desk is a Restaurant Operations MVP intended to help restaurant
staff manage menus, tables, and customer orders. The repository currently
contains the Day 1 technical foundation: a minimal web client, a secured API,
the relational database schema, and reviewer/demo account seeding.

## Current Status

Day 1 is complete. The backend exposes a health check, registration, login, and
current-user endpoints. Password hashing, JWT authentication, role-based access
control, request validation, centralized error handling, Prisma configuration,
the initial PostgreSQL migration, and integration tests are in place.

The frontend is intentionally a minimal Next.js foundation. Menu, table, order,
and dashboard interfaces and APIs have not been implemented.

## Tech Stack

### Frontend

- Next.js 16 with the App Router
- React 19
- TypeScript
- Tailwind CSS 4
- ESLint

### Backend

- Express 5 and TypeScript
- PostgreSQL
- Prisma 7 with the PostgreSQL driver adapter
- Zod for environment and request validation
- JSON Web Tokens for stateless access tokens
- bcryptjs for password hashing
- Helmet for HTTP security headers
- CORS configured from `FRONTEND_URL`

## Architecture

The frontend and backend are separate applications with independent dependency
trees and commands. There is no root npm workspace.

```text
Next.js frontend
        │
        │ REST JSON
        ▼
Express API
        │
        │ Prisma
        ▼
PostgreSQL
```

The backend follows a small route → controller → service → Prisma flow.
Authentication and authorization are implemented as reusable Express
middleware. See [DECISIONS.md](./DECISIONS.md) for the main technical choices.

## Repository Structure

```text
merhaba-order-desk/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── validators/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── tests/
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/app/
│   └── package.json
├── .gitignore
├── DECISIONS.md
└── README.md
```

Generated files, build output, dependencies, and local environment files are
excluded from version control.

## Prerequisites

- Node.js 20.19 or newer
- npm
- A PostgreSQL database

## Installation

Dependencies are installed separately because the repository does not use a
root workspace:

```bash
cd frontend
npm install

cd ../backend
npm install
```

## Environment Variables

Create the backend environment file from the committed template:

```bash
cp backend/.env.example backend/.env
```

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `NODE_ENV` | No | `development` | Runtime mode: `development`, `test`, or `production`. |
| `PORT` | No | `4000` | Express HTTP port. |
| `FRONTEND_URL` | No | `http://localhost:3000` | Browser origin allowed by CORS. Use the deployed frontend URL in production. |
| `DATABASE_URL` | Yes | None | PostgreSQL connection URL used by Prisma. |
| `JWT_SECRET` | Yes | None | Access-token signing secret; must be at least 32 characters. |
| `JWT_EXPIRES_IN_SECONDS` | No | `900` | Access-token lifetime, constrained to 60–86,400 seconds. |

Never commit `backend/.env` or real credentials. The application exits during
startup if required configuration is missing or invalid.

## Database Setup

Run Prisma commands from the backend package:

```bash
cd backend

# Generate the Prisma Client
npm run prisma:generate

# Validate the schema
npm run prisma:validate

# Apply/create migrations during local development
npm run prisma:migrate:dev
```

For a deployed environment with committed migrations, use:

```bash
cd backend
npm run prisma:migrate:deploy
```

Seed the two reviewer/demo accounts interactively:

```bash
cd backend
npm run db:seed
```

The terminal masks and confirms each password. For non-interactive automation,
inject `SEED_ADMIN_PASSWORD` and `SEED_STAFF_PASSWORD` through the process
environment or a secret manager. Do not commit either value.

## Running the Backend

Development server at `http://localhost:4000`:

```bash
cd backend
npm run dev
```

Production-style local build and start:

```bash
cd backend
npm run build
npm start
```

Health check: `GET http://localhost:4000/api/health`

## Running the Frontend

Development server at `http://localhost:3000`:

```bash
cd frontend
npm run dev
```

Production-style local build and start:

```bash
cd frontend
npm run build
npm start
```

## Authentication

The currently implemented routes are:

| Method | Route | Authentication | Description |
| --- | --- | --- | --- |
| `POST` | `/api/V1/auth/register` | Public | Creates a `STAFF` account after Zod validation. |
| `POST` | `/api/V1/auth/login` | Public | Returns a JWT access token and safe user details. |
| `GET` | `/api/auth/me` | Bearer token | Returns the authenticated user's ID, name, email, and role. |

Protected requests use this header:

```http
Authorization: Bearer <access-token>
```

Two roles exist:

- `ADMIN` — intended for administrative operations such as user and menu
  management when those features are implemented.
- `STAFF` — intended for daily restaurant operations. Public registration is
  deliberately restricted to this role and cannot create an administrator.

## Demo Credentials

After `npm run db:seed`, these accounts exist:

| Email | Role | Password |
| --- | --- | --- |
| `admin@merhaba.test` | `ADMIN` | Chosen securely during seeding |
| `staff@merhaba.test` | `STAFF` | Chosen securely during seeding |

No plaintext demo password is stored in the repository. The seed is idempotent,
and rerunning it updates the account names, roles, and password hashes.

## Quality Checks

Backend:

```bash
cd backend
npm run type-check
npm run prisma:validate
npm run test:auth
npm run build
```

Frontend:

```bash
cd frontend
npm run lint
npm run type-check
npm run build
```

The backend authentication suite uses an isolated in-memory PostgreSQL-compatible
database and does not require the configured development database.

## Development Progress

Completed during Day 1:

- [x] Separate Next.js and Express project foundations
- [x] PostgreSQL and Prisma schema for the complete MVP domain
- [x] Initial database migration and reusable Prisma Client
- [x] Environment validation
- [x] Password hashing and JWT utilities
- [x] Registration and login API
- [x] Protected current-user endpoint
- [x] Reusable `ADMIN`/`STAFF` authorization middleware
- [x] Idempotent reviewer/demo user seed
- [x] Security-focused error handling and authentication integration tests

## Known Limitations

- The frontend has no authentication UI or operational screens yet.
- Menu, table, and order business APIs are not implemented.
- Dashboard functionality is not implemented.
- Registration/login use the `/api/V1/auth` prefix while `/me` currently uses
  `/api/auth`; route versioning should be standardized before client expansion.
- Access tokens are short-lived but there is no refresh-token or revocation
  system in this MVP.
- Login rate limiting is not implemented and should be added before exposing the
  API publicly.
- Previously exposed credentials must be rotated and repository history reviewed
  before a production deployment; current tracked examples contain no secrets.

## Upcoming Work

- Menu Management
- Table Management
- Order Management
- Dashboard and operational frontend workflows

These items are planned only and are not part of the current implementation.
