# Merhaba Order Desk

## Project Overview

Merhaba Order Desk is a Restaurant Operations MVP intended to help restaurant
staff manage menus, tables, and customer orders. The repository currently
contains the Day 1 security and database foundation, the Day 2 category,
menu-item, and table workflows, the Day 3 order-management backend, and the
Day 4 dashboard overview and administrator user-management backends.

## Current Status

Day 1 and Day 2 are complete. The Day 3 backend is complete. Authentication, role-based authorization, request
validation, centralized error handling, Prisma configuration, the initial
PostgreSQL migration, and integration tests are in place. Administrators can
manage categories and menu items. Administrators and staff can manage restaurant
tables, while staff receive only available menu items.

The frontend includes login and role-aware screens for the Day 2 workflows. The
backend supports order creation, line-item changes, totals, status transitions,
history filters, active-order table assignment, dashboard overview metrics, and
administrator-managed user accounts. The order, dashboard, and user-management
interfaces, payments, and reporting are not implemented yet.

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
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── lib/
│   ├── .env.example
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

The frontend defaults to `http://localhost:4000/api`. To override it, create
`frontend/.env.local` from `frontend/.env.example` and set
`NEXT_PUBLIC_API_URL` to the public API base URL. Variables prefixed with
`NEXT_PUBLIC_` are included in the browser bundle and must never contain secrets.

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

Seed the reviewer/demo accounts and small Day 2 dataset interactively:

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

- `ADMIN` — manages categories and menu items and can access operational order
  and table routes. Administrators can also create and manage staff or other
  administrator accounts through the protected user API.
- `STAFF` — intended for daily restaurant operations. Public registration is
  deliberately restricted to this role and cannot create an administrator.

## Demo Credentials

After `npm run db:seed`, these accounts exist:

| Email | Role | Password |
| --- | --- | --- |
| `admin@merhaba.test` | `ADMIN` | Chosen securely during seeding |
| `staff@merhaba.test` | `STAFF` | Chosen securely during seeding |

No plaintext demo password is stored in the repository. The seed is idempotent,
and rerunning it updates the account names, roles, password hashes, categories,
menu items, and table definitions without creating duplicates.

## Day 2 API

All routes below require a bearer token.

| Resource | Routes | Access |
| --- | --- | --- |
| Categories | `GET/POST /api/V1/categories`, `GET/PATCH/DELETE /api/V1/categories/:id` | `ADMIN` |
| Menu items | `GET /api/V1/menu-items`, `GET /api/V1/menu-items/:id` | `ADMIN`, `STAFF` |
| Menu items | `POST /api/V1/menu-items`, `PATCH/DELETE /api/V1/menu-items/:id` | `ADMIN` |
| Tables | `GET/POST /api/V1/tables`, `GET/PATCH/DELETE /api/V1/tables/:id` | `ADMIN`, `STAFF` |
| Table status | `PATCH /api/V1/tables/:id/status` | `ADMIN`, `STAFF` |

For staff callers, menu-item reads are restricted on the server to available
items. Monetary values are returned as decimal strings so the JSON boundary
does not introduce floating-point rounding.

## Day 3 Order API

Order routes require an `ADMIN` or `STAFF` bearer token.

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/V1/orders` | Create an order for a table with initial items. |
| `GET` | `/api/V1/orders` | List orders; supports `status`, `active`, and UTC `date` filters. |
| `GET` | `/api/V1/orders/:id` | Get an order with table, creator, and item snapshots. |
| `POST` | `/api/V1/orders/:id/items` | Add an available menu item. |
| `PATCH` | `/api/V1/orders/:id/items/:itemId` | Change an item quantity. |
| `DELETE` | `/api/V1/orders/:id/items/:itemId` | Remove an item while keeping at least one line. |
| `PATCH` | `/api/V1/orders/:id/status` | Apply a valid order status transition. |

The server reads names and prices from menu items, stores snapshots, calculates
line totals and order totals, and performs related writes in transactions.
Clients cannot supply monetary totals. A table can have only one active order.
Creating an order marks its table `OCCUPIED`; paying or cancelling it releases
the table to `AVAILABLE`.

Status progression is:

```text
PENDING -> PREPARING -> READY -> SERVED -> PAID
    \          \          \
     +----------+----------+-> CANCELLED
```

## Dashboard API

The overview route requires an `ADMIN` or `STAFF` bearer token:

```http
GET /api/V1/dashboard/overview
```

It returns:

- occupied and total table counts;
- total active orders;
- active-order counts for `PENDING`, `PREPARING`, `READY`, and `SERVED`;
- today's order count;
- today's revenue from orders paid during the current UTC day; and
- the five most recent orders with table number, status, item count, and total.

The response contains operational data only and never includes user credentials
or password hashes. Quick-navigation links belong to the future frontend and do
not require a backend endpoint.

## Admin User API

All user-management routes require an `ADMIN` bearer token. Public registration
remains restricted to creating `STAFF` accounts.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/V1/users` | List safe user profiles; accepts an optional `role` filter. |
| `GET` | `/api/V1/users/:id` | Get one safe user profile. |
| `POST` | `/api/V1/users` | Create a user; the role defaults to `STAFF`. |
| `PATCH` | `/api/V1/users/:id` | Update name, email, password, or role. |
| `DELETE` | `/api/V1/users/:id` | Delete a user without order history. |

Passwords are hashed with the same production utility used by registration.
Responses select only public fields and never include `passwordHash`.
Administrators cannot delete themselves or remove their own administrator role,
and users linked to historical orders cannot be deleted.

## Quality Checks

Backend:

```bash
cd backend
npm run type-check
npm run prisma:validate
npm test
npm run build
```

Frontend:

```bash
cd frontend
npm run lint
npm run type-check
npm run build
```

## Development Progress

- Day 1: project foundation, relational schema, authentication, RBAC, validation,
  error handling, migrations, and secure account seeding — complete.
- Day 2: category management, menu-item management, table management, role-aware
  frontend screens, domain seed data, and integration tests — complete.
- Day 3 backend: order creation, line-item management, totals, status
  transitions, table assignment, database invariants, filters, and integration
  tests — complete. The Day 3 frontend is intentionally pending.
- Day 4 backend: protected dashboard overview metrics and recent-order data —
  complete. The dashboard frontend is intentionally pending.
- Backend administration: Admin-only user listing, creation, updates, role
  assignment, password replacement, and safe deletion — complete. The
  user-management frontend is intentionally pending.

## Known Limitations

- Authentication uses short-lived access tokens without refresh tokens.
- Role changes and account deletion do not revoke an already-issued stateless
  token; access ends when that short-lived token expires.
- The frontend keeps the access token in session storage; it is cleared when the
  browser session ends and is not shared between tabs.
- Public registration creates `STAFF` accounts only; only an authenticated
  administrator can assign the `ADMIN` role.
- Order management, dashboard overview, and user management have no frontend
  screens yet.
- Order totals currently have no tax, discount, service-charge, or payment
  processing logic; `total` equals `subtotal` for this MVP.
- Date filtering uses UTC calendar days.
- Reservation workflows beyond the table status are outside the assessment
  scope.

## Upcoming Work

The next step is to build the user-management, order, and dashboard frontend
screens using the existing APIs, followed by responsive and error-state polish.
Payments, inventory, real-time updates, and advanced reservation workflows
remain outside the MVP unless the assessment scope changes.
