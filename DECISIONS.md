# Technical Decisions

This file records the main Day 1 through Day 3 decisions for Merhaba Order Desk.
It is kept short so the architecture remains easy to discuss and change during
the MVP.

## Separate frontend and backend applications

The Next.js frontend and Express backend use independent packages. This keeps
browser concerns separate from API, database, and security concerns and allows
each application to be built or deployed independently. A root workspace was
not added because the current project does not need shared packages or complex
monorepo tooling.

## Express with TypeScript

Express provides a small, explicit HTTP layer, while TypeScript gives the route,
middleware, service, environment, and authenticated-request contracts compile-time
checks. Business and database logic stays out of route declarations.

## PostgreSQL and Prisma

Restaurant orders are relational and require reliable constraints and
transactions. PostgreSQL provides those guarantees. Prisma supplies a typed
schema and client while keeping migrations visible and reviewable. Database
constraints are still used for important invariants such as positive quantities
and non-negative monetary values.

## JWT access tokens

The API uses short-lived, stateless JWT access tokens because the frontend and
backend are separate applications. Tokens have a fixed algorithm, issuer,
audience, subject, role, and expiration. The signing secret comes from validated
environment configuration. Refresh tokens are outside the current MVP scope.

## Role assignment

Public registration always creates a `STAFF` user. It never accepts a requested
role, preventing public privilege escalation. Administrator accounts are created
through the controlled reviewer/demo seed until user management is implemented.

## Historical order item snapshots

`OrderItem` stores `itemName` and `unitPrice` snapshots in addition to its
`MenuItem` relationship. A later menu rename or price change therefore cannot
alter the historical meaning or totals of an existing order.

## Day 2 authorization boundaries

Category and menu-item writes are administrator operations. Staff can read only
available menu items, and that restriction is enforced in the service layer so
it cannot be bypassed by changing the UI. Both roles can manage table state for
day-to-day restaurant operations.

## Money at the API boundary

Prisma and PostgreSQL keep menu prices as fixed-precision decimals. The API
serializes those values as strings, avoiding implicit JavaScript floating-point
conversion while keeping request and response contracts straightforward.

## Server-owned order totals

Order requests contain menu-item IDs and quantities, never prices or totals.
The service reads the current menu price, stores name and price snapshots, and
calculates line totals, subtotal, and total with Prisma decimals. Item and total
changes occur in one transaction so partial updates cannot leave inconsistent
money values.

## Order lifecycle and table assignment

Status transitions follow one forward path from `PENDING` to `PAID`, with
cancellation allowed before an order is served. Completed orders cannot be
edited. PostgreSQL enforces one active order per table with a partial unique
index, and the service marks the table occupied or available in the same
transaction as order lifecycle changes.

## Dashboard as a read model

The dashboard has one protected overview endpoint instead of several metric
routes. Its service reads counts, grouped statuses, paid revenue, and recent
orders in one database transaction, giving the client a consistent operational
snapshot without moving display concerns into controllers. Calendar-based
metrics use UTC until a restaurant business-timezone setting is introduced.
