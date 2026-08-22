# Merhaba Order Desk

Merhaba Order Desk is a full-stack restaurant operations MVP for managing menu
categories, menu items, dining tables, users, and customer orders from one
role-aware interface.

The project was built as a five-day Full-Stack Developer technical assessment.
Its focus is a coherent working core, clear authorization boundaries, reliable
database behavior, and code that is straightforward to explain and maintain.

## Live Deployment

| Service | URL |
| --- | --- |
| Frontend | [Merhaba Order Desk](https://monorepo-production-02c5.up.railway.app) |
| Backend health check | [GET /api/health](https://monorepo-production-4764.up.railway.app/api/health) |

The frontend and backend run as separate Railway services from the same
repository. The deployed frontend communicates with the API over HTTPS, and
the API CORS policy permits the deployed frontend origin explicitly.

## Current Status

The core assessment workflows are implemented across the API and frontend,
with remaining trade-offs recorded in [Known Limitations](#known-limitations):

- secure email/password authentication with `ADMIN`, `WAITER`, and `CASHIER`
  roles;
- category and menu-item management;
- restaurant table management and status changes;
- order creation, line-item changes, totals, status transitions, and history;
- an operational dashboard with table, order, and revenue summaries;
- administrator-managed user accounts;
- idempotent demo data seeding; and
- responsive, role-aware frontend screens with loading, error, confirmation,
  success, session-expiration, and automatic logout feedback.

The optional reporting page, real-time updates, payment processing, inventory,
and advanced reservation workflows are not part of the implemented MVP.

## Tech Stack

### Frontend

- Next.js 16 using the App Router
- React 19
- TypeScript
- Tailwind CSS 4
- ESLint with the Next.js configuration
- Browser `sessionStorage` for the short-lived access-token session

### Backend

- Node.js and Express 5
- TypeScript
- PostgreSQL
- Prisma 7 with the PostgreSQL driver adapter
- Zod for request and environment validation
- JSON Web Tokens for access-token authentication
- bcryptjs for password hashing
- Helmet for HTTP security headers
- CORS with an explicitly configured frontend origin
- Multer and Cloudinary for optional menu-item image uploads

### Testing

- Node.js test runner
- PGlite's PostgreSQL-compatible socket server for isolated backend integration
  tests

## Architecture

The frontend and backend are independent applications. Each has its own
dependencies, scripts, environment configuration, and build output.

```text
Next.js frontend
       |
       | REST JSON + Bearer JWT
       v
Express API
       |
       | Prisma
       v
PostgreSQL
```

Backend requests follow a small, consistent flow:

```text
route -> authentication/authorization -> controller -> service -> Prisma
```

- Routes define endpoints and role requirements.
- Controllers parse Zod schemas and format HTTP responses.
- Services contain domain and database logic.
- Prisma provides typed persistence and transactions.
- Central middleware converts known failures into consistent API errors.

Important architectural choices are documented in
[DECISIONS.md](./DECISIONS.md).

## Repository Structure

```text
merhaba-order-desk/
|-- backend/
|   |-- prisma/
|   |   |-- migrations/
|   |   |-- schema.prisma
|   |   `-- seed.ts
|   |-- src/
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- middleware/
|   |   |-- routes/
|   |   |-- services/
|   |   |-- types/
|   |   |-- utils/
|   |   |-- validators/
|   |   |-- app.ts
|   |   `-- server.ts
|   |-- tests/
|   |-- .env.example
|   `-- package.json
|-- frontend/
|   |-- src/
|   |   |-- app/
|   |   |-- components/
|   |   `-- lib/
|   |-- .env.example
|   `-- package.json
|-- .gitignore
|-- DECISIONS.md
`-- README.md
```

Generated clients, dependencies, build output, and local environment files are
excluded from version control.

## Prerequisites

- Node.js 20.19 or newer
- npm
- PostgreSQL
- A Cloudinary account only if menu-image upload will be used

## Installation

This repository intentionally does not use a root npm workspace. Install each
application independently:

```bash
cd frontend
npm install

cd ../backend
npm install
```

## Environment Configuration

### Backend

Create the local backend environment file:

```bash
cp backend/.env.example backend/.env
```

Configure these variables in `backend/.env`:

| Variable | Required | Example/default | Purpose |
| --- | --- | --- | --- |
| `NODE_ENV` | No | `development` | Runtime mode: `development`, `test`, or `production`. |
| `PORT` | No | `4000` | Express server port. |
| `FRONTEND_URL` | No | `http://localhost:3000` | The single browser origin allowed by CORS. |
| `DATABASE_URL` | Yes | PostgreSQL URL | Prisma database connection. |
| `JWT_SECRET` | Yes | No default | JWT signing secret with at least 32 characters. |
| `JWT_EXPIRES_IN_SECONDS` | No | `900` | Access-token lifetime between 60 and 86,400 seconds. |
| `CLOUDINARY_NAME` | No | None | Cloudinary cloud name for menu-image upload. |
| `CLOUDINARY_API_KEY` | No | None | Cloudinary API key for menu-image upload. |
| `CLOUDINARY_API_SECRET` | No | None | Cloudinary API secret for menu-image upload. |

Cloudinary is optional. The core API starts normally when its credentials are
absent. Image-upload requests return `503 IMAGE_UPLOAD_NOT_CONFIGURED` unless
all three Cloudinary values are configured. Keep those values exclusively in
the untracked `backend/.env` file or a deployment secret manager.

Generate a strong JWT secret locally, for example:

```bash
openssl rand -base64 48
```

Never commit the generated value, database credentials, Cloudinary credentials,
or demo passwords.

### Frontend

Create the optional frontend environment file:

```bash
cp frontend/.env.example frontend/.env.local
```

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | No | `http://localhost:4000/api` | Public base URL of the Express API. |

Variables prefixed with `NEXT_PUBLIC_` are included in the browser bundle and
must never contain secrets.

## Database Setup

Create the PostgreSQL database referenced by `DATABASE_URL`, then run all Prisma
commands from the backend directory:

```bash
cd backend

npm run prisma:generate
npm run prisma:validate
npm run prisma:migrate:dev
```

For a deployed environment, apply the committed migrations without creating a
new migration:

```bash
cd backend
npm run prisma:migrate:deploy
```

The schema contains these main entities:

- `User`
- `Category`
- `MenuItem`
- `RestaurantTable`
- `Order`
- `OrderItem`

Order items store `itemName` and `unitPrice` snapshots. Historical orders
therefore remain accurate when a menu item's name or price changes later.
Money is stored with PostgreSQL decimal columns, and the API returns monetary
values as decimal strings.

## Seed Data and Demo Accounts

Run the idempotent seed script after applying migrations:

```bash
cd backend
npm run db:seed
```

In an interactive terminal, the script securely prompts for and confirms both
demo passwords without displaying them. The plaintext passwords are never
stored in source code or written to the database.

For non-interactive CI or demo automation, provide
`SEED_ADMIN_PASSWORD`, `SEED_WAITER_PASSWORD`, and `SEED_CASHIER_PASSWORD`
through the process environment or a secret manager. Do not add them to a
committed file or expose them in logs.

The seed can be run repeatedly without creating duplicate records. It creates
or updates:

- one Admin account;
- one Waiter account;
- one Cashier account;
- four menu categories;
- seven menu items; and
- six restaurant tables.

| Account | Email | Role | Password |
| --- | --- | --- | --- |
| Admin | `admin@merhaba.test` | `ADMIN` | The Admin password selected during seeding |
| Waiter | `waiter@merhaba.test` | `WAITER` | The Waiter password selected during seeding |
| Cashier | `cashier@merhaba.test` | `CASHIER` | The Cashier password selected during seeding |

## Running Locally

Start the backend in one terminal:

```bash
cd backend
npm run dev
```

The API listens at `http://localhost:4000` by default. Verify it with:

```bash
curl http://localhost:4000/api/health
```

Expected response:

```json
{"status":"ok"}
```

Start the frontend in a second terminal:

```bash
cd frontend
npm run dev
```

Open `http://localhost:3000` and sign in using one of the accounts created by
the seed script.

For production-style local execution:

```bash
cd backend
npm run build
npm start
```

```bash
cd frontend
npm run build
npm start
```

## Production Deployment

The production application is deployed on Railway as two services backed by a
PostgreSQL database. Keeping the services separate preserves the same
frontend/backend boundary used in local development.

### Frontend service

| Setting | Value |
| --- | --- |
| Root directory | `/frontend` |
| Build command | `npm run build` |
| Start command | `npm start` |
| Public URL | `https://monorepo-production-02c5.up.railway.app` |

Required frontend variable:

```env
NEXT_PUBLIC_API_URL=https://monorepo-production-4764.up.railway.app/api
```

`NEXT_PUBLIC_API_URL` is compiled into the browser bundle. Redeploy the
frontend after changing it.

### Backend service

| Setting | Value |
| --- | --- |
| Root directory | `/backend` |
| Build command | `npm run build` |
| Pre-deploy command | `npm run prisma:migrate:deploy` |
| Start command | `npm start` |
| Health-check path | `/api/health` |
| Public URL | `https://monorepo-production-4764.up.railway.app` |

Required production variables:

```env
NODE_ENV=production
FRONTEND_URL=https://monorepo-production-02c5.up.railway.app
DATABASE_URL=<managed-postgresql-connection-url>
JWT_SECRET=<secret-with-at-least-32-characters>
JWT_EXPIRES_IN_SECONDS=900
```

Railway supplies `PORT` at runtime. Cloudinary variables are required only when
menu-image upload is enabled. Store database credentials, JWT secrets, seed
passwords, and Cloudinary credentials in Railway Variables; never commit them.

The frontend origin must match `FRONTEND_URL` exactly, without a trailing slash,
because the backend intentionally does not use wildcard CORS in production.

## Authentication and Authorization

Authentication uses short-lived signed JWT access tokens. Protected requests
send the token using:

```http
Authorization: Bearer <access-token>
```

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/V1/auth/register` | Public | Register a `WAITER` account. |
| `POST` | `/api/V1/auth/login` | Public | Authenticate and receive a JWT. |
| `GET` | `/api/auth/me` | Authenticated | Load the current safe user profile. |

Public registration always assigns `WAITER`; the request cannot choose a role.
Only an authenticated Admin can create Admin, Waiter, or Cashier accounts
through the user-management API.

The role migration converts existing `STAFF` database records to `WAITER`
without changing their IDs, passwords, or order history. Access tokens issued
with the removed `STAFF` claim are rejected after deployment, so those users
must sign in again.

After login:

- Admin users are sent to the dashboard.
- Waiter users are sent to the create-order screen.
- Cashier users are sent to the orders screen, where they can complete payment
  or cancellation actions permitted by the API.

Passwords are hashed with bcryptjs and are never returned by an API response.
Invalid login attempts use the same generic response for unknown emails and
incorrect passwords.

### Role Permissions

| Capability | Admin | Waiter | Cashier |
| --- | :---: | :---: | :---: |
| Dashboard overview | Yes | No | NO |
| Manage categories | Yes | No | No |
| Create, update, and delete menu items | Yes | No | No |
| View available menu items | Yes | Yes | Yes |
| View restaurant tables | Yes | NO | NO |
| Manage restaurant tables and statuses | Yes | Yes | No |
| View active orders | Yes | Yes | Yes |
| View completed order history | Yes | No | No |
| Create orders and edit order items | Yes | Yes | No |
| Move orders to `PREPARING`, `READY`, or `SERVED` | Yes | Yes | No |
| Mark orders `PAID` or `CANCELLED` | Yes | No | Yes |
| Manage user accounts and roles | Yes | No | No |

The backend is the final authorization boundary. Hiding a frontend control is a
usability decision and is never treated as sufficient security.

## API Overview

All endpoints except health, register, and login require a valid bearer token.

### Categories

Admin only:

```text
GET    /api/V1/categories
GET    /api/V1/categories/:id
POST   /api/V1/categories
PATCH  /api/V1/categories/:id
DELETE /api/V1/categories/:id
```

### Menu Items

All authenticated roles can read menu items. Waiter and Cashier responses
contain only available items. Mutations and image upload are Admin only.

```text
GET    /api/V1/menu-items
GET    /api/V1/menu-items/:id
POST   /api/V1/menu-items
POST   /api/V1/menu-items/images
PATCH  /api/V1/menu-items/:id
DELETE /api/V1/menu-items/:id
```

Image upload accepts one JPEG, PNG, or WebP file up to 5 MB. When Cloudinary is
not configured, only this optional endpoint is unavailable; all other menu and
restaurant operations continue to work.

### Restaurant Tables

Admin, Waiter, and Cashier can read tables. Only Admin and Waiter can create,
update, change the status of, or delete tables:

```text
GET    /api/V1/tables
GET    /api/V1/tables/:id
POST   /api/V1/tables
PATCH  /api/V1/tables/:id
PATCH  /api/V1/tables/:id/status
DELETE /api/V1/tables/:id
```

Supported table statuses are `AVAILABLE`, `OCCUPIED`, `RESERVED`, and
`CLEANING`.

### Orders

Admin, Waiter, and Cashier can list and view active orders. Completed order
history is restricted to Admin. Only Admin and Waiter can create orders or
change order items:

```text
GET    /api/V1/orders
GET    /api/V1/orders/:id
POST   /api/V1/orders
POST   /api/V1/orders/:id/items
PATCH  /api/V1/orders/:id/items/:itemId
DELETE /api/V1/orders/:id/items/:itemId
PATCH  /api/V1/orders/:id/status
```

Order listing supports optional `status`, `active`, and UTC `date` query
filters. Waiter and Cashier requests are constrained to active orders by the
API; explicit history or terminal-status queries return `403`. The frontend
shows completed history only to Admin and provides local order search.

The normal status flow is:

```text
PENDING -> PREPARING -> READY -> SERVED -> PAID
    |           |          |
    +-----------+----------+-> CANCELLED
```

Admin can perform every valid transition. Waiter can apply the operational
`PREPARING`, `READY`, and `SERVED` transitions but receives `403` for `PAID` or
`CANCELLED`. Cashier can apply only `PAID` and `CANCELLED`; Cashier cannot create
orders, edit order items, or apply operational preparation/service statuses.

The server owns prices and totals. It reads current menu data when adding an
item, stores the historical snapshots, calculates each line total, and
recalculates the order inside database transactions. Creating an order marks
its table `OCCUPIED`; paying or cancelling releases the table to `AVAILABLE`.

### Dashboard

Admin, Waiter, and Cashier:

```text
GET /api/V1/dashboard/overview
```

The response includes occupied and total table counts, active orders by status,
today's order count, today's paid revenue, and five recent orders.

### Users

Admin only:

```text
GET    /api/V1/users
GET    /api/V1/users/:id
POST   /api/V1/users
PATCH  /api/V1/users/:id
DELETE /api/V1/users/:id
```

User responses select public fields only. Administrators cannot delete
themselves or remove their own Admin role, and users linked to order history
cannot be deleted.

## Frontend Screens

| Route | Screen | Access |
| --- | --- | --- |
| `/login` | Sign in | Public |
| `/` | Redirect to sign in | Public |
| `/dashboard` | Restaurant dashboard | Admin |
| `/orders` | Active orders and role-appropriate actions; history for Admin | Admin, Waiter, and Cashier |
| `/orders/new` | Create an order | Admin and Waiter |
| `/tables` | Table management or read-only floor view | Admin and Waiter manage; Cashier reads |
| `/menu-items` | Menu management or available-item browsing | Admin manages; Waiter and Cashier read |
| `/categories` | Category management | Admin |
| `/users` | User management | Admin |

## Validation, Errors, and Security

- Zod validates environment variables, request bodies, parameters, and query
  strings.
- Malformed JSON and oversized request bodies receive explicit client errors.
- The JSON body limit is 100 KB.
- Menu image uploads are limited by type, file count, and size.
- Prisma errors are translated into domain-safe responses where appropriate.
- Unexpected errors return a generic `500` response without stack traces or
  database details.
- Helmet configures HTTP security headers.
- Production CORS is controlled by `FRONTEND_URL` and is not a wildcard.
- JWT verification restricts issuer, audience, signing algorithm, expiration,
  payload shape, and role.
- The application never logs passwords, password hashes, JWT secrets, or
  Cloudinary secrets.
- `.env` files are ignored while `.env.example` files remain committed.

API errors use a consistent shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "email",
        "message": "A valid email address is required"
      }
    ]
  }
}
```

## Quality Checks

Run the complete backend verification:

```bash
cd backend
npm run type-check
npm run prisma:validate
npm run prisma:generate
npm test
npm run build
```

The integration suite starts an isolated PostgreSQL-compatible PGlite instance
and covers authentication, authorization, menu and table management, orders,
dashboard data, user management, validation, and important database invariants.

Run the complete frontend verification:

```bash
cd frontend
npm run lint
npm run type-check
npm run build
```

## Development Progress

- Day 1 - foundation, Prisma schema, authentication, RBAC, security, migrations,
  account seeding, and initial documentation: complete.
- Day 2 - category, menu-item, and table APIs and frontend workflows plus domain
  seed data: complete.
- Day 3 - transactional order creation, item management, totals, status flow,
  table linking, active/history views, and order detail UI: complete.
- Day 4 - dashboard overview, loading and error states, Admin user management,
  responsive navigation, and UI polish: complete.
- Day 5 - final verification, Railway deployment, documentation, and submission
  preparation: complete.

## Known Limitations

- There is no public registration screen. Public registration is available
  through the API, while normal UI account provisioning is handled by an Admin.
- Access tokens are kept in browser session storage and there is no refresh-token
  flow. This is an accepted MVP trade-off.
- Changing a role or deleting an account does not revoke an already-issued
  stateless token; access ends when its short lifetime expires.
- Date-based order filters and dashboard daily totals use UTC calendar days.
- Optional image upload depends on Cloudinary and requires external credentials.
- Real-time order updates through WebSockets or Server-Sent Events are not
  implemented; users receive current data when a screen loads or refreshes.
- A standalone reporting page is not implemented. The required dashboard does
  provide the basic daily summary through today's order count and paid revenue.
- Soft deletion and a complete audit log are not implemented. Core records use
  creation/update timestamps, and orders record their creating user, but deleted
  records are not retained as archived rows.
- Reservation behavior is represented only by table status; scheduling and guest
  details are outside scope.
- The current total equals the subtotal. Taxes, discounts, service charges, and
  payment gateway integration are outside scope.

## Reviewer Verification

For a clean local review:

1. Verify that all required environment variables are documented and no local
   `.env` file is tracked.
2. Apply the committed migrations to a clean PostgreSQL database.
3. Run the seed and record the selected demo passwords securely for the reviewer.
4. Run all backend and frontend quality checks.
5. Confirm the local setup instructions on a clean checkout.
6. Open the deployed frontend or run both applications locally, then verify the
   Admin, Waiter, and Cashier workflows and their authorization boundaries.

## License

This repository was created for the Merhaba ICT Solution technical assessment.
No separate open-source license is currently provided.
