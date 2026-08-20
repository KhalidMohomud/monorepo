# Technical Decisions

This file records the main Day 1 decisions for Merhaba Order Desk. It is kept
short so the architecture remains easy to discuss and change during the MVP.

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
