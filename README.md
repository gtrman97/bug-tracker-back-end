# Bug Tracker — Backend API

A REST API for a full-stack bug/issue tracker, built with Express and Sequelize on PostgreSQL. This is the backend half of the project; it serves a companion [React/Vite frontend](https://github.com/gtrman97/Bug-Tracker).

## Overview

The API handles authentication, project and ticket management, and per-project role-based authorization. It's built as a portfolio project with a deliberate focus on getting core backend fundamentals — authentication vs. authorization, data modeling, and access-control edge cases like IDOR — right and explainable, rather than maximizing feature surface area.

## Tech Stack

- **Node.js / Express** — HTTP server and routing
- **PostgreSQL** — relational database
- **Sequelize** — ORM and model associations
- **jsonwebtoken** — JWT issuance and verification
- **bcrypt** — password hashing
- **Zod** — request body validation on every mutating route
- **dotenv** — environment variable loading
- **nodemon** — dev-time autoreload

## Features

- Email/password registration and login issuing a JWT (`Authorization: Bearer` header, no cookies — the frontend and backend run on separate origins)
- Timing-safe login: a nonexistent email and a wrong password return the identical response in about the same time, so the endpoint can't be used to enumerate registered accounts
- Per-project roles (Admin / Manager / Developer / Submitter) stored on a `ProjectMembership` join table, not as a flat field on `User` — the same person can be an Admin on one project and a Submitter on another
- Project creation automatically grants the creator an Admin membership, so a project can never end up with no one able to manage it
- IDOR-protected ticket routes: updating or deleting a ticket derives its `projectId` from the database record itself, never from client-supplied input, before checking permissions
- CORS locked to a single configured frontend origin, not open to any site

## Project Structure

```
├── index.js                        # App entry point: middleware, routes, DB connect/sync
├── models/
│   ├── index.js                    # Sequelize instance / DB connection config
│   ├── User.js                     # name, email, bcrypt-hashed password
│   ├── Project.js                  # name, description, ownerId
│   ├── ProjectMembership.js        # userId, projectId, role — source of truth for permissions
│   ├── Ticket.js                   # title, description, status, projectId, assigneeId
│   └── associations.js             # All model relationships wired centrally, in one place
├── middleware/
│   ├── verifyToken.js              # Authentication only: "who is this user?"
│   └── requireRole.js              # Authorization only: "what can this user do on this project?"
├── routes/
│   ├── authRoutes.js                # /auth/register, /auth/login, /auth/me
│   ├── projectRoutes.js             # create/list projects, assign project roles
│   ├── ticketRoutes.js              # create/list/update/delete tickets
│   └── userRoutes.js                # list users (for assignee/member pickers)
├── utils/
│   └── token.js                    # JWT signing helper
└── seed.js                         # Populates the DB with sample users/projects/tickets
```

## Getting Started

### Prerequisites

- Node.js 18+
- A running PostgreSQL instance

### Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/gtrman97/bug-tracker-back-end.git
   cd bug-tracker-back-end
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```
   # Database
   DATABASE_NAME=bug_tracker
   DATABASE_USERNAME=postgres
   DATABASE_PASSWORD=
   ENDPOINT=localhost

   # Auth
   JWT_SECRET=
   JWT_EXPIRES_IN=1d

   # CORS
   FRONTEND_ORIGIN=http://localhost:5173

   PORT=3000
   ```

   Generate a real `JWT_SECRET` rather than leaving it blank:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

   `FRONTEND_ORIGIN` must exactly match the origin the frontend is actually served from, or every request will fail CORS — this has been the single most common local setup issue in this project.

4. (Optional) Seed the database with sample data:
   ```bash
   npm run seed
   ```
   This drops and recreates all tables, then creates two users, a project, and three tickets across different statuses. Both seeded users have the password `password123`.

5. Start the server:
   ```bash
   npm run dev     # with autoreload
   # or
   npm start
   ```

   The server connects to Postgres, syncs models, and listens on `PORT` (default `3000`).

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the server with nodemon (autoreload on file changes) |
| `npm start` | Start the server normally |
| `npm run seed` | Reset the database and populate it with sample data |

## API Reference

All routes except `/auth/register` and `/auth/login` require a valid JWT in the `Authorization: Bearer <token>` header.

### Auth

| Method | Route | Description |
|---|---|---|
| `POST` | `/auth/register` | Create an account. Returns a JWT and the new user. |
| `POST` | `/auth/login` | Log in with email/password. Returns a JWT and the user. |
| `GET` | `/auth/me` | Return the currently authenticated user (used to restore a session after a page refresh). |

### Projects

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/projects` | Any logged-in user | Create a project. Creator is auto-granted an Admin membership. |
| `GET` | `/projects` | Any logged-in user | List projects the current user belongs to, with their role on each. |
| `POST` | `/projects/:projectId/members` | Admin/Manager on that project | Add a user to the project or change their role. |

### Tickets

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/tickets` | Any project member | Create a ticket on a project. |
| `GET` | `/tickets/project/:projectId` | Any project member | List tickets for a project. |
| `PATCH` | `/tickets/:id` | Any project member | Update a ticket. Project membership is derived from the ticket itself. |
| `DELETE` | `/tickets/:id` | Admin/Manager on that project | Delete a ticket. |

### Users

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/users` | Any logged-in user | List users (for assignee/member selection dropdowns). |

## Architecture Notes

**Custom JWT auth instead of a third-party provider (e.g. Auth0).** A working bcrypt-based `User` model and sign-in flow already existed, so switching providers would mean discarding functioning work for a compliance/scale requirement this project doesn't have yet. If that changes — e.g. onboarding real users — bcrypt hashes can be migrated into Auth0's custom database connection on next login without forcing a password reset, so this decision doesn't foreclose that path later.

**Authentication and authorization are separate files, deliberately.** `verifyToken.js` only answers "who is this?" and sets `req.user`. `requireRole.js` only answers "what can this user do on this project?" and never looks at how identity was established. Keeping them independent means either can change (e.g. swapping JWT for a different auth scheme) without touching the other.

**Roles live on `ProjectMembership`, not `User`.** A flat `role` column on `User` breaks the moment someone is an Admin on one project and a Submitter on another — the normal case for a multi-project tool. `ProjectMembership(userId, projectId, role)` is the single source of truth for permissions, with a unique composite index so a user can't end up with two roles on the same project even under a race condition.

**IDOR protection on ticket routes.** Any route that mutates an existing ticket loads that ticket first and reads its *actual* `projectId` from the database record before running the permission check — it never trusts a `projectId` supplied in the request body for something that already has one on record. This is the specific pattern (`attachTicketProject`) that stops a user from, say, patching someone else's ticket by guessing its ID and claiming a project they belong to in the request body.

**Login is timing- and enumeration-safe.** A login attempt against a nonexistent email still runs a bcrypt comparison (against a precomputed dummy hash) before responding, and returns the exact same error and status code as a wrong password. Both defends against timing attacks and prevents attackers from using the login endpoint to determine which emails are registered.

## Current Status

Backend Phase 1 (models, auth, roles, IDOR protection) is complete and verified against a real PostgreSQL database and real HTTP requests. Automated tests (Jest + Supertest), rate limiting, structured logging, and deployment have not been implemented yet.

## Roadmap

- [ ] Automated tests (Jest + Supertest) covering auth, `requireRole`, and the IDOR pattern specifically
- [ ] Rate limiting on `/auth/login` and `/auth/register`
- [ ] `helmet` for standard security headers
- [ ] Centralized error-handling middleware (no raw stack traces or Sequelize errors reaching the client)
- [ ] `/health` endpoint for DB connectivity checks
- [ ] Structured request logging
- [ ] Pagination on ticket/project list endpoints
- [ ] Deploy (Render/Railway/Fly) and verify CORS/env alignment against the deployed frontend

## Related Repository

- **Frontend:** [gtrman97/Bug-Tracker](https://github.com/gtrman97/Bug-Tracker) — React, Vite, JWT-based auth against this API